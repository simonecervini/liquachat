import { drizzleZeroConfig } from "drizzle-zero";

import * as drizzleSchema from "./src/server/db/schema";

export default drizzleZeroConfig(drizzleSchema, {
  // Specify which tables and columns to include in the Zero schema.
  // This allows for the "expand/migrate/contract" pattern recommended in the Zero docs.
  // When a column is first added, it should be set to false, and then changed to true
  // once the migration has been run.

  // All tables/columns must be defined, but can be set to false to exclude them from the Zero schema.
  // Column names match your Drizzle schema definitions
  tables: {
    users: {
      createdAt: true,
      email: true,
      emailVerified: true,
      id: true,
      image: true,
      name: true,
      updatedAt: true,
      isAnonymous: true,
    },
    sessions: false,
    accounts: false,
    verifications: false,
    jwkss: false,
    chats: {
      title: true,
      createdAt: true,
      id: true,
      public: true,
      updatedAt: true,
      userId: true,
      customInstructions: true,
    },
    chatTrees: {
      data: true,
      id: true,
      userId: true,
    },
    messages: {
      chatId: true,
      content: true,
      createdAt: true,
      id: true,
      role: true,
      status: true,
      userId: true,
    },
  },
});
