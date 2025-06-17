import { NextResponse, type NextRequest } from "next/server";
import {
  PostgresJSConnection,
  PushProcessor,
  ZQLDatabase,
} from "@rocicorp/zero/pg";
import type { User } from "better-auth";
import { eq } from "drizzle-orm";
import { createLocalJWKSet, jwtVerify, type JWTPayload } from "jose";
import invariant from "tiny-invariant";

import { env } from "~/env";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { createMutators, safeTimestamp } from "~/zero";
import { schema } from "~/zero/schema";

const zqlDb = new ZQLDatabase(new PostgresJSConnection(db.$client), schema);

const pushProcessor = new PushProcessor(zqlDb);

export const POST = async (req: NextRequest) => {
  const authorization = req.headers.get("Authorization");

  if (!authorization) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let jwtPayload: JWTPayload;
  try {
    const jwt = authorization.replace(/^Bearer /i, "");
    const jwks = createLocalJWKSet(await auth.api.getJwks());
    const verifyResult = await jwtVerify(jwt, jwks, {
      issuer: env.BETTER_AUTH_URL,
      audience: env.BETTER_AUTH_URL,
    });
    jwtPayload = verifyResult.payload;
  } catch (error) {
    console.error("Error verifying JWT", error);
    return NextResponse.json(
      { error: "Failed to verify JWT" },
      { status: 401 },
    );
  }

  const userId = jwtPayload.sub;
  if (!userId) {
    console.error("JWT payload does not contain a user ID (sub)");
    return NextResponse.json(
      { error: "JWT payload does not contain a user ID (sub)" },
      { status: 401 },
    );
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 500 });
  }

  const asyncTasks: AsyncTask[] = [];

  const result = await pushProcessor.process(
    createServerMutators(user, asyncTasks),
    req.nextUrl.searchParams,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await req.json(),
  );

  const asyncTaskResults = await Promise.allSettled(
    asyncTasks.map((task) => task.run()),
  );

  let fatalErrorsCount = 0;
  for (const [index, asyncTaskResult] of asyncTaskResults.entries()) {
    if (asyncTaskResult.status === "rejected") {
      const task = asyncTasks[index]!;
      const log = task.allowFailure ? console.warn : console.error;
      log(`Task with name "${task.name}" failed:`, asyncTaskResult.reason);
      if (!task.allowFailure) {
        fatalErrorsCount++;
      }
    }
  }

  if (fatalErrorsCount > 0) {
    return NextResponse.json(
      {
        error: `${fatalErrorsCount.toString()} fatal error(s) occurred while processing push request`,
      },
      { status: 500 },
    );
  }

  return NextResponse.json(result);
};

function createServerMutators(user: User, asyncTasks: AsyncTask[]) {
  const clientMutators = createMutators(user);
  const _task = createTaskFn(asyncTasks);

  return {
    ...clientMutators,
    chats: {
      ...clientMutators.chats,
      pushAssistantMessageChunk: async (tx, input) => {
        const message = await tx.query.messages
          .where("id", "=", input.messageId)
          .one();
        if (message && message.status !== "streaming") return;
        invariant(tx.location === "server");
        if (input.chunkType === "first") {
          await tx.mutate.messages.insert({
            id: input.messageId,
            chatId: input.chatId,
            content: input.chunk,
            createdAt: safeTimestamp(tx, input.timestamp),
            role: `assistant/${input.model}`,
            userId: user.id,
            status: "streaming",
          });
        } else if (
          input.chunkType === "last" ||
          input.chunkType === "last-error"
        ) {
          await tx.dbTransaction.query(
            `UPDATE liquachat_message SET content = content || $1, status = $2 WHERE id = $3`,
            [
              input.chunk,
              input.chunkType === "last" ? "complete" : "error",
              input.messageId,
            ],
          );
        } else {
          await tx.dbTransaction.query(
            `UPDATE liquachat_message SET content = content || $1 WHERE id = $2`,
            [input.chunk, input.messageId],
          );
        }
      },
    },
  } as const satisfies typeof clientMutators;
}

interface AsyncTask {
  name: string;
  run: () => void | Promise<void>;
  allowFailure: boolean;
}

function createTaskFn(tasks: AsyncTask[]) {
  return (
    name: string,
    run: AsyncTask["run"],
    options: { allowFailure?: boolean } = {},
  ) => {
    tasks.push({
      name,
      run,
      allowFailure: options.allowFailure ?? false,
    });
  };
}
