"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ReportDialog from "@/components/trust/ReportDialog";
import VerifiedBadge from "@/components/trust/VerifiedBadge";
import { Send, FileIcon, Check, CheckCheck } from "lucide-react";
import DealSidebar from "./DealSidebar";

interface ChatWindowProps {
    conversationId: Id<"conversations">;
}

export default function ChatWindow({ conversationId }: ChatWindowProps) {
    const messages = useQuery(api.messages.list, { conversationId });
    const conversation = useQuery(api.messages.getConversation, { conversationId });
    const sendMessage = useMutation(api.messages.send);
    const markRead = useMutation(api.messages.markRead);
    const user = useQuery(api.users.currentUser);
    const canSendMessage = useQuery(api.messages.canSendMessage, { conversationId });

    const otherUser = conversation?.otherUser;

    const [newMessage, setNewMessage] = useState("");
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages && bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages?.length]);

    // Mark messages as read when conversation is opened
    useEffect(() => {
        if (messages && conversationId) {
            markRead({ conversationId });
        }
    }, [messages, conversationId, markRead]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (user?.isBanned) return;
        if (!newMessage.trim()) return;

        await sendMessage({
            conversationId,
            content: newMessage,
            type: "text",
        });
        setNewMessage("");
    };

    if (messages === undefined) {
        return <div className="flex-1 p-4 text-center">Loading messages...</div>;
    }

    return (
        <div className="flex flex-col h-full max-h-full">
            {/* Header - Fixed */}
            <div className="p-4 border-b flex justify-between items-center bg-card backdrop-blur-sm shrink-0">
                <h2 className="font-semibold flex items-center gap-2">
                    Chat with {otherUser?.name || "User"}
                    {otherUser?.isVerified && <VerifiedBadge />}
                </h2>
                <div className="flex items-center gap-2">
                    {otherUser && <DealSidebar otherUserId={otherUser._id} />}
                    {otherUser && <ReportDialog targetId={otherUser._id} />}
                </div>
            </div>

            {/* Messages Area - Scrollable */}
            <div
                ref={scrollAreaRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-background to-muted/20"
            >
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-4">
                                <Send className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.senderId === user?._id;
                        const showAvatar = index === 0 || messages[index - 1].senderId !== msg.senderId;

                        return (
                            <div
                                key={msg._id}
                                className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                            >
                                {/* Avatar */}
                                {showAvatar ? (
                                    <Avatar className="h-8 w-8 ring-2 ring-background">
                                        <AvatarImage src={isMe ? user?.image : otherUser?.image} />
                                        <AvatarFallback className="bg-gradient-to-br from-amber-500/20 to-teal-500/20 text-xs font-semibold">
                                            {(isMe ? user?.name : otherUser?.name)?.[0] || "?"}
                                        </AvatarFallback>
                                    </Avatar>
                                ) : (
                                    <div className="h-8 w-8" />
                                )}

                                {/* Message Bubble */}
                                <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[70%]`}>
                                    <div
                                        className={`rounded-2xl px-4 py-2.5 ${isMe
                                            ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25"
                                            : "bg-white dark:bg-white/5 backdrop-blur-sm border border-foreground/10 text-foreground"
                                            }`}
                                    >
                                        {msg.type === "file" && msg.metadata ? (
                                            <div className="flex items-center gap-2 p-2 bg-background/20 rounded-lg mb-1">
                                                <FileIcon className="w-4 h-4" />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{msg.metadata.fileName}</span>
                                                    <span className="text-xs opacity-70">
                                                        {(msg.metadata.fileSize / 1024).toFixed(1)} KB
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-[15px] leading-relaxed">{msg.content}</p>
                                        )}
                                    </div>

                                    {/* Time + Read Receipt */}
                                    <div className={`flex items-center gap-1 mt-1 px-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                        <span className="text-[10px] text-muted-foreground">
                                            {new Date(msg.createdAt).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                        {isMe && (
                                            <div className="text-muted-foreground">
                                                {msg.isRead ? (
                                                    <CheckCheck className="h-3 w-3 text-teal-500" />
                                                ) : (
                                                    <Check className="h-3 w-3" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input Area - Fixed */}
            <div className="p-4 border-t bg-card backdrop-blur-sm shrink-0">
                <form onSubmit={handleSend} className="flex gap-3">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={
                            user?.isBanned
                                ? "You are banned from sending messages"
                                : canSendMessage === false
                                    ? "You cannot send messages after the offer is accepted"
                                    : "Type a message..."
                        }
                        disabled={!!user?.isBanned || canSendMessage === false}
                        className="flex-1 rounded-full h-11 px-5 bg-muted/50 border-foreground/10 focus-visible:ring-amber-500"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!newMessage.trim() || !!user?.isBanned || canSendMessage === false}
                        className="rounded-full h-11 w-11 bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
