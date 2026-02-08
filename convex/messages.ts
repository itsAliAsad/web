import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

import { requireUser, RATE_LIMITS, INPUT_LIMITS, validateLength } from "./utils";

export const listConversations = query({
    args: {},
    handler: async (ctx) => {
        const user = await requireUser(ctx);

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
        const user = await requireUser(ctx);

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
        metadata: v.optional(
            v.object({
                fileName: v.string(),
                fileSize: v.number(),
                mimeType: v.string(),
            })
        ),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);

        // Input validation
        validateLength(args.content, INPUT_LIMITS.MESSAGE_MAX, "Message");

        // Rate limiting
        const { windowMs, maxRequests } = RATE_LIMITS.MESSAGE_SEND;
        const recentMessages = await ctx.db
            .query("messages")
            .filter((q) => q.and(
                q.eq(q.field("senderId"), user._id),
                q.gt(q.field("_creationTime"), Date.now() - windowMs)
            ))
            .take(maxRequests + 1);

        if (recentMessages.length >= maxRequests) {
            throw new Error("Rate limited: Too many messages. Please slow down.");
        }

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
            metadata: args.metadata,
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

            // Check for existing unread notification for this conversation
            const existingNotification = await ctx.db
                .query("notifications")
                .withIndex("by_user_and_read", (q) =>
                    q.eq("userId", recipientId).eq("isRead", false)
                )
                .filter((q) =>
                    q.and(
                        q.eq(q.field("type"), "new_message"),
                        q.eq(q.field("data.conversationId"), conversationId)
                    )
                )
                .first();

            if (existingNotification) {
                // Update existing notification
                const newCount = (existingNotification.data.count || 1) + 1;
                await ctx.db.patch(existingNotification._id, {
                    data: { ...existingNotification.data, count: newCount, lastMessageId: messageId },
                    createdAt: Date.now(), // Bump to top
                });
            } else {
                // Create new notification
                await ctx.db.insert("notifications", {
                    userId: recipientId,
                    type: "new_message",
                    data: {
                        conversationId,
                        messageId,
                        senderId: user._id,
                        count: 1,
                    },
                    isRead: false,
                    createdAt: Date.now(),
                });
            }
        }

        return messageId;
    },
});

export const markRead = mutation({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);

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
        const user = await requireUser(ctx);

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

export const getOrCreateConversation = mutation({
    args: { otherUserId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);

        // Check for accepted offer between these users
        const offerAsStudent = await ctx.db
            .query("offers")
            .withIndex("by_student_and_tutor", (q) =>
                q.eq("studentId", user._id).eq("tutorId", args.otherUserId)
            )
            .filter((q) => q.eq(q.field("status"), "accepted"))
            .first();

        const offerAsTutor = await ctx.db
            .query("offers")
            .withIndex("by_tutor", (q) => q.eq("tutorId", user._id))
            .filter((q) =>
                q.and(
                    q.eq(q.field("studentId"), args.otherUserId),
                    q.eq(q.field("status"), "accepted")
                )
            )
            .first();

        if (!offerAsStudent && !offerAsTutor) {
            throw new Error("Messaging is only allowed after an offer has been accepted.");
        }

        // Find existing conversation
        const existing1 = await ctx.db
            .query("conversations")
            .withIndex("by_participant1", (q) => q.eq("participant1", user._id))
            .filter((q) => q.eq(q.field("participant2"), args.otherUserId))
            .first();

        const existing2 = await ctx.db
            .query("conversations")
            .withIndex("by_participant1", (q) => q.eq("participant1", args.otherUserId))
            .filter((q) => q.eq(q.field("participant2"), user._id))
            .first();

        let conversationId = existing1?._id || existing2?._id;

        if (!conversationId) {
            conversationId = await ctx.db.insert("conversations", {
                participant1: user._id,
                participant2: args.otherUserId,
                updatedAt: Date.now(),
            });
        }

        return conversationId;
    },
});

export const canSendMessage = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return false;

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) return false;

        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) return false;

        if (
            conversation.participant1 !== user._id &&
            conversation.participant2 !== user._id
        ) {
            return false;
        }

        const otherUserId =
            conversation.participant1 === user._id
                ? conversation.participant2
                : conversation.participant1;

        // Check if there are any accepted offers between the two users
        // Check as student
        const acceptedOfferAsStudent = await ctx.db
            .query("offers")
            .withIndex("by_student_and_tutor", (q) =>
                q.eq("studentId", user._id).eq("tutorId", otherUserId)
            )
            .filter((q) => q.eq(q.field("status"), "accepted"))
            .first();

        // Check as tutor
        const acceptedOfferAsTutor = await ctx.db
            .query("offers")
            .withIndex("by_tutor", (q) => q.eq("tutorId", user._id))
            .filter((q) =>
                q.and(
                    q.eq(q.field("studentId"), otherUserId),
                    q.eq(q.field("status"), "accepted")
                )
            )
            .first();

        // STRICT RULE: Only allow messaging if an accepted offer exists
        if (acceptedOfferAsStudent || acceptedOfferAsTutor) {
            return true;
        }

        return false;
    },
});

export const getUnreadMessagesFromUser = query({
    args: { otherUserId: v.id("users") },
    handler: async (ctx, args) => {
        // Return empty if not authenticated (don't throw)
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return 0;

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) return 0;

        // Find conversation between the two users
        const conversation1 = await ctx.db
            .query("conversations")
            .withIndex("by_participant1", (q) => q.eq("participant1", user._id))
            .filter((q) => q.eq(q.field("participant2"), args.otherUserId))
            .first();

        const conversation2 = await ctx.db
            .query("conversations")
            .withIndex("by_participant1", (q) => q.eq("participant1", args.otherUserId))
            .filter((q) => q.eq(q.field("participant2"), user._id))
            .first();

        const conversation = conversation1 || conversation2;
        if (!conversation) return 0;

        // Count unread messages from the other user
        const unreadMessages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
            .filter((q) =>
                q.and(
                    q.eq(q.field("senderId"), args.otherUserId),
                    q.eq(q.field("isRead"), false)
                )
            )
            .collect();

        return unreadMessages.length;
    },
});


