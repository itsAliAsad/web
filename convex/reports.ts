import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
    args: {
        targetId: v.id("users"),
        requestId: v.optional(v.id("requests")),
        reason: v.string(),
        description: v.optional(v.string()),
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

        await ctx.db.insert("reports", {
            reporterId: user._id,
            targetId: args.targetId,
            requestId: args.requestId,
            reason: args.reason,
            description: args.description,
            status: "pending",
            createdAt: Date.now(),
        });
    },
});

export const list = query({
    args: {},
    handler: async (ctx) => {
        // In a real app, check for admin role
        // For MVP, we'll just return all for now or maybe check a hardcoded admin ID
        return await ctx.db.query("reports").order("desc").collect();
    },
});

export const resolve = mutation({
    args: {
        reportId: v.id("reports"),
        status: v.union(v.literal("resolved"), v.literal("dismissed")),
    },
    handler: async (ctx, args) => {
        // In a real app, check for admin role
        await ctx.db.patch(args.reportId, { status: args.status });
    },
});
