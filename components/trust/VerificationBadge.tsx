"use client";

import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCircle2, ShieldCheck, Trophy } from "lucide-react";

type VerificationTier = "none" | "identity" | "academic" | "expert";
type BadgeSize = "sm" | "md" | "lg";

interface VerificationBadgeProps {
    tier: VerificationTier | undefined | null;
    size?: BadgeSize;
    className?: string;
}

const TIER_CONFIG: Record<
    Exclude<VerificationTier, "none">,
    {
        label: string;
        description: string;
        Icon: React.ElementType;
        colorClass: string;
        bgClass: string;
    }
> = {
    identity: {
        label: "Verified User",
        description: "Email and account verified via Clerk.",
        Icon: CheckCircle2,
        colorClass: "text-blue-500",
        bgClass: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
    },
    academic: {
        label: "Academic Verified",
        description: "At least one academic credential has been reviewed and approved by the Peer team.",
        Icon: ShieldCheck,
        colorClass: "text-emerald-500",
        bgClass: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
    },
    expert: {
        label: "Expert Tutor",
        description: "3+ verified credentials, rating ≥ 4.5, and 5+ completed sessions.",
        Icon: Trophy,
        colorClass: "text-amber-500",
        bgClass: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
    },
};

export default function VerificationBadge({
    tier,
    size = "md",
    className,
}: VerificationBadgeProps) {
    if (!tier || tier === "none") return null;

    const config = TIER_CONFIG[tier];
    const { Icon } = config;

    const iconSize = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4";

    if (size === "sm") {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className={cn("inline-flex items-center", className)}>
                            <Icon className={cn(iconSize, config.colorClass)} />
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="font-medium">{config.label}</p>
                        <p className="text-xs text-muted-foreground max-w-[200px]">{config.description}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    if (size === "md") {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span
                            className={cn(
                                "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border",
                                config.bgClass,
                                config.colorClass,
                                className
                            )}
                        >
                            <Icon className={iconSize} />
                            {config.label}
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="text-xs text-muted-foreground max-w-[220px]">{config.description}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // lg — full card style
    return (
        <div
            className={cn(
                "flex items-start gap-3 rounded-xl border p-4",
                config.bgClass,
                className
            )}
        >
            <Icon className={cn(iconSize, config.colorClass, "mt-0.5 shrink-0")} />
            <div>
                <p className={cn("font-semibold text-sm", config.colorClass)}>{config.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
            </div>
        </div>
    );
}
