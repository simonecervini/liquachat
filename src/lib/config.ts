import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

export const LiquaConfigSchema = z.object({
  auth: z.object({
    allowGuests: z.preprocess(
      (x) =>
        x === true ||
        (typeof x === "string" && x.trim().toLowerCase() === "true"),
      z.boolean(),
    ),
    socialProviders: z
      .enum([
        // TODO: add more social providers here
        "github", // Required env vars: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
        "google", // Required env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
      ])
      .array()
      .optional(),
  }),
});

export type LiquaConfig = z.output<typeof LiquaConfigSchema>;

export const DEFAULT_LIQUA_CONFIG: LiquaConfig = Object.freeze({
  auth: {
    allowGuests: true,
  },
});

let cachedConfig: LiquaConfig | null = null;
export function getConfig(): LiquaConfig {
  if (!cachedConfig) {
    let fileContent: string | undefined =
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      process.env.LIQUA_CONFIG_JSON || undefined;

    if (!fileContent) {
      try {
        fileContent = fs.readFileSync(
          path.join(process.cwd(), "liqua.config.json"),
          "utf-8",
        );
      } catch {
        console.warn(
          "Warning: no liqua.config.json found, using default config",
        );
        cachedConfig = DEFAULT_LIQUA_CONFIG;
        return cachedConfig;
      }
    }

    try {
      const config = Object.freeze(
        LiquaConfigSchema.parse(JSON.parse(fileContent)),
      );
      cachedConfig = config;
    } catch (error) {
      throw new Error(
        "Failed to parse Liqua config (from liqua.config.json file or LIQUA_CONFIG_JSON environment variable). The configuration must contain valid JSON that matches the LiquaConfigSchema. Please fix any errors and restart the server.",
        { cause: error },
      );
    }
  }

  return cachedConfig;
}
