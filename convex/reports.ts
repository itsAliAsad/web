import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireUser, RATE_LIMITS, INPUT_LIMITS, validateLength } from "./utils";

export const create = mutation({
    args: {
        targetId: v.id("users"),
        ticketId: v.optional(v.id("tickets")),
        reason: v.string(),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);

        // Input validation
        validateLength(args.reason, INPUT_LIMITS.REASON_MAX, "Reason");
        if (args.description) {
            validateLength(args.description, INPUT_LIMITS.DESCRIPTION_MAX, "Description");
        }

        // Prevent self-reporting
        if (args.targetId === user._id) {
            throw new Error("You cannot report yourself");
        }

        // Rate limiting
        const { windowMs, maxRequests } = RATE_LIMITS.REPORT_CREATE;
        const recentReports = await ctx.db
            .query("reports")
            .filter((q) => q.and(
                q.eq(q.field("reporterId"), user._id),
                q.gt(q.field("createdAt"), Date.now() - windowMs)
            ))
            .take(maxRequests + 1);

        if (recentReports.length >= maxRequests) {
            throw new Error("Rate limited: Too many reports. Please wait before submitting more.");
        }

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
