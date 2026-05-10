"use client";

import { createContext, useContext, ReactNode, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { usePathname, useRouter } from "next/navigation";

interface UserContextType {
  userId: string;
  displayName: string;
  isAuthenticated: boolean;
  isPending: boolean;
}

const UserContext = createContext<UserContextType>({
  userId: "user-123",
  displayName: "Reader",
  isAuthenticated: false,
  isPending: true,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();

  const userId = session?.user?.id || "user-123";
  const displayName = session?.user?.name || "Reader";
  const isAuthenticated = !!session?.user;

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !isAuthenticated && !pathname.startsWith('/auth')) {
      router.push('/auth');
    }
  }, [isPending, isAuthenticated, pathname, router]);

  return (
    <UserContext.Provider value={{ userId, displayName, isAuthenticated, isPending }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  return useContext(UserContext);
}
