"use client";

import { createAuthClient } from "better-auth/react";
import {
  usernameClient,
  twoFactorClient,
  deviceAuthorizationClient,
  adminClient,
} from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";
import { ac, roles } from "./permissions";

/**
 * Browser Atrium ID client (Better Auth React SDK + plugins).
 */
export const authClient = createAuthClient({
  plugins: [
    usernameClient(),
    passkeyClient(),
    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.href = "/login/2fa";
      },
    }),
    deviceAuthorizationClient(),
    adminClient({ ac, roles }),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
