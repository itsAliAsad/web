"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle } from "lucide-react";
import VerifiedBadge from "@/components/trust/VerifiedBadge";

interface ConversationListProps {
    selectedId?: Id<"conversations">;
    onSelect: (id: Id<"conversations">) => void;
}

export default function ConversationList({
    selectedId,
    onSelect,
}: ConversationListProps) {
    const conversations = useQuery(api.messages.listConversations);
    const user = useQuery(api.users.currentUser);

    if (conversations === undefined) {
        return (
            <div className="flex flex-col gap-3 p-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3 p-3">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (conversations.length === 0) {
        return (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/5 via-transparent to-teal-500/5 p-12 m-4">
                {/* Decorative blur orbs */}
                <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-amber-400/10 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-teal-400/10 blur-3xl" />

                <div className="relative flex flex-col items-center justify-center text-center">
                    {/* Icon */}
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-amber-500/15 to-teal-500/15 flex items-center justify-center mb-6 shadow-lg">
                        <MessageCircle className="h-10 w-10 text-foreground/60" />
                    </div>

                    {/* Text */}
                    <h3 className="text-xl font-bold text-foreground mb-2">
                        No conversations yet
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Start chatting when you accept an offer
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 p-3">
            {conversations.map((conversation) => {
                const isUnread = conversation.lastMessage &&
                    !conversation.lastMessage.isRead &&
                    conversation.lastMessage.senderId !== user?._id;

                return (
                    <button
                        key={conversation._id}
                        onClick={() => onSelect(conversation._id)}
                        className={cn(
                            "group relative flex items-center gap-3 rounded-xl p-3 text-left transition-all duration-200",
                            "hover:bg-white dark:hover:bg-white/5 hover:shadow-md",
                            selectedId === conversation._id && "bg-white dark:bg-white/5 shadow-md"
                        )}
                    >
                        {/* Unread indicator */}
                        {isUnread && (
                            <div className="absolute top-2 right-2">
                                <span className="flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                                </span>
                            </div>
                        )}

                        <Avatar className="h-12 w-12 ring-2 ring-foreground/5">
                            <AvatarImage src={conversation.otherUser?.image} />
                            <AvatarFallback className="bg-gradient-to-br from-amber-500/20 to-teal-500/20 font-semibold">
                                {conversation.otherUser?.name?.[0] || "?"}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 overflow-hidden min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className={cn(
                                    "font-semibold truncate text-sm",
                                    isUnread && "text-foreground font-bold"
                                )}>
                                    {conversation.otherUser?.name || "Unknown User"}
                                </span>
                                {conversation.otherUser?.isVerified && (
                                    <VerifiedBadge />
                                )}
                            </div>

                            <div className="flex items-center justify-between gap-2">
                                <p className={cn(
                                    "text-xs truncate flex-1",
                                    isUnread ? "text-foreground font-medium" : "text-muted-foreground"
                                )}>
                                    {conversation.lastMessage?.content || "No messages yet"}
                                </p>
                                <span className="text-[10px] text-muted-foreground shrink-0">
                                    {conversation.lastMessage
                                        ? formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })
                                        : formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })
                                    }
                                </span>
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
