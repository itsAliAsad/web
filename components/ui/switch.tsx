"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps
    extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
    checked: boolean;
    onCheckedChange?: (checked: boolean) => void;
}

// Lightweight, dependency-free switch; mimics shadcn/radix API surface used in the app.
export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
    ({ className, checked, onCheckedChange, disabled, ...props }, ref) => {
        const handleToggle = () => {
            if (disabled) return;
            onCheckedChange?.(!checked);
        };

        return (
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                data-state={checked ? "checked" : "unchecked"}
                aria-disabled={disabled}
                ref={ref}
                onClick={handleToggle}
                className={cn(
                    "relative inline-flex h-5 w-10 items-center rounded-full transition-colors",
                    "border border-input bg-muted text-muted-foreground",
                    checked && "bg-primary",
                    disabled && "cursor-not-allowed opacity-60",
                    className
                )}
                {...props}
            >
                <span
                    className={cn(
                        "inline-block h-4 w-4 rounded-full bg-background shadow transition-transform",
                        "translate-x-1",
                        checked && "translate-x-5"
                    )}
                />
            </button>
        );
    }
);
Switch.displayName = "Switch";

export default Switch;
