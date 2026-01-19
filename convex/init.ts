import { mutation } from "./_generated/server";

export const seed = mutation({
    handler: async (ctx) => {
        // 1. Seed courses
        // We can call the other mutation if we want, but better to just do logic here or call it via ctx.runMutation if internal?
        // User requested "Create a seed script `convex/init.ts` that populates 10 LUMS courses and creates 2 dummy users"

        // We can't easily call other mutations from a mutation in the same transaction unless we use 'ctx.runMutation' which isn't standard in Convex public API yet (only internal/actions).
        // Actually, we can just duplicate the logic or import the function if it's exported and reusable (but `ctx` is different).
        // Simplest is to just reimplement or call `university_courses:seed` from the client.
        // But the user said "Run the function... init:seed".
        // So `init:seed` should do it all.

        // Seed Courses
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
            const existing = await ctx.db
                .query("university_courses")
                .filter(q => q.eq(q.field("code"), course.code))
                .first();

            if (!existing) {
                await ctx.db.insert("university_courses", {
                    ...course,
                    isActive: true,
                });
            }
        }

        // Seed Dummy Users
        const users = [
            { name: "Alice Student", email: "alice@lums.edu.pk", tokenIdentifier: "alice_token", role: "student" as const },
            { name: "Bob Tutor", email: "bob@lums.edu.pk", tokenIdentifier: "bob_token", role: "tutor" as const },
        ];

        for (const u of users) {
            const existing = await ctx.db.query("users")
                .withIndex("by_token", q => q.eq("tokenIdentifier", u.tokenIdentifier))
                .unique();

            if (!existing) {
                const userId = await ctx.db.insert("users", {
                    name: u.name,
                    email: u.email,
                    tokenIdentifier: u.tokenIdentifier,
                    role: u.role,
                    university: "LUMS",
                    reputation: 0,
                    ratingSum: 0,
                    ratingCount: 0,
                    isVerified: true,
                    isAdmin: false,
                    isBanned: false,
                });

                if (u.role === "tutor") {
                    await ctx.db.insert("tutor_profiles", {
                        userId,
                        bio: "I am a helpful tutor.",
                        isOnline: true,
                        lastActiveAt: Date.now(),
                        creditBalance: 100,
                        settings: {
                            acceptingRequests: true,
                            acceptingPaid: true,
                            acceptingFree: true,
                            minRate: 500,
                            allowedHelpTypes: ["Debugging", "Concept"],
                        }
                    });
                }
            }
        }
    },
});
