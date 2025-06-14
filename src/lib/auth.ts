import {
  inferAdditionalFields,
  jwtClient,
  magicLinkClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { env } from "~/env";
import type { auth } from "~/server/auth";

export const authClient = createAuthClient({
  plugins: [
    jwtClient(),
    inferAdditionalFields<typeof auth>(),
    ...(env.NEXT_PUBLIC_ZERO_SERVER_URL.includes("localhost")
      ? [magicLinkClient()]
      : []),
  ],
});
