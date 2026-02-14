"use client";

import { useUser } from "@/lib/user-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

export function SuperUserToggle() {
    const { isSuper, setMode } = useUser();
    const router = useRouter();

    const handleToggle = (checked: boolean) => {
        // Optimistically update UI
        setMode(checked ? "super" : "normal");

        if (checked) {
            toast.success("Super User Mode enabled!", {
                description: "Advanced portfolio tools unlocked.",
                duration: 3000,
            });
            // Redirect to advanced dashboard
            router.push("/advanced");
        } else {
            toast.info("Super User Mode disabled.", {
                description: "Returned to standard view.",
                duration: 3000,
            });
            router.push("/dashboard");
        }
    };

    return (
        <Switch
            checked={isSuper}
            onCheckedChange={handleToggle}
            className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white/30 border-2 border-transparent"
        />
    );
}
