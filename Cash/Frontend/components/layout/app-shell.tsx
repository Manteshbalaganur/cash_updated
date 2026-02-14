"use client";

import type { ReactNode } from "react";
import { Navbar } from "./navbar";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 px-4 py-8 md:px-8 lg:px-12">{children}</main>
    </div>
  );
}
