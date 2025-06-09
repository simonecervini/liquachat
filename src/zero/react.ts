import { createUseZero } from "@rocicorp/zero/react";
import type { Schema } from "./schema";
import type { createMutators } from ".";

export const useZero = createUseZero<
  Schema,
  ReturnType<typeof createMutators>
>();

export type Zero = ReturnType<typeof useZero>;
