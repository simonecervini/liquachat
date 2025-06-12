import { createUseZero } from "@rocicorp/zero/react";

import type { createMutators } from ".";
import type { Schema } from "./schema";

export const useZero = createUseZero<
  Schema,
  ReturnType<typeof createMutators>
>();

export type Zero = ReturnType<typeof useZero>;
