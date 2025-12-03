"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";

interface ConversationListProps {
    selectedId?: Id<"conversations">;
    onSelect: (id: Id<"conversations">) => void;
}

export default function ConversationList({
    selectedId,
    onSelect,
}: ConversationListProps) {
    const conversations = useQuery(api.messages.listConversations);

    if (conversations === undefined) {
        return <div className="p-4 text-center text-muted-foreground">Loading...</div>;
    }

    if (conversations.length === 0) {
        return (
            <div className="p-4 text-center text-muted-foreground">
                No conversations yet.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 p-2">
            {conversations.map((conversation) => (
                <button
                    key={conversation._id}
                    onClick={() => onSelect(conversation._id)}
                    className={cn(
                        "flex items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/50",
                        selectedId === conversation._id && "bg-muted"
                    )}
                >
                    <Avatar>
                        <AvatarImage src={conversation.otherUser?.image} />
                        <AvatarFallback>
                            {conversation.otherUser?.name?.[0] || "?"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="font-medium truncate">
                                {conversation.otherUser?.name || "Unknown User"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {new Date(conversation.updatedAt).toLocaleDateString()}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                            {conversation.lastMessage?.content || "No messages yet"}
                        </p>
                    </div>
                </button>
            ))}
        </div>
    );
}
