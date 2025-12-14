import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getMyProfile = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) return null;

        return await ctx.db
            .query("tutor_profiles")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .unique();
    },
});

export const updateProfile = mutation({
    args: {
        bio: v.optional(v.string()),
        minRate: v.optional(v.number()),
        allowedHelpTypes: v.optional(v.array(v.string())),
        acceptingRequests: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) throw new Error("User not found");

        const profile = await ctx.db
            .query("tutor_profiles")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .unique();

        if (profile) {
            const updates: any = {};
            if (args.bio !== undefined) updates.bio = args.bio;
            if (args.minRate !== undefined || args.allowedHelpTypes !== undefined || args.acceptingRequests !== undefined) {
                updates.settings = {
                    ...profile.settings,
                    ...(args.minRate !== undefined && { minRate: args.minRate }),
                    ...(args.allowedHelpTypes !== undefined && { allowedHelpTypes: args.allowedHelpTypes }),
                    ...(args.acceptingRequests !== undefined && { acceptingRequests: args.acceptingRequests }),
                };
            }
            await ctx.db.patch(profile._id, updates);
        } else {
            // Create new - use defaults if not provided
            await ctx.db.insert("tutor_profiles", {
                userId: user._id,
                bio: args.bio || "",
                isOnline: true,
                lastActiveAt: Date.now(),
                creditBalance: 0,
                settings: {
                    acceptingRequests: args.acceptingRequests ?? true,
                    acceptingPaid: true,
                    acceptingFree: false,
                    minRate: args.minRate ?? 500,
                    allowedHelpTypes: args.allowedHelpTypes || [],
                },
            });
        }
    },
});
