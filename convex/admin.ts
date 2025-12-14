import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./utils";

export const getStats = query({
    args: {},
    handler: async (ctx) => {
        await requireAdmin(ctx);

        const usersCount = (await ctx.db.query("users").collect()).length;
        const ticketsCount = (await ctx.db.query("tickets").collect()).length;
        const reportsCount = (await ctx.db.query("reports").collect()).length;

        return {
            usersCount,
            requestsCount: ticketsCount, // Backward compat for frontend
            reportsCount,
        };
    },
});

export const getReports = query({
    args: {},
    handler: async (ctx) => {
        await requireAdmin(ctx);
        return await ctx.db.query("reports").order("desc").collect();
    },
});

export const listUsers = query({
    args: {},
    handler: async (ctx) => {
        await requireAdmin(ctx);
        return await ctx.db.query("users").order("desc").collect();
    },
});

export const banUser = mutation({
    args: { userId: v.id("users"), isBanned: v.boolean() },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        await ctx.db.patch(args.userId, { isBanned: args.isBanned });
    },
});

export const createAnnouncement = mutation({
    args: { title: v.string(), content: v.string() },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        await ctx.db.insert("announcements", {
            title: args.title,
            content: args.content,
            isActive: true,
            createdAt: Date.now(),
        });
    },
});

export const getAnnouncements = query({
    args: {},
    handler: async (ctx) => {
        // Publicly accessible
        return await ctx.db
            .query("announcements")
            .withIndex("by_active", (q) => q.eq("isActive", true))
            .order("desc")
            .collect();
    },
});

export const listAnnouncements = query({
    args: {},
    handler: async (ctx) => {
        await requireAdmin(ctx);
        return await ctx.db.query("announcements").order("desc").collect();
    },
});

export const setAnnouncementStatus = mutation({
    args: { id: v.id("announcements"), isActive: v.boolean() },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        await ctx.db.patch(args.id, { isActive: args.isActive });
    },
});

export const setVerification = mutation({
    args: { userId: v.id("users"), isVerified: v.boolean() },
    handler: async (ctx, args) => {
        const admin = await requireAdmin(ctx);
        await ctx.db.patch(args.userId, {
            isVerified: args.isVerified,
            verifiedBy: args.isVerified ? admin._id : undefined,
            verifiedAt: args.isVerified ? Date.now() : undefined,
        });
    },
});

export const setAdmin = mutation({
    args: { userId: v.id("users"), isAdmin: v.boolean() },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        await ctx.db.patch(args.userId, { isAdmin: args.isAdmin });
    },
});

export const getAuditLogs = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);

        const logs = await ctx.db
            .query("audit_logs")
            .order("desc")
            .take(args.limit || 100);

        // Enrich with actor info
        return await Promise.all(
            logs.map(async (log) => {
                const actor = log.actorId ? await ctx.db.get(log.actorId) : null;
                return {
                    ...log,
                    actorName: actor?.name,
                    actorEmail: actor?.email,
                };
            })
        );
    },
});
