import type { CustomMutatorDefs, Transaction } from "@rocicorp/zero";

import type { ChatTreeNode } from "~/lib/types";
import type { AuthData, Schema } from "./schema";

export function createMutators(authData: AuthData) {
  return {
    chats: {
      init: async (
        tx,
        // Pass `chatTreeId: null` to create a new chat tree with a new chat.
        input: { id: string; timestamp: number; chatTreeId: string | null },
      ) => {
        const getChatTree = async () => {
          if (!input.chatTreeId) return null;
          const chatTree = await tx.query.chatTrees
            .where("id", "=", input.chatTreeId)
            .one();
          if (!chatTree) throw new ZeroMutatorError({ code: "NOT_FOUND" });
          return chatTree;
        };
        const chatTree = await getChatTree();
        const newChatTreeData: ChatTreeNode[] = [
          {
            id: crypto.randomUUID(),
            name: "New Chat",
            kind: "chat",
            chatId: input.id,
          },
          ...(chatTree?.data ?? []),
        ];
        await tx.mutate.chatTrees.upsert({
          id: input.chatTreeId ?? crypto.randomUUID(),
          userId: authData.user.id,
          data: newChatTreeData,
        });
        await tx.mutate.chats.insert({
          id: input.id,
          userId: authData.user.id,
          createdAt: safeTimestamp(tx, input.timestamp),
          updatedAt: safeTimestamp(tx, input.timestamp),
          public: false,
        });
      },
      sendUserMessage: async (
        tx,
        input: {
          id: string;
          chatId: string;
          content: string;
          timestamp: number;
        },
      ) => {
        await tx.mutate.messages.insert({
          id: input.id,
          chatId: input.chatId,
          content: input.content,
          createdAt: safeTimestamp(tx, input.timestamp),
          role: "user",
          userId: authData.user.id,
        });
      },
      pushAssistantMessageChunk: async (
        tx,
        input: {
          messageId: string;
          chatId: string;
          chunk: string;
          isFirstChunk: boolean;
          timestamp: number;
        },
      ) => {
        // This could be slow, but it's only called on the client side, so it's not a problem.
        // - on the client side, we update the whole message content every time a token is received.
        // - on the server side, we update the message content incrementally with a more efficient query.
        const message = await tx.query.messages
          .where("id", "=", input.messageId)
          .one();
        const prevContent = message?.content ?? "";
        await tx.mutate.messages.upsert({
          id: input.messageId,
          chatId: input.chatId,
          content: prevContent + input.chunk,
          createdAt: safeTimestamp(tx, input.timestamp),
          role: "assistant",
          userId: authData.user.id,
        });
      },
      updateMessage: async (
        tx,
        input: {
          id: string;
          content: string;
          timestamp: number;
        },
      ) => {
        const promises = await getDeleteLaterMessagesPromises(tx, {
          messageId: input.id,
          includeMessage: false,
        });
        promises.push(
          tx.mutate.messages.update({
            id: input.id,
            content: input.content,
            createdAt: safeTimestamp(tx, input.timestamp),
          }),
        );
        await Promise.all(promises);
      },
      deleteLaterMessages: async (
        tx,
        input: {
          messageId: string;
          includeMessage: boolean;
        },
      ) => {
        const promises = await getDeleteLaterMessagesPromises(tx, input);
        await Promise.all(promises);
      },
    },
  } as const satisfies CustomMutatorDefs<Schema>;
}

// -- Functions --

export async function getDeleteLaterMessagesPromises(
  tx: Transaction<Schema>,
  input: {
    messageId: string;
    includeMessage: boolean;
  },
) {
  const message = await tx.query.messages
    .where("id", "=", input.messageId)
    .one();
  if (!message) throw new ZeroMutatorError({ code: "NOT_FOUND" });
  const oldTimestamp = message.createdAt;
  const promises: Promise<unknown>[] = [];
  // TODO: optimize this when "update .. where .." is supported in ZQL
  const laterMessages = await tx.query.messages.where((eb) =>
    eb.and(
      eb.cmp("chatId", "=", message.chatId),
      eb.cmp("createdAt", input.includeMessage ? ">=" : ">", oldTimestamp),
    ),
  );
  for (const laterMessage of laterMessages) {
    promises.push(tx.mutate.messages.delete({ id: laterMessage.id }));
  }
  return promises;
}

// -- Utils --

export type ZeroMutatorErrorCode = "NOT_FOUND" | "UNAUTHORIZED";
export class ZeroMutatorError extends Error {
  public readonly code: ZeroMutatorErrorCode;

  constructor(input: { code: ZeroMutatorErrorCode }) {
    super(`Zero mutator error: ${input.code}`);
    this.name = "ZeroMutatorError";
    this.code = input.code;
  }
}

export function safeTimestamp(
  tx: Transaction<Schema>,
  clientTimestamp: number,
) {
  // Zero is a server-authoritative sync engine.
  // The client mutator is discarded as soon as the result from the server mutator is known.
  //
  // A timestamp provided by the client will be always overridden by the server.
  // While it's true that you shouldn't trust the client-provided timestamp,
  // we don't want to trigger a re-render only because of a few milliseconds of mismatch.

  const now = Date.now();
  if (tx.location === "client") {
    return clientTimestamp;
  } else {
    return Math.abs(clientTimestamp - now) < 10_000 ? now : clientTimestamp;
  }
}
