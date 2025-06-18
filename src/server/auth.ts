import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous, bearer, jwt } from "better-auth/plugins";
import { z } from "zod";

import { getConfig } from "~/lib/config";
import { db } from "./db";
import { insertDemoChats } from "./db/seed";

const liquaConfig = getConfig();

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
  }),
  plugins: [
    bearer(),
    jwt({
      jwt: {
        expirationTime: "1h",
      },
    }),
    ...(liquaConfig.auth.allowGuests ? [anonymous()] : []),
  ],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            await insertDemoChats(user.id);
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Unknown error";
            console.error(
              `[Auth] Error inserting demo chats for user ${user.id}: ${message}`,
            );
          }
        },
      },
    },
  },
  socialProviders: {
    github: liquaConfig.auth.socialProviders?.includes("github")
      ? {
          clientId: z.string().min(1).parse(process.env.GITHUB_CLIENT_ID),
          clientSecret: z
            .string()
            .min(1)
            .parse(process.env.GITHUB_CLIENT_SECRET),
        }
      : undefined,
    google: liquaConfig.auth.socialProviders?.includes("google")
      ? {
          clientId: z.string().min(1).parse(process.env.GOOGLE_CLIENT_ID),
          clientSecret: z
            .string()
            .min(1)
            .parse(process.env.GOOGLE_CLIENT_SECRET),
        }
      : undefined,
  },
  advanced: {
    database: {
      generateId: () => {
        return crypto.randomUUID();
      },
    },
  },
});

export type Auth = typeof auth;
export type Session = Auth["$Infer"]["Session"];
