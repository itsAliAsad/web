import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireUser } from "./utils";

export const create = mutation({
    args: {
        targetId: v.id("users"),
        ticketId: v.optional(v.id("tickets")),
        reason: v.string(),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);

        await ctx.db.insert("reports", {
            reporterId: user._id,
            targetId: args.targetId,
            ticketId: args.ticketId,
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
        await requireAdmin(ctx);
        return await ctx.db.query("reports").order("desc").collect();
    },
});

export const resolve = mutation({
    args: {
        reportId: v.id("reports"),
        status: v.union(v.literal("resolved"), v.literal("dismissed")),
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        await ctx.db.patch(args.reportId, { status: args.status });
    },
});
