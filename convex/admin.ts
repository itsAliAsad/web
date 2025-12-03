import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper to check admin status
async function checkAdmin(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q: any) =>
            q.eq("tokenIdentifier", identity.tokenIdentifier)
        )
        .unique();

    if (!user || !user.isAdmin) throw new Error("Unauthorized: Admin access required");
    return user;
}

export const getStats = query({
    args: {},
    handler: async (ctx) => {
        await checkAdmin(ctx);

        const usersCount = (await ctx.db.query("users").collect()).length;
        const requestsCount = (await ctx.db.query("requests").collect()).length;
        const reportsCount = (await ctx.db.query("reports").collect()).length;

        return {
            usersCount,
            requestsCount,
            reportsCount,
        };
    },
});

export const getReports = query({
    args: {},
    handler: async (ctx) => {
        await checkAdmin(ctx);
        return await ctx.db.query("reports").order("desc").collect();
    },
});

export const listUsers = query({
    args: {},
    handler: async (ctx) => {
        await checkAdmin(ctx);
        return await ctx.db.query("users").order("desc").collect();
    },
});

export const banUser = mutation({
    args: { userId: v.id("users"), isBanned: v.boolean() },
    handler: async (ctx, args) => {
        await checkAdmin(ctx);
        await ctx.db.patch(args.userId, { isBanned: args.isBanned });
    },
});

export const createAnnouncement = mutation({
    args: { title: v.string(), content: v.string() },
    handler: async (ctx, args) => {
        await checkAdmin(ctx);
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
