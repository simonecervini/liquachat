import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    ZERO_UPSTREAM_DB: z.string(),
    ZERO_REPLICA_FILE: z.string(),
    ZERO_AUTH_JWKS_URL: z.string(),
    ZERO_PUSH_URL: z.string(),
    BETTER_AUTH_URL: z.string(),
    BETTER_AUTH_SECRET: z.string(),
    GITHUB_CLIENT_ID: z.string(),
    GITHUB_CLIENT_SECRET: z.string(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_ZERO_SERVER_URL: z.string(),
    NEXT_PUBLIC_NODE_ENV: z.enum(["development", "test", "production"]),
    NEXT_PUBLIC_BETTER_AUTH_ALLOW_ANONYMOUS: z
      .preprocess(
        (x) =>
          x === true || (typeof x === "string" && x.toLowerCase() === "true"),
        z.boolean(),
      )
      .default(false),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    // server
    NODE_ENV: process.env.NODE_ENV,
    ZERO_UPSTREAM_DB: process.env.ZERO_UPSTREAM_DB,
    ZERO_REPLICA_FILE: process.env.ZERO_REPLICA_FILE,
    ZERO_AUTH_JWKS_URL: process.env.ZERO_AUTH_JWKS_URL,
    ZERO_PUSH_URL: process.env.ZERO_PUSH_URL,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    // client
    NEXT_PUBLIC_ZERO_SERVER_URL: process.env.NEXT_PUBLIC_ZERO_SERVER_URL,
    NEXT_PUBLIC_NODE_ENV: process.env.NEXT_PUBLIC_NODE_ENV,
    NEXT_PUBLIC_BETTER_AUTH_ALLOW_ANONYMOUS:
      process.env.NEXT_PUBLIC_BETTER_AUTH_ALLOW_ANONYMOUS,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
