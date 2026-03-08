"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "profile_completeness_dismissed_v1";

interface ProfileCompletenessCardProps {
    role: "tutor" | "student";
}

export default function ProfileCompletenessCard({ role }: ProfileCompletenessCardProps) {
    const [dismissed, setDismissed] = useState(false);
    const [mounted, setMounted] = useState(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tutorData = useQuery(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (api as any).profile_completeness.getTutorCompleteness,
        role === "tutor" ? {} : "skip"
    ) as { score: number; completed: number; total: number; items: Array<{ id: string; label: string; complete: boolean; href: string }> } | null | undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const studentData = useQuery(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (api as any).profile_completeness.getStudentCompleteness,
        role === "student" ? {} : "skip"
    ) as { score: number; completed: number; total: number; items: Array<{ id: string; label: string; complete: boolean; href: string }> } | null | undefined;

    const data = role === "tutor" ? tutorData : studentData;

    useEffect(() => {
        setMounted(true);
        try {
            const stored = localStorage.getItem(DISMISS_KEY);
            if (stored === "true") setDismissed(true);
        } catch {
            // SSR / privacy mode
        }
    }, []);

    if (!mounted || dismissed || data === undefined || data === null) return null;

    const { score, completed, total, items } = data;
    const incomplete = items.filter((i) => !i.complete).slice(0, 3);

    // Auto-dismiss if ≥90 and user had previously dismissed
    const handleDismiss = () => {
        if (score >= 90) {
            try { localStorage.setItem(DISMISS_KEY, "true"); } catch { /* noop */ }
        }
        setDismissed(true);
    };

    // Color palette based on completion
    const { bgClass, barClass, textClass, borderClass } =
        score >= 90
            ? {
                bgClass: "bg-emerald-50 dark:bg-emerald-950/30",
                barClass: "bg-emerald-500",
                textClass: "text-emerald-700 dark:text-emerald-300",
                borderClass: "border-emerald-200 dark:border-emerald-800",
              }
            : score >= 60
            ? {
                bgClass: "bg-blue-50 dark:bg-blue-950/30",
                barClass: "bg-blue-500",
                textClass: "text-blue-700 dark:text-blue-300",
                borderClass: "border-blue-200 dark:border-blue-800",
              }
            : {
                bgClass: "bg-amber-50 dark:bg-amber-950/30",
                barClass: "bg-amber-500",
                textClass: "text-amber-700 dark:text-amber-300",
                borderClass: "border-amber-200 dark:border-amber-800",
              };

    const headline =
        score >= 90
            ? "Your profile looks great!"
            : score >= 60
            ? "Your profile is almost complete"
            : `Your ${role} profile needs a few more details`;

    return (
        <div
            className={cn(
                "rounded-2xl border px-5 py-4 mb-8 relative",
                bgClass,
                borderClass,
            )}
        >
            {/* Dismiss button */}
            <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-black/10 transition-colors"
                aria-label="Dismiss"
            >
                <X className="h-4 w-4 text-muted-foreground" />
            </button>

            <div className="flex items-start gap-4">
                {/* Left: text + progress */}
                <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-semibold mb-2 pr-6", textClass)}>
                        ✦ {headline}
                    </p>

                    {/* Progress bar */}
                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1 h-2 rounded-full bg-black/10 overflow-hidden">
                            <div
                                className={cn("h-full rounded-full transition-all duration-500", barClass)}
                                style={{ width: `${score}%` }}
                            />
                        </div>
                        <span className={cn("text-xs font-bold tabular-nums shrink-0", textClass)}>
                            {completed} / {total}
                        </span>
                    </div>

                    {/* Incomplete items */}
                    {incomplete.length > 0 && (
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-medium mb-1">Still needed:</p>
                            {incomplete.map((item) => (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 opacity-50" />
                                    {item.label}
                                    <ArrowRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
