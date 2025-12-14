"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";

type Theme = "light" | "dark" | "system";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const user = useQuery(api.users.currentUser);
    const updateTheme = useMutation(api.users.update);

    useEffect(() => {
        if (!user) return;

        const theme = (user.theme as Theme) || "system";
        applyTheme(theme);

        // Listen for system theme changes when in system mode
        if (theme === "system") {
            const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
            const handler = () => applyTheme("system");
            mediaQuery.addEventListener("change", handler);
            return () => mediaQuery.removeEventListener("change", handler);
        }
    }, [user?.theme]);

    const applyTheme = (theme: Theme) => {
        const root = document.documentElement;

        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            root.classList.remove("light", "dark");
            root.classList.add(systemTheme);
        } else {
            root.classList.remove("light", "dark");
            root.classList.add(theme);
        }
    };

    return <>{children}</>;
}
