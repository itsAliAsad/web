"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import ReportDialog from "@/components/trust/ReportDialog";
import VerifiedBadge from "@/components/trust/VerifiedBadge";
import { Send } from "lucide-react";
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

    const otherUser = conversation?.otherUser;

    const [newMessage, setNewMessage] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (messages) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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
        <div className="flex flex-col h-full">
            <div className="p-4 border-b flex justify-between items-center bg-card">
                <h2 className="font-semibold flex items-center">
                    Chat with {otherUser?.name || "User"}
                    {otherUser?.isVerified && <VerifiedBadge />}
                </h2>
                <div className="flex items-center gap-2">
                    {otherUser && <DealSidebar otherUserId={otherUser._id} />}
                    {otherUser && <ReportDialog targetId={otherUser._id} />}
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                    const isMe = msg.senderId === user?._id;
                    return (
                        <div
                            key={msg._id}
                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[70%] rounded-lg p-3 ${isMe
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                    }`}
                            >
                                <p>{msg.content}</p>
                                <span className="text-[10px] opacity-70 block text-right mt-1">
                                    {new Date(msg.createdAt).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            <div className="p-4 border-t">
                <form onSubmit={handleSend} className="flex gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={user?.isBanned ? "You are banned from sending messages" : "Type a message..."}
                        disabled={!!user?.isBanned}
                        className="flex-1"
                    />
                    <Button type="submit" size="icon">
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div >
    );
}
