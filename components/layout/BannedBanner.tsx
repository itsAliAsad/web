"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function BannedBanner() {
    const user = useQuery(api.users.currentUser);

    if (!user?.isBanned) return null;

    return (
        <div className="bg-red-50 border-b border-red-200 text-red-900">
            <div className="container px-6 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="font-semibold">Your account has been banned.</p>
                    <p className="text-sm text-red-800">Actions are blocked. Contact support if you believe this is a mistake.</p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="destructive" size="sm">
                        <Link href="/sign-out">Sign out</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
