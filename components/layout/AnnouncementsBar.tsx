"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const STORAGE_KEY = "path_dismissed_announcements";

export default function AnnouncementsBar() {
    const announcements = useQuery(api.admin.getAnnouncements);
    const [dismissedIds, setDismissedIds] = useState<string[]>([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) setDismissedIds(JSON.parse(stored));
        } catch (error) {
            console.error("Failed to read dismissed announcements", error);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissedIds));
    }, [dismissedIds]);

    const visible = useMemo(() => {
        if (!announcements) return [];
        return announcements.filter((a) => !dismissedIds.includes(a._id));
    }, [announcements, dismissedIds]);

    if (!visible || visible.length === 0) return null;

    return (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900">
            <div className="container px-6 py-3 flex flex-col gap-2">
                {visible.map((announcement) => (
                    <div key={announcement._id} className="flex items-start justify-between gap-4">
                        <div>
                            <p className="font-semibold">{announcement.title}</p>
                            <p className="text-sm text-amber-800">{announcement.content}</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDismissedIds((prev) => [...prev, announcement._id])}
                            aria-label="Dismiss announcement"
                            className="text-amber-800 hover:text-amber-900"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}
