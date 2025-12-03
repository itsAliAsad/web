import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
    args: {
        title: v.string(),
        description: v.string(),
        budget: v.number(),
        deadline: v.string(),
        category: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthenticated call to create request");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

        if (!user) {
            throw new Error("User not found");
        }

        const requestId = await ctx.db.insert("requests", {
            buyerId: user._id,
            title: args.title,
            description: args.description,
            budget: args.budget,
            deadline: args.deadline,
            status: "open",
            category: args.category,
        });

        return requestId;
    },
});

export const listMyRequests = query({
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

        return await ctx.db
            .query("requests")
            .withIndex("by_buyer", (q) => q.eq("buyerId", user._id))
            .order("desc")
            .collect();
    },
});

export const listOpen = query({
    args: { category: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const q = ctx.db
            .query("requests")
            .withIndex("by_status", (q) => q.eq("status", "open"));

        if (args.category && args.category !== "all") {
            // Note: This is client-side filtering on the DB query result stream if we don't have a specific index.
            // For better performance with many records, we should add an index on ["status", "category"].
            // For now, we'll filter in memory after fetching or use filter() if possible.
            // Convex filter() works on the database side.
            return await q
                .filter((q) => q.eq(q.field("category"), args.category))
                .order("desc")
                .collect();
        }

        return await q.order("desc").collect();
    },
});

export const get = query({
    args: { id: v.id("requests") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const complete = mutation({
    args: { id: v.id("requests") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const request = await ctx.db.get(args.id);
        if (!request) throw new Error("Request not found");

        // Verify buyer
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

        if (!user || user._id !== request.buyerId) throw new Error("Unauthorized");

        await ctx.db.patch(args.id, { status: "completed" });

        // Notify seller(s) who had accepted offers (should be just one)
        const acceptedOffer = await ctx.db
            .query("offers")
            .withIndex("by_request", (q) => q.eq("requestId", args.id))
            .filter((q) => q.eq(q.field("status"), "accepted"))
            .first();

        if (acceptedOffer) {
            await ctx.db.insert("notifications", {
                userId: acceptedOffer.sellerId,
                type: "request_completed",
                data: { requestId: args.id },
                isRead: false,
                createdAt: Date.now(),
            });
        }
    },
});

export const search = query({
    args: { query: v.string(), category: v.optional(v.string()) },
    handler: async (ctx, args) => {
        let q = ctx.db
            .query("requests")
            .withSearchIndex("search_title_description", (q) =>
                q.search("title", args.query)
            );

        if (args.category && args.category !== "all") {
            q = q.filter((q) => q.eq(q.field("category"), args.category));
        }

        return await q.collect();
    },
});
