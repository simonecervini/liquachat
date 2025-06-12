import { NextResponse, type NextRequest } from "next/server";
import {
  PostgresJSConnection,
  PushProcessor,
  ZQLDatabase,
} from "@rocicorp/zero/pg";
import { eq } from "drizzle-orm";
import invariant from "tiny-invariant";

import { loremMarkdown } from "~/lib/lorem-markdown";
import { db } from "~/server/db";
import { messages } from "~/server/db/schema";
import { chats_updateMessageImpl, createMutators, safeTimestamp } from "~/zero";
import { schema, type AuthData } from "~/zero/schema";

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

  const pushResponseTokens = async (input: {
    chatId: string;
    question: string;
  }) => {
    const assistantMessageId = crypto.randomUUID();
    const fullContent = `"${input.question}" is a very good question. Let's answer it.\n${loremMarkdown()}`;
    let partialContent = "";

    let i = 0;
    while (i < fullContent.length) {
      const increment = Math.floor(Math.random() * 3) + 1;
      const token = fullContent.slice(i, i + increment);
      partialContent += token;
      if (i === 0) {
        await db.insert(messages).values({
          id: assistantMessageId,
          chatId: input.chatId,
          content: partialContent,
          createdAt: new Date(),
          role: "assistant",
          userId: authData.sub,
        });
      } else {
        await db
          .update(messages)
          .set({ content: partialContent })
          .where(eq(messages.id, assistantMessageId));
      }

      await new Promise((resolve) => setTimeout(resolve, 1));

      i += increment;
    }
  };

  return {
    ...clientMutators,
    chats: {
      ...clientMutators.chats,
      pushAssistantMessageChunk: async (tx, input) => {
        invariant(tx.location === "server");
        if (input.isFirstChunk) {
          await tx.mutate.messages.insert({
            id: input.messageId,
            chatId: input.chatId,
            content: input.chunk,
            createdAt: safeTimestamp(tx, input.timestamp),
            role: "assistant",
            userId: authData.sub,
          });
        } else {
          await tx.dbTransaction.query(
            `UPDATE liquachat_message SET content = content || $1 WHERE id = $2`,
            [input.chunk, input.messageId],
          );
        }
      },
      updateMessage: async (tx, input) => {
        const { newMessageContent, chatId } = await chats_updateMessageImpl(
          tx,
          input,
        );
        task("reply to user's updated message", async () => {
          await pushResponseTokens({
            chatId,
            question: newMessageContent,
          });
        });
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
