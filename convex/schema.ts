import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        email: v.string(),
        tokenIdentifier: v.string(), // Clerk ID
        image: v.optional(v.string()),
        bio: v.optional(v.string()),
        university: v.optional(v.string()), // For .edu check later
        reputation: v.number(), // Aggregated rating
        role: v.optional(v.union(v.literal("buyer"), v.literal("seller"))), // Can be both, but primary intent
        isVerified: v.optional(v.boolean()), // Added isVerified
        isAdmin: v.optional(v.boolean()), // Added isAdmin
        isBanned: v.optional(v.boolean()), // Added isBanned
    }).index("by_token", ["tokenIdentifier"]),

    requests: defineTable({
        buyerId: v.id("users"),
        title: v.string(),
        description: v.string(),
        budget: v.number(), // In base currency unit
        deadline: v.string(), // ISO date string
        status: v.union(
            v.literal("open"),
            v.literal("in_progress"),
            v.literal("completed"),
            v.literal("cancelled")
        ),
        category: v.optional(v.string()),
    })
        .index("by_status", ["status"])
        .index("by_buyer", ["buyerId"])
        .searchIndex("search_title_description", {
            searchField: "title",
            filterFields: ["category"],
        }),

    offers: defineTable({
        requestId: v.id("requests"),
        sellerId: v.id("users"),
        price: v.number(),
        status: v.union(
            v.literal("pending"),
            v.literal("accepted"),
            v.literal("rejected")
        ),
    })
        .index("by_request", ["requestId"])
        .index("by_seller", ["sellerId"])
        .index("by_request_and_seller", ["requestId", "sellerId"]),

    reviews: defineTable({
        reviewerId: v.id("users"),
        revieweeId: v.id("users"),
        requestId: v.id("requests"),
        rating: v.number(), // 1-5
        comment: v.optional(v.string()),
        type: v.union(v.literal("buyer_to_seller"), v.literal("seller_to_buyer")),
    }).index("by_reviewee", ["revieweeId"]),

    conversations: defineTable({
        participant1: v.id("users"),
        participant2: v.id("users"),
        lastMessageId: v.optional(v.id("messages")),
        updatedAt: v.number(),
    })
        .index("by_participant1", ["participant1"])
        .index("by_participant2", ["participant2"])
        .index("by_updated", ["updatedAt"]),

    messages: defineTable({
        conversationId: v.id("conversations"),
        senderId: v.id("users"),
        content: v.string(),
        type: v.union(v.literal("text"), v.literal("image"), v.literal("file")),
        isRead: v.boolean(),
        createdAt: v.number(),
    })
        .index("by_conversation", ["conversationId"])
        .index("by_conversation_and_created", ["conversationId", "createdAt"]),

    notifications: defineTable({
        userId: v.id("users"),
        type: v.union(
            v.literal("offer_received"),
            v.literal("offer_accepted"),
            v.literal("request_completed"),
            v.literal("new_message")
        ),
        data: v.any(), // Flexible object for related IDs
        isRead: v.boolean(),
        createdAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_user_and_read", ["userId", "isRead"]),

    reports: defineTable({
        reporterId: v.id("users"),
        targetId: v.id("users"),
        requestId: v.optional(v.id("requests")),
        reason: v.string(),
        description: v.optional(v.string()),
        status: v.union(v.literal("pending"), v.literal("resolved"), v.literal("dismissed")),
        createdAt: v.number(),
    })
        .index("by_status", ["status"])
        .index("by_target", ["targetId"]),

    portfolio_items: defineTable({
        userId: v.id("users"),
        title: v.string(),
        description: v.string(),
        imageUrl: v.string(),
        link: v.optional(v.string()),
        createdAt: v.number(),
    }).index("by_user", ["userId"]),

    courses: defineTable({
        userId: v.id("users"),
        title: v.string(),
        description: v.string(),
        price: v.number(),
        imageUrl: v.optional(v.string()),
        createdAt: v.number(),
    }).index("by_user", ["userId"]),

    announcements: defineTable({
        title: v.string(),
        content: v.string(),
        isActive: v.boolean(),
        createdAt: v.number(),
    }).index("by_active", ["isActive"]),
});
