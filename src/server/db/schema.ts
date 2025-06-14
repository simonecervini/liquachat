// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { relations } from "drizzle-orm";
import { index } from "drizzle-orm/pg-core";

import type { ChatTreeNode } from "~/lib/types";
import { createTable } from "./create-table";
import * as authSchema from "./schema-auth";

export const users = authSchema.users;
export const sessions = authSchema.sessions;
export const accounts = authSchema.accounts;
export const verifications = authSchema.verifications;
export const jwkss = authSchema.jwkss;

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
