import { type NextRequest, NextResponse } from "next/server";
import {
  PostgresJSConnection,
  PushProcessor,
  ZQLDatabase,
} from "@rocicorp/zero/pg";
import { schema, type AuthData } from "~/zero/schema";
import { createMutators } from "~/zero";
import { db } from "~/server/db";
import { messages } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { loremMarkdown } from "~/lib/lorem-markdown";

const zqlDb = new ZQLDatabase(new PostgresJSConnection(db.$client), schema);

const pushProcessor = new PushProcessor(zqlDb);

export const POST = async (req: NextRequest) => {
  // TODO: get auth data from request
  const authData: AuthData = {
    sub: "a167ca4e-8edb-4f24-a453-24d53be7179c",
  };

  const asyncTasks: AsyncTask[] = [];

  const result = await pushProcessor.process(
    createServerMutators(authData, asyncTasks),
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

function createServerMutators(authData: AuthData, asyncTasks: AsyncTask[]) {
  const clientMutators = createMutators(authData);
  const task = createTaskFn(asyncTasks);

  return {
    ...clientMutators,
    chats: {
      ...clientMutators.chats,
      sendMessage: async (tx, input) => {
        await clientMutators.chats.sendMessage(tx, input);

        task(
          "insert tokens from llm while they are being generated",
          async () => {
            const assistantMessageId = crypto.randomUUID();
            const fullContent = loremMarkdown();
            let partialContent = "";

            let i = 0;
            while (i < fullContent.length) {
              const increment = Math.floor(Math.random() * 3) + 1;
              const token = fullContent.slice(i, i + increment);
              partialContent += token;

              if (i === 0) {
                await tx.mutate.messages.insert({
                  id: assistantMessageId,
                  chatId: input.chatId,
                  content: partialContent,
                  createdAt: Date.now(),
                  role: "assistant",
                  userId: authData.sub,
                });
              } else {
                await db
                  .update(messages)
                  .set({ content: partialContent })
                  .where(eq(messages.id, assistantMessageId));
              }

              await new Promise((resolve) => setTimeout(resolve, 3));

              i += increment;
            }
          },
        );
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
