"use client";

import { createContext, useContext, ReactNode, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { usePathname, useRouter } from "next/navigation";

interface UserContextType {
  userId: string;
  displayName: string;
  email: string;
  isAuthenticated: boolean;
  isPending: boolean;
}

const UserContext = createContext<UserContextType>({
  userId: "",
  displayName: "Reader",
  email: "",
  isAuthenticated: false,
  isPending: true,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();

  const userId = session?.user?.id || "";
  const displayName = session?.user?.name || "Reader";
  const email = session?.user?.email || "";
  const isAuthenticated = !!session?.user;

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !isAuthenticated && !pathname.startsWith('/auth')) {
      router.push('/auth');
    }
  }, [isPending, isAuthenticated, pathname, router]);

  return (
    <UserContext.Provider value={{ userId, displayName, email, isAuthenticated, isPending }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  return useContext(UserContext);
}
