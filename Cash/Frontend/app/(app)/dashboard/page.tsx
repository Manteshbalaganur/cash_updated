"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/user-context";
import { NormalDashboard } from "@/components/dashboard/normal-dashboard";

export default function DashboardPage() {
  const { isSuper, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSuper) {
      router.replace("/advanced");
    }
  }, [isSuper, isLoaded, router]);

  if (!isLoaded || isSuper) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <NormalDashboard />;
}
