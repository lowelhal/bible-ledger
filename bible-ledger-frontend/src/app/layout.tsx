import type { Metadata } from "next";
import ClientLayout from "./client-layout";

export const metadata: Metadata = {
  title: "Bible Ledger",
  description: "Track your Bible reading journey.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <ClientLayout>{children}</ClientLayout>;
}
