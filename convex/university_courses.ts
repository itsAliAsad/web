import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const seed = mutation({
    handler: async (ctx) => {
        const courses = [
            { code: "CS 100", name: "Computational Problem Solving", department: "Computer Science" },
            { code: "CS 101", name: "Introduction to Computing", department: "Computer Science" },
            { code: "CS 200", name: "Data Structures", department: "Computer Science" },
            { code: "CS 202", name: "Digital Logic Circuits", department: "Computer Science" },
            { code: "CS 300", name: "Advanced Programming", department: "Computer Science" },
            { code: "MATH 101", name: "Calculus I", department: "Mathematics" },
            { code: "MATH 120", name: "Linear Algebra", department: "Mathematics" },
            { code: "PHY 101", name: "Mechanics", department: "Physics" },
            { code: "ECON 100", name: "Principles of Microeconomics", department: "Economics" },
            { code: "SS 100", name: "Writing and Communication", department: "Humanities" },
        ];

        for (const course of courses) {
            // Check if course exists by code using the search index roughly or by iterating.
            // Since searchIndex isn't great for exact match in mutations sometimes (event consistency), 
            // but for seeding it's okay. Or better, just insert if empty/wipe first.
            // But let's follow the previous logic or simpler:
            const existing = await ctx.db
                .query("university_courses")
                .withSearchIndex("search_course", (q) => q.search("code", course.code))
                .first();

            // Note: search queries in mutations are allowed but might not see immediately recent writes if not awaited/flushed?
            // Actually, standard queries are better for exact match if we had an index.
            // We do NOT have a unique index on 'code' in the schema, only a search index.
            // So 'search' is the way, or scan. Scan is fine for 10 items.

            // Let's use filter to be safe
            const existingExact = await ctx.db
                .query("university_courses")
                .filter(q => q.eq(q.field("code"), course.code))
                .first();

            if (!existingExact) {
                await ctx.db.insert("university_courses", {
                    ...course,
                    isActive: true,
                });
            }
        }
    },
});

export const search = query({
    args: { query: v.string() },
    handler: async (ctx, args) => {
        // If empty query, return all active courses
        if (!args.query || args.query.trim() === "") {
            return await ctx.db
                .query("university_courses")
                .filter((q) => q.eq(q.field("isActive"), true))
                .take(50);
        }

        // Otherwise search by code
        return await ctx.db
            .query("university_courses")
            .withSearchIndex("search_course", (q) => q.search("code", args.query))
            .take(10);
    },
});

export const getAll = query({
    handler: async (ctx) => {
        return await ctx.db.query("university_courses").take(50);
    },
});
