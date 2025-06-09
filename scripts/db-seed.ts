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
