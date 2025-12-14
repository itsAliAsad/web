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
        bio: v.string(),
        minRate: v.number(),
        allowedHelpTypes: v.array(v.string()),
        acceptingRequests: v.boolean(),
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
            await ctx.db.patch(profile._id, {
                bio: args.bio,
                settings: {
                    ...profile.settings,
                    minRate: args.minRate,
                    allowedHelpTypes: args.allowedHelpTypes,
                    acceptingRequests: args.acceptingRequests,
                    // Preserve other settings if needed, or defaults
                    acceptingPaid: profile.settings.acceptingPaid,
                    acceptingFree: profile.settings.acceptingFree,
                },
            });
        } else {
            // Create new
            await ctx.db.insert("tutor_profiles", {
                userId: user._id,
                bio: args.bio,
                isOnline: true,
                lastActiveAt: Date.now(),
                creditBalance: 0,
                settings: {
                    acceptingRequests: args.acceptingRequests,
                    acceptingPaid: true,
                    acceptingFree: false,
                    minRate: args.minRate,
                    allowedHelpTypes: args.allowedHelpTypes,
                },
            });
        }
    },
});
