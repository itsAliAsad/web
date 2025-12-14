import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./utils";

// Add a course the tutor can help with
export const add = mutation({
    args: {
        courseId: v.id("university_courses"),
        level: v.string(), // "Beginner", "Intermediate", "Advanced"
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);

        // Check if already exists
        const existing = await ctx.db
            .query("tutor_offerings")
            .withIndex("by_tutor", (q) => q.eq("tutorId", user._id))
            .filter((q) => q.eq(q.field("courseId"), args.courseId))
            .first();

        if (existing) {
            throw new Error("You already offer this course");
        }

        return await ctx.db.insert("tutor_offerings", {
            tutorId: user._id,
            courseId: args.courseId,
            level: args.level,
        });
    },
});

// Remove a course offering
export const remove = mutation({
    args: { offeringId: v.id("tutor_offerings") },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);
        const offering = await ctx.db.get(args.offeringId);

        if (!offering) throw new Error("Offering not found");
        if (offering.tutorId !== user._id) throw new Error("Unauthorized");

        await ctx.db.delete(args.offeringId);
    },
});

// Get my offerings
export const listMyOfferings = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) return [];

        const offerings = await ctx.db
            .query("tutor_offerings")
            .withIndex("by_tutor", (q) => q.eq("tutorId", user._id))
            .collect();

        // Enrich with course info
        return await Promise.all(
            offerings.map(async (offering) => {
                const course = await ctx.db.get(offering.courseId);
                return {
                    ...offering,
                    courseCode: course?.code,
                    courseName: course?.name,
                    courseDepartment: course?.department,
                };
            })
        );
    },
});

// Get offerings for a specific tutor (public)
export const listByTutor = query({
    args: { tutorId: v.id("users") },
    handler: async (ctx, args) => {
        const offerings = await ctx.db
            .query("tutor_offerings")
            .withIndex("by_tutor", (q) => q.eq("tutorId", args.tutorId))
            .collect();

        return await Promise.all(
            offerings.map(async (offering) => {
                const course = await ctx.db.get(offering.courseId);
                return {
                    ...offering,
                    courseCode: course?.code,
                    courseName: course?.name,
                    courseDepartment: course?.department,
                };
            })
        );
    },
});

// Get tutors for a specific course
export const listByCourse = query({
    args: { courseId: v.id("university_courses") },
    handler: async (ctx, args) => {
        const offerings = await ctx.db
            .query("tutor_offerings")
            .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
            .collect();

        return await Promise.all(
            offerings.map(async (offering) => {
                const tutor = await ctx.db.get(offering.tutorId);
                return {
                    ...offering,
                    tutorName: tutor?.name,
                    tutorImage: tutor?.image,
                    tutorIsVerified: tutor?.isVerified,
                };
            })
        );
    },
});
