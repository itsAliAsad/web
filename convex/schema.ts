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
        ratingSum: v.optional(v.number()),
        ratingCount: v.optional(v.number()),
        termsAcceptedAt: v.optional(v.string()),
        role: v.optional(v.union(v.literal("buyer"), v.literal("seller"))), // Can be both, but primary intent
        isVerified: v.optional(v.boolean()), // Added isVerified
        isAdmin: v.optional(v.boolean()), // Added isAdmin
        isBanned: v.optional(v.boolean()), // Added isBanned
        verifiedAt: v.optional(v.number()),
        verifiedBy: v.optional(v.id("users")),

        // UX & Personalization
        notificationPreferences: v.optional(
            v.object({
                email_marketing: v.boolean(),
                email_transactional: v.boolean(),
                push_messages: v.boolean(),
            })
        ),
        currency: v.optional(v.string()),
        language: v.optional(v.string()),
        theme: v.optional(v.string()),
        links: v.optional(
            v.object({
                linkedin: v.optional(v.string()),
                portfolio: v.optional(v.string()),
                twitter: v.optional(v.string()),
            })
        ),

        // Trust & Security
        lastLoginAt: v.optional(v.number()),
        loginIp: v.optional(v.string()),
        banReason: v.optional(v.string()),
        bannedAt: v.optional(v.number()),

        // Communication
        marketingConsent: v.optional(v.boolean()),
        marketingConsentUpdatedAt: v.optional(v.number()),

        // Data Integrity
        deletedAt: v.optional(v.number()),
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
        deletedAt: v.optional(v.number()),
    })
        .index("by_status", ["status"])
        .index("by_status_and_category", ["status", "category"])
        .index("by_buyer", ["buyerId"])
        .searchIndex("search_title_description", {
            searchField: "title",
            filterFields: ["category"],
        }),

    offers: defineTable({
        requestId: v.id("requests"),
        buyerId: v.optional(v.id("users")),
        sellerId: v.id("users"),
        price: v.number(),
        status: v.union(
            v.literal("pending"),
            v.literal("accepted"),
            v.literal("rejected")
        ),
        deletedAt: v.optional(v.number()),
    })
        .index("by_request", ["requestId"])
        .index("by_seller", ["sellerId"])
        .index("by_request_and_seller", ["requestId", "sellerId"])
        .index("by_buyer_and_seller", ["buyerId", "sellerId"])
        .index("by_seller_and_buyer", ["sellerId", "buyerId"]),

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
        metadata: v.optional(
            v.object({
                fileName: v.string(), // e.g. "document.pdf"
                fileSize: v.number(), // in bytes
                mimeType: v.string(), // e.g. "application/pdf"
            })
        ),
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

    audit_logs: defineTable({
        actorId: v.optional(v.id("users")), // Who did it
        action: v.string(), // e.g. "ban_user", "delete_request"
        targetId: v.optional(v.id("users")), // Who was affected
        targetType: v.optional(v.string()), // e.g. "user", "request"
        details: v.optional(v.any()), // Extra context
        ipAddress: v.optional(v.string()),
        createdAt: v.number(),
    })
        .index("by_actor", ["actorId"])
        .index("by_action", ["action"]),
});
