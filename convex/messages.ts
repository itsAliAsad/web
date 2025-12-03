import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { PaginationResult } from "convex/server";

export const listConversations = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

        if (!user) {
            return [];
        }

        const conversations1 = await ctx.db
            .query("conversations")
            .withIndex("by_participant1", (q) => q.eq("participant1", user._id))
            .collect();

        const conversations2 = await ctx.db
            .query("conversations")
            .withIndex("by_participant2", (q) => q.eq("participant2", user._id))
            .collect();

        const allConversations = [...conversations1, ...conversations2];

        // Deduplicate based on _id
        const uniqueConversations = Array.from(
            new Map(allConversations.map((c) => [c._id, c])).values()
        ).sort((a, b) => b.updatedAt - a.updatedAt);

        // Enrich with other participant details and last message
        return await Promise.all(
            uniqueConversations.map(async (c) => {
                const otherUserId =
                    c.participant1 === user._id ? c.participant2 : c.participant1;
                const otherUser = await ctx.db.get(otherUserId);
                const lastMessage = c.lastMessageId
                    ? await ctx.db.get(c.lastMessageId)
                    : null;

                return {
                    ...c,
                    otherUser,
                    lastMessage,
                };
            })
        );
    },
});

export const list = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

        if (!user) {
            return [];
        }

        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) {
            return [];
        }

        if (
            conversation.participant1 !== user._id &&
            conversation.participant2 !== user._id
        ) {
            return [];
        }

        return await ctx.db
            .query("messages")
            .withIndex("by_conversation_and_created", (q) =>
                q.eq("conversationId", args.conversationId)
            )
            .order("asc")
            .collect();
    },
});

export const send = mutation({
    args: {
        conversationId: v.optional(v.id("conversations")),
        recipientId: v.optional(v.id("users")), // If starting new convo
        content: v.string(),
        type: v.union(v.literal("text"), v.literal("image"), v.literal("file")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

        if (!user) throw new Error("User not found");

        let conversationId = args.conversationId;

        if (!conversationId) {
            if (!args.recipientId) throw new Error("Recipient required for new conversation");

            // Check if conversation already exists
            const existing1 = await ctx.db
                .query("conversations")
                .withIndex("by_participant1", (q) => q.eq("participant1", user._id))
                .filter((q) => q.eq(q.field("participant2"), args.recipientId))
                .first();

            const existing2 = await ctx.db
                .query("conversations")
                .withIndex("by_participant1", (q) => q.eq("participant1", args.recipientId!))
                .filter((q) => q.eq(q.field("participant2"), user._id))
                .first();

            if (existing1) conversationId = existing1._id;
            else if (existing2) conversationId = existing2._id;
            else {
                conversationId = await ctx.db.insert("conversations", {
                    participant1: user._id,
                    participant2: args.recipientId,
                    updatedAt: Date.now(),
                });
            }
        }

        const messageId = await ctx.db.insert("messages", {
            conversationId: conversationId!,
            senderId: user._id,
            content: args.content,
            type: args.type,
            isRead: false,
            createdAt: Date.now(),
        });

        await ctx.db.patch(conversationId!, {
            lastMessageId: messageId,
            updatedAt: Date.now(),
        });

        // Notify recipient
        const conversation = await ctx.db.get(conversationId!);
        if (conversation) {
            const recipientId =
                conversation.participant1 === user._id
                    ? conversation.participant2
                    : conversation.participant1;

            await ctx.db.insert("notifications", {
                userId: recipientId,
                type: "new_message",
                data: { conversationId, messageId },
                isRead: false,
                createdAt: Date.now(),
            });
        }

        return messageId;
    },
});

export const markRead = mutation({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

        if (!user) throw new Error("User not found");

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .filter((q) => q.neq(q.field("senderId"), user._id))
            .filter((q) => q.eq(q.field("isRead"), false))
            .collect();

        await Promise.all(
            messages.map((msg) => ctx.db.patch(msg._id, { isRead: true }))
        );
    },
});

export const getConversation = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

        if (!user) return null;

        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) return null;

        if (
            conversation.participant1 !== user._id &&
            conversation.participant2 !== user._id
        ) {
            return null;
        }

        const otherUserId =
            conversation.participant1 === user._id
                ? conversation.participant2
                : conversation.participant1;

        const otherUser = await ctx.db.get(otherUserId);

        return {
            ...conversation,
            otherUser,
        };
    },
});
