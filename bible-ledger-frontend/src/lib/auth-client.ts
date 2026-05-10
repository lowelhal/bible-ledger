import { createAuthClient } from "better-auth/react";

function getAuthBaseURL(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") {
    // Match the API URL logic in api.ts — target port 3000 on whichever host the user is visiting
    return `${window.location.protocol}//${window.location.hostname}:3000`;
  }
  return "http://localhost:3000";
}

export const authClient = createAuthClient({
    baseURL: getAuthBaseURL(),
});

export const { signIn, signUp, signOut, useSession } = authClient;
