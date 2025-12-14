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
                            className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md relative overflow-hidden"
                        >
                            {/* Subtle texture/shine effect overlaid */}
                            <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                            <div className="container px-6 py-3 flex items-center justify-between gap-4 relative z-10">
                                <div className="flex-1">
                                    <p className="font-semibold text-sm tracking-wide text-white/95">
                                        {announcement.title}
                                        {announcement.content && (
                                            <span className="ml-2 font-normal text-white/80">
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
                                    className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-colors"
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
