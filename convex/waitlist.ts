import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";

// ==========================================
// PUBLIC MUTATIONS
// ==========================================

/**
 * Join the waitlist with email and optional details
 */
export const joinWaitlist = mutation({
    args: {
        email: v.string(),
        name: v.optional(v.string()),
        university: v.optional(v.string()),
        role: v.optional(v.union(v.literal("student"), v.literal("tutor"))),
        referralSource: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Normalize email to lowercase
        const email = args.email.toLowerCase().trim();

        // Check if email already exists
        const existing = await ctx.db
            .query("waitlist")
            .withIndex("by_email", (q) => q.eq("email", email))
            .first();

        if (existing) {
            return {
                success: false,
                alreadyExists: true,
                message: "You're already on the waitlist!",
            };
        }

        // Add to waitlist
        const id = await ctx.db.insert("waitlist", {
            email,
            name: args.name?.trim(),
            university: args.university?.trim(),
            role: args.role,
            referralSource: args.referralSource,
            createdAt: Date.now(),
        });

        return {
            success: true,
            alreadyExists: false,
            message: "You've been added to the waitlist!",
            id,
        };
    },
});

// ==========================================
// PUBLIC QUERIES
// ==========================================

/**
 * Check if an email is already on the waitlist
 */
export const checkWaitlistStatus = query({
    args: {
        email: v.string(),
    },
    handler: async (ctx, args) => {
        const email = args.email.toLowerCase().trim();

        const entry = await ctx.db
            .query("waitlist")
            .withIndex("by_email", (q) => q.eq("email", email))
            .first();

        return {
            isOnWaitlist: !!entry,
            joinedAt: entry?.createdAt,
        };
    },
});

/**
 * Get the total count of waitlist signups (for social proof)
 */
export const getWaitlistCount = query({
    args: {},
    handler: async (ctx) => {
        const entries = await ctx.db.query("waitlist").collect();
        return entries.length;
    },
});

// ==========================================
// ADMIN QUERIES
// ==========================================

/**
 * Get all waitlist entries (admin only)
 */
export const getWaitlistEntries = query({
    args: {
        limit: v.optional(v.number()),
        cursor: v.optional(v.string()),
    },
    handler: async (ctx) => {
        // Check if user is admin
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .first();

        if (!user?.isAdmin) {
            throw new Error("Admin access required");
        }

        // Get entries ordered by creation time (newest first)
        const entries = await ctx.db
            .query("waitlist")
            .withIndex("by_creation")
            .order("desc")
            .collect();

        return entries;
    },
});

/**
 * Get waitlist statistics (admin only)
 */
export const getWaitlistStats = query({
    args: {},
    handler: async (ctx) => {
        // Check if user is admin
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .first();

        if (!user?.isAdmin) {
            throw new Error("Admin access required");
        }

        const entries = await ctx.db.query("waitlist").collect();

        // Calculate stats
        const total = entries.length;
        const byRole = {
            student: entries.filter((e) => e.role === "student").length,
            tutor: entries.filter((e) => e.role === "tutor").length,
            unspecified: entries.filter((e) => !e.role).length,
        };

        const byReferral: Record<string, number> = {};
        entries.forEach((e) => {
            const source = e.referralSource || "direct";
            byReferral[source] = (byReferral[source] || 0) + 1;
        });

        // Last 7 days signups
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recentSignups = entries.filter(
            (e) => e.createdAt > sevenDaysAgo
        ).length;

        return {
            total,
            byRole,
            byReferral,
            recentSignups,
        };
    },
});

/**
 * Delete a waitlist entry (admin only)
 */
export const deleteWaitlistEntry = mutation({
    args: {
        id: v.id("waitlist"),
    },
    handler: async (ctx, args) => {
        // Check if user is admin
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .first();

        if (!user?.isAdmin) {
            throw new Error("Admin access required");
        }

        await ctx.db.delete(args.id);
        return { success: true };
    },
});
