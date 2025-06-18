import {
  anonymousClient,
  inferAdditionalFields,
  jwtClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import type { auth } from "~/server/auth";

export const authClient = createAuthClient({
  plugins: [
    jwtClient(),
    inferAdditionalFields<typeof auth>(),
    anonymousClient(),
  ],
});
