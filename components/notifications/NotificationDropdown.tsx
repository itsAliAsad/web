"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function NotificationDropdown() {
    const notifications = useQuery(api.notifications.list);
    const markRead = useMutation(api.notifications.markRead);
    const markAllRead = useMutation(api.notifications.markAllRead);
    const router = useRouter();

    if (notifications === undefined) {
        return (
            <Button variant="ghost" size="icon" disabled>
                <Bell className="h-5 w-5" />
            </Button>
        );
    }

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const handleNotificationClick = async (notification: typeof notifications[0]) => {
        if (!notification.isRead) {
            await markRead({ notificationId: notification._id });
        }

        // Navigate based on type
        switch (notification.type) {
            case "offer_received":
                router.push(`/requests/${notification.data.requestId}`);
                break;
            case "offer_accepted":
                router.push(`/requests/${notification.data.requestId}`);
                break;
            case "request_completed":
                router.push(`/requests/${notification.data.requestId}`);
                break;
            case "new_message":
                router.push(`/messages`);
                break;
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-600" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex justify-between items-center">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-auto p-0"
                            onClick={() => markAllRead()}
                        >
                            Mark all read
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        No notifications
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <DropdownMenuItem
                            key={notification._id}
                            className={cn(
                                "flex flex-col items-start gap-1 p-3 cursor-pointer",
                                !notification.isRead && "bg-muted/50"
                            )}
                            onClick={() => handleNotificationClick(notification)}
                        >
                            <div className="font-medium text-sm">
                                {notification.type === "offer_received" && "New Offer Received"}
                                {notification.type === "offer_accepted" && "Offer Accepted"}
                                {notification.type === "request_completed" && "Request Completed"}
                                {notification.type === "new_message" && "New Message"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {new Date(notification.createdAt).toLocaleDateString()}{" "}
                                {new Date(notification.createdAt).toLocaleTimeString()}
                            </div>
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
