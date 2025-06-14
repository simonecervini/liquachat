import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer, jwt, magicLink } from "better-auth/plugins";

import { env } from "~/env";
import { db } from "./db";
import { insertDemoChats } from "./db/seed";

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
    ...(env.NODE_ENV === "development"
      ? [
          magicLink({
            sendMagicLink: async (data) => {
              console.log(
                `[Auth] Open this link to sign in with email ${data.email}: ${data.url}`,
              );
            },
          }),
        ]
      : []),
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
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
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
