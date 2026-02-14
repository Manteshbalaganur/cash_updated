import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/"]);

if (!process.env.CLERK_SECRET_KEY) {
    console.warn("⚠️ CLERK_SECRET_KEY is missing from environment variables.");
}

export default clerkMiddleware(async (auth, req) => {
    const { userId } = await auth();
    const isPublic = isPublicRoute(req);

    // If user is logged in and tries to access sign-in, sign-up, or the landing page, redirect to dashboard
    if (userId && isPublic) {
        // Exception: Stay on home if they are specifically trying to view the landing page (optional)
        // But usually for a dashboard app, we send them straight to dashboard.
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Default protection for all other routes
    if (!isPublic) {
        await auth.protect();
    }
}, {
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
