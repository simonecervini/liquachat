#!/usr/bin/env bun
import { $ } from "bun";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";

await resetDatabase();

await $`pnpm run db:push`;

await db.insert(users).values({
  id: "a167ca4e-8edb-4f24-a453-24d53be7179c",
  chatTree: [
    {
      id: "projects",
      name: "Projects",
      kind: "group",
      childItems: [
        { id: "project-1", name: "Why is the sky blue?", kind: "chat" },
        {
          id: "project-2",
          name: "Capital Cities",
          kind: "group",
          childItems: [
            {
              id: "project-2A",
              name: "What is the capital of France?",
              kind: "chat",
            },
            {
              id: "project-2B",
              name: "What is the capital of Germany?",
              kind: "chat",
            },
            {
              id: "project-2C",
              name: "What is the capital of Italy?",
              kind: "chat",
            },
          ],
        },
        {
          id: "project-5",
          name: "Physics",
          kind: "group",
          childItems: [
            {
              id: "project-5A",
              name: "What is the speed of light?",
              kind: "chat",
            },
            {
              id: "project-5B",
              name: "Is the universe infinite?",
              kind: "chat",
            },
            {
              id: "project-5C",
              name: "What is the speed of an object?",
              kind: "chat",
            },
          ],
        },
      ],
    },
    {
      id: crypto.randomUUID(),
      name: "How to make a sandwich",
      kind: "chat",
    },
  ],
});

async function resetDatabase() {
  const query = sql<string>`SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE';
    `;

  const tables = await db.execute(query);

  for (const table of tables) {
    const tableName = z
      .object({
        table_name: z.string(),
      })
      .parse(table).table_name;
    const query = sql.raw(`TRUNCATE TABLE ${tableName} CASCADE;`);
    await db.execute(query);
  }
}

process.exit(0);
