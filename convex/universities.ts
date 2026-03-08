import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./utils";

// ==========================================
// QUERIES
// ==========================================

/** List all active universities */
export const list = query({
    handler: async (ctx) => {
        return await ctx.db
            .query("universities")
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();
    },
});

/** Search universities by name (for onboarding dropdown) */
export const search = query({
    args: { query: v.string() },
    handler: async (ctx, args) => {
        if (!args.query.trim()) {
            return await ctx.db
                .query("universities")
                .filter((q) => q.eq(q.field("isActive"), true))
                .collect();
        }
        return await ctx.db
            .query("universities")
            .withSearchIndex("search_university", (q) =>
                q.search("name", args.query)
            )
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();
    },
});

/** Get a single university by ID */
export const get = query({
    args: { id: v.id("universities") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

// ==========================================
// MUTATIONS (Admin only)
// ==========================================

/** Seed initial universities (admin only) */
export const seed = mutation({
    handler: async (ctx) => {
        const user = await requireUser(ctx);
        if (user.role !== "admin") throw new Error("Unauthorized: admin only");

        const UNIVERSITIES = [
            // Lahore
            { name: "LUMS", shortName: "lums", city: "Lahore" },
            { name: "UET Lahore", shortName: "uet-lhe", city: "Lahore" },
            { name: "PU (University of the Punjab)", shortName: "pu", city: "Lahore" },
            { name: "COMSATS Lahore", shortName: "comsats-lhe", city: "Lahore" },
            { name: "Lahore School of Economics", shortName: "lse", city: "Lahore" },
            { name: "FC College Lahore", shortName: "fcc", city: "Lahore" },
            { name: "GCU Lahore", shortName: "gcu", city: "Lahore" },

            // Islamabad / Rawalpindi
            { name: "NUST", shortName: "nust", city: "Islamabad" },
            { name: "FAST NUCES (Islamabad)", shortName: "fast-isb", city: "Islamabad" },
            { name: "COMSATS Islamabad", shortName: "comsats-isb", city: "Islamabad" },
            { name: "QAU (Quaid-i-Azam University)", shortName: "qau", city: "Islamabad" },
            { name: "Air University", shortName: "au", city: "Islamabad" },
            { name: "SZABIST Islamabad", shortName: "szabist-isb", city: "Islamabad" },

            // Karachi
            { name: "IBA Karachi", shortName: "iba", city: "Karachi" },
            { name: "NED University", shortName: "ned", city: "Karachi" },
            { name: "FAST NUCES (Karachi)", shortName: "fast-khi", city: "Karachi" },
            { name: "SZABIST Karachi", shortName: "szabist-khi", city: "Karachi" },
            { name: "Karachi University (KU)", shortName: "ku", city: "Karachi" },
            { name: "IoBM", shortName: "iobm", city: "Karachi" },

            // Other cities
            { name: "GIKI", shortName: "giki", city: "Swabi" },
            { name: "ITU (Information Technology University)", shortName: "itu", city: "Lahore" },
        ];

        let inserted = 0;
        for (const uni of UNIVERSITIES) {
            // Idempotent: skip if already exists
            const existing = await ctx.db
                .query("universities")
                .withSearchIndex("search_university", (q) => q.search("name", uni.name))
                .filter((q) => q.eq(q.field("shortName"), uni.shortName))
                .first();
            if (!existing) {
                await ctx.db.insert("universities", { ...uni, isActive: true });
                inserted++;
            }
        }
        return { inserted };
    },
});

/** Create a single university (admin only) */
export const create = mutation({
    args: {
        name: v.string(),
        shortName: v.string(),
        city: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);
        if (user.role !== "admin") throw new Error("Unauthorized: admin only");

        return await ctx.db.insert("universities", {
            name: args.name,
            shortName: args.shortName,
            city: args.city,
            isActive: true,
        });
    },
});

/** Toggle a university's active status (admin only) */
export const setActive = mutation({
    args: { id: v.id("universities"), isActive: v.boolean() },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);
        if (user.role !== "admin") throw new Error("Unauthorized: admin only");

        await ctx.db.patch(args.id, { isActive: args.isActive });
    },
});
