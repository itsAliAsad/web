"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const user = useQuery(api.users.currentUser);
    const router = useRouter();

    useEffect(() => {
        if (user !== undefined && !user?.isAdmin) {
            router.push("/");
        }
    }, [user, router]);

    if (user === undefined) return <div>Loading...</div>;
    if (!user?.isAdmin) return null;

    return <>{children}</>;
}
