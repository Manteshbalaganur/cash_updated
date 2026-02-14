"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useUser as useClerkUser } from "@clerk/nextjs";

// ============================================================
// USER MODE CONTEXT
// Controls Normal vs Super user mode throughout the app.
// ============================================================

export type UserMode = "normal" | "super";

export interface UserProfile {
  name: string;
  email: string;
  imageUrl: string;
  mode: UserMode;
}

interface UserContextValue {
  user: UserProfile;
  mode: UserMode;
  setMode: (mode: UserMode) => void;
  toggleMode: () => void;
  isSuper: boolean;
  isLoaded: boolean;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useClerkUser();
  const [mode, setModeState] = useState<UserMode>("normal");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem("user-mode") as UserMode;
    if (savedMode && (savedMode === "normal" || savedMode === "super")) {
      setModeState(savedMode);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever mode changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("user-mode", mode);
    }
  }, [mode, isLoaded]);

  const setMode = useCallback((newMode: UserMode) => {
    setModeState(newMode);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => (prev === "normal" ? "super" : "normal"));
  }, []);

  const value: UserContextValue = {
    user: {
      name: clerkUser?.firstName || clerkUser?.fullName || "User",
      email: clerkUser?.primaryEmailAddress?.emailAddress || "",
      imageUrl: clerkUser?.imageUrl || "",
      mode,
    },
    mode,
    setMode,
    toggleMode,
    isSuper: mode === "super",
    isLoaded: clerkLoaded && isLoaded,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
