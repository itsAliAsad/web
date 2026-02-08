import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Internal only - use from Convex dashboard
export const seed = internalMutation({
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
            // Check if course exists by code. We'll use filter to be safe.

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
        // Get all active courses
        const allCourses = await ctx.db
            .query("university_courses")
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();

        // If empty query, return all active courses
        if (!args.query || args.query.trim() === "") {
            return allCourses.slice(0, 50);
        }

        // Normalize search query - lowercase and split into words
        const searchTerms = args.query.toLowerCase().trim().split(/\s+/);

        // Filter courses that match ANY of the search terms in code OR name
        const filtered = allCourses.filter((course) => {
            const code = course.code.toLowerCase();
            const name = course.name.toLowerCase();
            const combined = `${code} ${name}`;

            // Check if all search terms are found in the combined string
            return searchTerms.every((term) => combined.includes(term));
        });

        // Sort results: prioritize code matches, then name matches
        filtered.sort((a, b) => {
            const queryLower = args.query.toLowerCase();
            const aCodeMatch = a.code.toLowerCase().includes(queryLower);
            const bCodeMatch = b.code.toLowerCase().includes(queryLower);

            if (aCodeMatch && !bCodeMatch) return -1;
            if (!aCodeMatch && bCodeMatch) return 1;
            return 0;
        });

        return filtered.slice(0, 20);
    },
});

export const getAll = query({
    handler: async (ctx) => {
        return await ctx.db.query("university_courses").take(50);
    },
});
