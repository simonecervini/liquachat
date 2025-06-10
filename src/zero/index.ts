import type { CustomMutatorDefs, Transaction } from "@rocicorp/zero";
import type { AuthData } from "./schema";
import type { Schema } from "./schema";
import type { ChatTreeNode } from "~/lib/types";

export function createMutators(authData: AuthData) {
  return {
    chats: {
      init: async (tx, input: { id: string; timestamp: number }) => {
        const user = await tx.query.users.where("id", "=", authData.sub).one();
        if (!user) throw new ZeroMutatorError({ code: "UNAUTHORIZED" });
        const newChatTree: ChatTreeNode[] = [
          {
            id: crypto.randomUUID(),
            name: "New Chat",
            kind: "chat",
            chatId: input.id,
          },
          ...(user.chatTree ?? []),
        ];
        await tx.mutate.users.update({
          id: authData.sub,
          chatTree: newChatTree,
        });
        await tx.mutate.chats.insert({
          id: input.id,
          userId: authData.sub,
          createdAt: safeTimestamp(tx, input.timestamp),
          updatedAt: safeTimestamp(tx, input.timestamp),
          public: false,
        });
      },
      sendMessage: async (
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
          userId: authData.sub,
        });
      },
    },
  } as const satisfies CustomMutatorDefs<Schema>;
}

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
