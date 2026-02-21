"use client";

import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/lib/user-context";
import { normalNavItems, superNavItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const { user, isSuper } = useUser();
  const navItems = isSuper ? superNavItems : normalNavItems;

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-card px-6 py-3">
      {/* Logo + Welcome */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-foreground">
            <rect x="2" y="3" width="20" height="18" rx="2" />
            <path d="M12 8v8" />
            <path d="M8 12h8" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">CashMate</h1>
          <p className="text-xs text-muted-foreground">
            <SignedIn>
              Welcome back,{" "}
              <span className="font-medium">{user.name}</span>
              {isSuper && (
                <span className="ml-1.5 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                  Super
                </span>
              )}
            </SignedIn>
            <SignedOut>
              Welcome to CashMate
            </SignedOut>
          </p>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="hidden items-center gap-1 md:flex">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Auth Section */}
      <div className="flex items-center gap-4">
        <SignedIn>
          <Link
            href="/profile"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Profile & Settings
          </Link>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "h-9 w-9"
              }
            }}
          />
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
      </div>
    </header>
  );
}
