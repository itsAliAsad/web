"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MessageButtonProps {
    otherUserId: Id<"users">;
    className?: string;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    children?: React.ReactNode;
}

export default function MessageButton({
    otherUserId,
    className,
    variant = "default",
    size = "default",
    children
}: MessageButtonProps) {
    const router = useRouter();
    const getOrCreateConversation = useMutation(api.messages.getOrCreateConversation);
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent parent link clicks
        setIsLoading(true);

        try {
            const conversationId = await getOrCreateConversation({ otherUserId });
            router.push(`/messages?conversationId=${conversationId}`);
        } catch (error: any) {
            console.error("Failed to start conversation:", error);
            // Check if error message indicates restriction
            if (error.message.includes("Messaging is only allowed")) {
                toast.error("Messaging is only enabled after an offer is accepted.");
            } else {
                toast.error("Failed to start chat. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            className={cn("", className)}
            onClick={handleClick}
            disabled={isLoading}
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <MessageSquare className="h-4 w-4 mr-2" />
            )}
            {children || "Message"}
        </Button>
    );
}
