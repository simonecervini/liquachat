import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer, jwt, magicLink } from "better-auth/plugins";

import { env } from "~/env";
import { db } from "./db";

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
