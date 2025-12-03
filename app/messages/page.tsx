"use client";

import { useState } from "react";
import ConversationList from "@/components/chat/ConversationList";
import ChatWindow from "@/components/chat/ChatWindow";
import { Id } from "@/convex/_generated/dataModel";

export default function MessagesPage() {
    const [selectedConversationId, setSelectedConversationId] =
        useState<Id<"conversations">>();

    return (
        <div className="container mx-auto py-6 h-[calc(100vh-4rem)]">
            <div className="grid grid-cols-1 md:grid-cols-4 h-full gap-6 rounded-xl border bg-card text-card-foreground shadow">
                <div className="md:col-span-1 border-r">
                    <div className="p-4 border-b">
                        <h2 className="font-semibold">Messages</h2>
                    </div>
                    <ConversationList
                        selectedId={selectedConversationId}
                        onSelect={setSelectedConversationId}
                    />
                </div>
                <div className="md:col-span-3 h-full">
                    {selectedConversationId ? (
                        <ChatWindow conversationId={selectedConversationId} />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            Select a conversation to start messaging
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
