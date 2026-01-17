"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "path_dismissed_announcements";

export default function AnnouncementsBar() {
    const announcements = useQuery(api.admin.getAnnouncements);
    const [dismissedIds, setDismissedIds] = useState<string[]>([]);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) setDismissedIds(JSON.parse(stored));
        } catch (error) {
            console.error("Failed to read dismissed announcements", error);
        }
    }, []);

    useEffect(() => {
        if (isMounted) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissedIds));
        }
    }, [dismissedIds, isMounted]);

    const visible = useMemo(() => {
        if (!announcements) return [];
        return announcements.filter((a) => !dismissedIds.includes(a._id));
    }, [announcements, dismissedIds]);

    if (!isMounted) return null;

    return (
        <AnimatePresence>
            {visible.length > 0 && (
                <div className="flex flex-col w-full z-50 relative">
                    {visible.map((announcement) => (
                        <motion.div
                            key={announcement._id}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="relative overflow-hidden border-b border-foreground/10"
                        >
                            {/* Premium gradient background with glassmorphism */}
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/90 via-orange-500/90 to-pink-500/90 dark:from-amber-600/25 dark:via-orange-600/25 dark:to-pink-600/25" />
                            <div className="absolute inset-0 backdrop-blur-sm bg-white/40 dark:bg-[oklch(0.18_0.018_280)]/80" />

                            {/* Subtle shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent dark:from-white/5" />

                            <div className="container px-6 py-3.5 flex items-center justify-between gap-4 relative z-10">
                                <div className="flex-1">
                                    <p className="font-semibold text-sm tracking-wide text-foreground">
                                        {announcement.title}
                                        {announcement.content && (
                                            <span className="ml-2 font-normal text-muted-foreground">
                                                {announcement.content}
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDismissedIds((prev) => [...prev, announcement._id])}
                                    aria-label="Dismiss announcement"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-foreground/10 dark:hover:bg-white/10 rounded-full transition-colors shrink-0"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </AnimatePresence>
    );
}
