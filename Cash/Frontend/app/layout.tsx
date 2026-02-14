import React from "react"
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { UserProvider } from "@/lib/user-context";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const _inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CashMate - Intelligent Finance Management",
  description:
    "AI-powered finance tracker with smart expense tracking, investment recommendations, and real-time financial health monitoring.",
};

export const viewport: Viewport = {
  themeColor: "#4338CA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <UserProvider>
        <html lang="en" suppressHydrationWarning>
          <body className={_inter.className}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
            </ThemeProvider>
          </body>
        </html>
      </UserProvider>
    </ClerkProvider>
  );
}
