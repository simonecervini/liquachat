import type { CustomMutatorDefs, Transaction } from "@rocicorp/zero";
import type { User } from "better-auth";

import { Tree } from "~/lib/tree";
import type { ChatTreeNode } from "~/lib/types";
import type { Schema } from "./schema";

export function createMutators(user: User) {
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
            kind: "chat",
            chatId: input.id,
          },
          ...(chatTree?.data ?? []),
        ];
        await tx.mutate.chatTrees.upsert({
          id: input.chatTreeId ?? crypto.randomUUID(),
          userId: user.id,
          data: newChatTreeData,
        });
        await tx.mutate.chats.insert({
          id: input.id,
          title: "New Chat",
          userId: user.id,
          createdAt: safeTimestamp(tx, input.timestamp),
          updatedAt: safeTimestamp(tx, input.timestamp),
          public: false,
        });
      },
      delete: async (tx, input: { chatId: string }) => {
        const promises: Promise<unknown>[] = [
          tx.mutate.chats.delete({ id: input.chatId }),
        ];
        const chatTrees = await tx.query.chatTrees.where(
          "userId",
          "=",
          user.id,
        );
        for (const chatTree of chatTrees) {
          if (!chatTree.data) continue;
          const tree = new Tree(chatTree.data);
          const nodeToDelete = tree.findNode(
            (node) => node.kind === "chat" && node.chatId === input.chatId,
          );
          if (nodeToDelete) {
            promises.push(
              tx.mutate.chatTrees.update({
                id: chatTree.id,
                data: tree.removeNode(nodeToDelete.id).getNodes(),
              }),
            );
          }
        }
        await Promise.all(promises);
      },
      rename: async (
        tx,
        input: { id: string; title: string; newNodeId: string },
      ) => {
        const promises: Promise<unknown>[] = [];
        promises.push(
          tx.mutate.chats.update({
            id: input.id,
            title: input.title,
          }),
        );
        const chatTrees = await tx.query.chatTrees.where(
          "userId",
          "=",
          user.id,
        );
        for (const chatTree of chatTrees) {
          // We need to change "something" in the tree data to trigger a re-render
          // The tree view probably implements a lot of logic with global state and structural sharing to optimize re-renders
          // The `key` prop on the DynamicTreeItem or Tree component is not enough because we need to sync the change across all clients
          // Regenerating the id is not very elegant, but it works and have zero impact on the user
          // TODO: remove this when treeDataV2 is used everywhere
          if (!chatTree.data) continue;
          const tree = new Tree(chatTree.data);
          const node = tree.findNode(
            (node) => node.kind === "chat" && node.chatId === input.id,
          );
          if (node) {
            promises.push(
              tx.mutate.chatTrees.update({
                id: chatTree.id,
                data: tree
                  .updateNode(node.id, (node) => {
                    node.id = input.newNodeId;
                    return node;
                  })
                  .getNodes(),
              }),
            );
          }
        }
        await Promise.all(promises);
      },
      fork: async (
        tx,
        input: { chatId: string; forkedChatId: string; messageId: string },
      ) => {
        const chat = await tx.query.chats.where("id", "=", input.chatId).one();
        if (!chat) throw new ZeroMutatorError({ code: "NOT_FOUND" });
        const allChatTrees = await tx.query.chatTrees.where(
          "userId",
          "=",
          user.id,
        );
        function findChatInTree(
          nodes: ChatTreeNode[],
          chatId: string,
        ): boolean {
          return nodes.some((node) => {
            if (node.kind === "chat" && node.chatId === chatId) return true;
            if (node.childItems) return findChatInTree(node.childItems, chatId);
            return false;
          });
        }
        const chatTree = allChatTrees.find((tree) =>
          findChatInTree(tree.data ?? [], input.chatId),
        );
        if (!chatTree) throw new ZeroMutatorError({ code: "NOT_FOUND" });
        const newChatTreeData: ChatTreeNode[] = structuredClone(
          chatTree.data ?? [],
        );
        const referenceMessage = await tx.query.messages
          .where("id", "=", input.messageId)
          .one();
        if (!referenceMessage)
          throw new ZeroMutatorError({ code: "NOT_FOUND" });

        const messagesToClone = await tx.query.messages.where((eb) =>
          eb.and(
            eb.cmp("chatId", "=", input.chatId),
            eb.cmp("createdAt", "<=", referenceMessage.createdAt),
          ),
        );

        const timestamp = Date.now();

        await tx.mutate.chats.update({
          id: input.chatId,
          title: `${chat.title} (v1)`,
        });
        await tx.mutate.chats.insert({
          id: input.forkedChatId,
          title: `${chat.title} (v2)`,
          userId: user.id,
          createdAt: safeTimestamp(tx, timestamp),
          updatedAt: safeTimestamp(tx, timestamp),
          public: chat.public,
        });

        for (const message of messagesToClone) {
          await tx.mutate.messages.insert({
            id: crypto.randomUUID(),
            chatId: input.forkedChatId,
            content: message.content,
            role: message.role,
            status: message.status,
            userId: message.userId,
            createdAt: message.createdAt,
          });
        }

        function findAndReplaceNode(nodes: ChatTreeNode[]): ChatTreeNode[] {
          if (!chat) return nodes;
          return nodes.map((node) => {
            if (node.kind === "chat" && node.chatId === input.chatId) {
              return {
                id: crypto.randomUUID(),
                kind: "group",
                name: chat.title,
                childItems: [
                  { ...node, id: crypto.randomUUID() },
                  {
                    id: crypto.randomUUID(),
                    kind: "chat",
                    chatId: input.forkedChatId,
                  },
                ],
              };
            } else if (node.childItems) {
              return {
                ...node,
                childItems: findAndReplaceNode(node.childItems),
              };
            }
            return node;
          });
        }

        await tx.mutate.chatTrees.update({
          id: chatTree.id,
          data: findAndReplaceNode(newChatTreeData),
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
          status: "complete",
          userId: user.id,
        });
      },
      pushAssistantMessageChunk: async (
        tx,
        input: {
          messageId: string;
          chatId: string;
          chunk: string;
          chunkType: "first" | "middle" | "last" | "last-error";
          model: string;
          timestamp: number;
        },
      ) => {
        // This could be slow, but it's only called on the client side, so it's not a problem.
        // - on the client side, we update the whole message content every time a token is received.
        // - on the server side, we update the message content incrementally with a more efficient query.
        const message = await tx.query.messages
          .where("id", "=", input.messageId)
          .one();
        if (message && message.status !== "streaming") return;
        const prevContent = message?.content ?? "";
        await tx.mutate.messages.upsert({
          id: input.messageId,
          chatId: input.chatId,
          content: prevContent + input.chunk,
          createdAt: safeTimestamp(tx, input.timestamp),
          role: `assistant/${input.model}`,
          userId: user.id,
          status:
            input.chunkType === "last"
              ? "complete"
              : input.chunkType === "last-error"
                ? "error"
                : "streaming",
        });
      },
      abortChat: async (tx, input: { chatId: string }) => {
        const pendingMessages = await tx.query.messages.where((eb) =>
          eb.and(
            eb.cmp("chatId", "=", input.chatId),
            eb.cmp("status", "=", "streaming"),
          ),
        );
        const promises: Promise<unknown>[] = [];
        for (const message of pendingMessages) {
          promises.push(
            tx.mutate.messages.update({
              id: message.id,
              status: "aborted",
            }),
          );
        }
        await Promise.all(promises);
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
    chatTrees: {
      deleteGroup: async (
        tx,
        input: { chatTreeId: string; groupId: string },
      ) => {
        const chatTree = await tx.query.chatTrees
          .where("id", "=", input.chatTreeId)
          .one();
        if (!chatTree) throw new ZeroMutatorError({ code: "NOT_FOUND" });
        if (!chatTree.data) return;
        const tree = new Tree(chatTree.data);
        const nodeToDelete = tree.findNode(
          (node) => node.id === input.groupId && node.kind === "group",
        );
        if (!nodeToDelete) return;
        const subTree = new Tree([nodeToDelete]);
        const promises: Promise<unknown>[] = [];
        for (const node of subTree.filterNodes((n) => n.kind === "chat")) {
          if (node.kind === "chat") {
            promises.push(tx.mutate.chats.delete({ id: node.chatId }));
          }
        }
        promises.push(
          tx.mutate.chatTrees.update({
            id: input.chatTreeId,
            data: tree.removeNode(nodeToDelete.id).getNodes(),
          }),
        );
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
