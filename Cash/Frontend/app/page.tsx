import { SignedIn, SignedOut, SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
      <SignIn
        routing="hash"
        fallbackRedirectUrl="/dashboard"
        forceRedirectUrl="/dashboard"
      />
    </div>
  );
}
