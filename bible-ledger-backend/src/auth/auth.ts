import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const frontendUrl = process.env.FRONTEND_URL || '';

const isProduction = !!frontendUrl && frontendUrl.startsWith('https');

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "mock_client_id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock_client_secret",
    }
  },
  trustedOrigins: [
    ...(frontendUrl ? [frontendUrl] : []),
    "http://localhost:*",
    "http://127.0.0.1:*",
    "http://192.168.*",
    "http://10.*",
  ],
  // Cross-domain cookie config: required when frontend and backend are on different domains
  ...(isProduction ? {
    advanced: {
      defaultCookieAttributes: {
        sameSite: "none" as const,
        secure: true,
      },
    },
  } : {}),
});
