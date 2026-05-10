import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
    // Production
    "https://bible-ledger.vercel.app",
    "https://bible-ledger.onrender.com",
    // Dynamic from env
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
    // Local development
    "http://localhost:*",
    "http://127.0.0.1:*",
    "http://192.168.*",
    "http://10.*",
  ],
});
