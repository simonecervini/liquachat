// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { relations } from "drizzle-orm";
import { index, pgTableCreator } from "drizzle-orm/pg-core";

import type { ChatTreeNode } from "~/lib/types";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `liquachat_${name}`);

export const users = createTable("user", (d) => ({
  id: d.uuid().primaryKey(),
}));

export const usersRelations = relations(users, ({ many }) => ({
  chatTrees: many(chatTrees),
}));

export const chatTrees = createTable("chat_tree", (d) => ({
  id: d.uuid().primaryKey(),
  userId: d
    .uuid()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  data: d.json().$type<ChatTreeNode[]>(),
}));

export const chatTreesRelations = relations(chatTrees, ({ one }) => ({
  user: one(users, {
    fields: [chatTrees.userId],
    references: [users.id],
  }),
}));

export const chats = createTable(
  "chat",
  (d) => ({
    id: d.uuid().primaryKey(),
    public: d.boolean().notNull(),
    userId: d
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: d.timestamp().notNull(),
    updatedAt: d.timestamp().notNull(),
  }),
  (table) => [index("chat_user_id_idx").on(table.userId)],
);

export const chatsRelations = relations(chats, ({ many }) => ({
  messages: many(messages),
}));

export const messages = createTable(
  "message",
  (d) => ({
    id: d.uuid().primaryKey(),
    chatId: d
      .uuid()
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    userId: d.uuid().references(() => users.id, { onDelete: "cascade" }),
    role: d.text({ enum: ["user", "assistant"] }).notNull(),
    content: d.text().notNull(),
    createdAt: d.timestamp().notNull(),
  }),
  (table) => [
    index("message_chat_id_idx").on(table.chatId),
    index("message_user_id_idx").on(table.userId),
  ],
);

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
}));
