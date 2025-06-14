#!/usr/bin/env bun
import { $ } from "bun";
import { sql } from "drizzle-orm";
import { z } from "zod";

import type { ChatTreeNode } from "~/lib/types";
import { db } from "~/server/db";
import { chats, chatTrees, messages, users } from "~/server/db/schema";
import { chatDefinitions, type ChatDefinition } from "./seed-data/_chats";

async function main() {
  await resetDatabase();
  await $`pnpm run db:push`;

  console.log("Database seeded successfully!");
}

function buildChatTree(definitions: ChatDefinition[]) {
  const chatTree: ChatTreeNode[] = [];
  const chatsToSeed: { id: string; contentFile: string }[] = [];

  for (const def of definitions) {
    const id = crypto.randomUUID();

    if (def.kind === "group") {
      const children = buildChatTree(def.items ?? []);
      const node: ChatTreeNode = {
        id,
        name: def.name,
        kind: "group",
        childItems: children.chatTree,
      };
      chatTree.push(node);
      chatsToSeed.push(...children.chatsToSeed);
    } else {
      const chatId = crypto.randomUUID();
      const node: ChatTreeNode = {
        id,
        name: def.name,
        kind: "chat",
        chatId,
      };

      if (def.contentFile) {
        chatsToSeed.push({ id: chatId, contentFile: def.contentFile });
      }

      chatTree.push(node);
    }
  }

  return { chatTree, chatsToSeed };
}

async function seedChat(
  chat: { id: string; contentFile: string },
  userId: string,
) {
  await db.insert(chats).values({
    id: chat.id,
    public: false,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const file = Bun.file(`scripts/seed-data/${chat.contentFile}`);
  const content = await file.text();
  const messageParts = content
    .split("---")
    .map((part) => part.replace(/### (user|assistant)\s*/, "").trim())
    .filter((part) => part.length > 0);

  let messageDate = new Date();

  for (let i = 0; i < messageParts.length; i++) {
    const isUser = i % 2 === 0;
    const messageContent = messageParts[i]!;

    if (isUser) {
      await db.insert(messages).values({
        id: crypto.randomUUID(),
        chatId: chat.id,
        userId,
        role: "user",
        content: messageContent,
        createdAt: messageDate,
      });
    } else {
      await db.insert(messages).values({
        id: crypto.randomUUID(),
        chatId: chat.id,
        role: "assistant",
        content: messageContent,
        createdAt: messageDate,
      });
    }

    messageDate = new Date(messageDate.getTime() + 1000);
  }
}

async function resetDatabase() {
  const query = sql<string>`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`;
  const tables = await db.execute(query);

  for (const table of tables) {
    const tableName = z
      .object({ table_name: z.string() })
      .parse(table).table_name;
    await db.execute(sql.raw(`TRUNCATE TABLE ${tableName} CASCADE`));
  }
}

await main().finally(() => process.exit(0));
