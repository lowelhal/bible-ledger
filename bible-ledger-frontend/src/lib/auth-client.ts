import { createAuthClient } from "better-auth/react";

function getAuthBaseURL(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    // NEXT_PUBLIC_API_URL is like "https://bible-ledger.onrender.com/v1"
    // Auth routes are at the root, so strip /v1
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/v1\/?$/, '');
  }
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:3000`;
  }
  return "http://localhost:3000";
}

export const authClient = createAuthClient({
    baseURL: getAuthBaseURL(),
});

export const { signIn, signUp, signOut, useSession } = authClient;
