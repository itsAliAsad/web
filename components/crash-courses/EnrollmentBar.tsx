"use client";

import { Progress } from "@/components/ui/progress";
import { Users } from "lucide-react";

interface EnrollmentBarProps {
    current: number;
    max: number;
    min?: number;
    label?: string;
}

export default function EnrollmentBar({ current, max, min, label }: EnrollmentBarProps) {
    const percentage = Math.min((current / max) * 100, 100);
    const minMet = min ? current >= min : true;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {label ?? "Enrollment"}
                </span>
                <span className="font-semibold text-foreground">
                    {current}/{max} spots
                </span>
            </div>
            <Progress value={percentage} className="h-2.5" />
            {min && (
                <p className={`text-xs ${minMet ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {minMet
                        ? `✅ Minimum of ${min} met`
                        : `Min ${min} needed to run · ${min - current} more required`}
                </p>
            )}
        </div>
    );
}
