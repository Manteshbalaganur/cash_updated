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
  setMode: (mode: UserMode) => Promise<void>;
  toggleMode: () => Promise<void>;
  isSuper: boolean;
  isLoaded: boolean;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useClerkUser();
  const [mode, setModeState] = useState<UserMode>("normal");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from Clerk metadata or localStorage on mount/user load
  useEffect(() => {
    if (!clerkLoaded) return;

    // Check Clerk Metadata first (Persisted Cross-Device)
    // We check unsafeMetadata (writable from client) and publicMetadata (writable from backend)
    const metaSuper = clerkUser?.unsafeMetadata?.superMode || clerkUser?.publicMetadata?.superMode;

    if (metaSuper === true) {
      setModeState("super");
    } else if (metaSuper === false) {
      setModeState("normal");
    } else {
      // Fallback to localStorage if not set in Clerk
      const savedMode = localStorage.getItem("user-mode") as UserMode;
      if (savedMode && (savedMode === "normal" || savedMode === "super")) {
        setModeState(savedMode);
      }
    }

    setIsLoaded(true);
  }, [clerkLoaded, clerkUser]);

  // Save to localStorage and Clerk Metadata whenever mode changes (triggered by user action)
  const setMode = useCallback(async (newMode: UserMode) => {
    // 1. Optimistic Update
    setModeState(newMode);
    localStorage.setItem("user-mode", newMode);

    // 2. Persist to Clerk (Cross-Device)
    if (clerkUser) {
      try {
        await clerkUser.update({
          unsafeMetadata: {
            superMode: newMode === "super"
          }
        });
      } catch (err) {
        console.error("Failed to update Clerk metadata:", err);
        // Optionally revert state here if strict consistency is needed
      }
    }
  }, [clerkUser]);

  const toggleMode = useCallback(async () => {
    const newMode = mode === "normal" ? "super" : "normal";
    await setMode(newMode);
  }, [mode, setMode]);

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
