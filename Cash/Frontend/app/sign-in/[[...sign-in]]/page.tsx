import { SignedIn, SignedOut, SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default function Page() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <SignedIn>
                {redirect("/dashboard")}
            </SignedIn>
            <SignedOut>
                <SignIn
                    fallbackRedirectUrl="/dashboard"
                    forceRedirectUrl="/dashboard"
                />
            </SignedOut>
        </div>
    );
}
