"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Users } from "lucide-react";

export default function WaitlistCounter() {
    const count = useQuery(api.waitlist.getWaitlistCount);

    if (count === undefined) {
        return (
            <div className="flex items-center justify-center gap-2 text-muted-foreground animate-pulse">
                <Users className="w-5 h-5" />
                <span>Loading...</span>
            </div>
        );
    }

    if (count === 0) {
        return (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Users className="w-5 h-5" />
                <span>Be the first to join!</span>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
            <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span className="text-amber-700 dark:text-amber-300 font-medium">
                <span className="font-bold animate-count">{count.toLocaleString()}</span>
                {" "}
                {count === 1 ? "person" : "people"} on the waitlist
            </span>
        </div>
    );
}
