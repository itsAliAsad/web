"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const HEARTBEAT_INTERVAL = 4 * 60 * 1000; // 4 minutes (safe buffer for 10 min idle check)

export function OnlinePresence() {
    const updateStatus = useMutation(api.tutor_profiles.updateOnlineStatus);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const sendHeartbeat = async () => {
        try {
            await updateStatus({ status: "online" });
        } catch (error) {
            console.error("Failed to send presence heartbeat:", error);
        }
    };

    useEffect(() => {
        // Initial heartbeat
        sendHeartbeat();

        // Set up interval
        intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

        // Visibility change handler
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                sendHeartbeat();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    return null; // This component renders nothing
}
