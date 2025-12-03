import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Portfolio Items
export const addPortfolioItem = mutation({
    args: {
        title: v.string(),
        description: v.string(),
        imageUrl: v.string(),
        link: v.optional(v.string()),
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

        await ctx.db.insert("portfolio_items", {
            userId: user._id,
            title: args.title,
            description: args.description,
            imageUrl: args.imageUrl,
            link: args.link,
            createdAt: Date.now(),
        });
    },
});

export const getPortfolioItems = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("portfolio_items")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .order("desc")
            .collect();
    },
});

// Courses
export const addCourse = mutation({
    args: {
        title: v.string(),
        description: v.string(),
        price: v.number(),
        imageUrl: v.optional(v.string()),
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

        await ctx.db.insert("courses", {
            userId: user._id,
            title: args.title,
            description: args.description,
            price: args.price,
            imageUrl: args.imageUrl,
            createdAt: Date.now(),
        });
    },
});

export const getCourses = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("courses")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .order("desc")
            .collect();
    },
});
