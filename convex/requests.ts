import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./utils";

export const create = mutation({
    args: {
        title: v.string(),
        description: v.string(),
        budget: v.number(),
        deadline: v.string(),
        category: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);

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
        const user = await requireUser(ctx);

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
        if (args.category && args.category !== "all") {
            return await ctx.db
                .query("requests")
                .withIndex("by_status_and_category", (q) =>
                    q.eq("status", "open").eq("category", args.category)
                )
                .order("desc")
                .collect();
        }

        return await ctx.db
            .query("requests")
            .withIndex("by_status", (q) => q.eq("status", "open"))
            .order("desc")
            .collect();
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
        const user = await requireUser(ctx);

        const request = await ctx.db.get(args.id);
        if (!request) throw new Error("Request not found");
        if (user._id !== request.buyerId) throw new Error("Unauthorized");

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
