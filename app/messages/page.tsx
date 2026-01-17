"use client";

import { useState } from "react";
import ConversationList from "@/components/chat/ConversationList";
import ChatWindow from "@/components/chat/ChatWindow";
import { Id } from "@/convex/_generated/dataModel";

export default function MessagesPage() {
    const [selectedConversationId, setSelectedConversationId] =
        useState<Id<"conversations">>();

    return (
        <div className="h-[calc(100vh-4rem)]">
            <div className="container mx-auto h-full py-6 px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 h-full gap-0 rounded-xl border bg-card text-card-foreground shadow overflow-hidden">
                    <div className="md:col-span-1 border-r flex flex-col h-full overflow-hidden">
                        <div className="p-4 border-b shrink-0">
                            <h2 className="font-semibold">Messages</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <ConversationList
                                selectedId={selectedConversationId}
                                onSelect={setSelectedConversationId}
                            />
                        </div>
                    </div>
                    <div className="md:col-span-3 h-full overflow-hidden">
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
        </div>
    );
}
