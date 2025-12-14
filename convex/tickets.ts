import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./utils";

export const create = mutation({
    args: {
        // Course is now optional for general requests
        courseId: v.optional(v.id("university_courses")),
        customCategory: v.optional(v.string()), // For non-course requests
        title: v.string(),
        description: v.string(),
        urgency: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
        helpType: v.string(),
        budget: v.optional(v.number()),
        deadline: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);

        // Validate: either courseId or customCategory must be provided
        if (!args.courseId && !args.customCategory) {
            throw new Error("Either a course or custom category must be specified");
        }

        // Get department from course if provided
        let department: string | undefined;
        if (args.courseId) {
            const course = await ctx.db.get(args.courseId);
            if (course) {
                department = course.department;
            }
        }

        const ticketId = await ctx.db.insert("tickets", {
            studentId: user._id,
            courseId: args.courseId,
            customCategory: args.customCategory,
            department,
            title: args.title,
            description: args.description,
            status: "open",
            urgency: args.urgency,
            helpType: args.helpType,
            budget: args.budget,
            deadline: args.deadline,
            createdAt: Date.now(),
        });

        return ticketId;
    },
});

// Alias for compatibility with old frontend code
export const listMyRequests = query({
    args: {},
    handler: async (ctx) => {
        const user = await requireUser(ctx);

        return await ctx.db
            .query("tickets")
            .withIndex("by_student", (q) => q.eq("studentId", user._id))
            .order("desc")
            .collect();
    },
});

export const listMyTickets = listMyRequests; // Alias

export const listOpen = query({
    args: {
        category: v.optional(v.string()),
        helpType: v.optional(v.string()),
        department: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        let results;

        // Use department index if filtering by department
        if (args.department && args.department !== "all") {
            results = await ctx.db
                .query("tickets")
                .withIndex("by_department", (q) =>
                    q.eq("department", args.department).eq("status", "open")
                )
                .order("desc")
                .collect();
        } else {
            results = await ctx.db
                .query("tickets")
                .withIndex("by_status", (q) => q.eq("status", "open"))
                .order("desc")
                .collect();
        }

        if (args.helpType && args.helpType !== "all") {
            results = results.filter((t) => t.helpType === args.helpType);
        }

        // Also support old 'category' arg for backward compat
        if (args.category && args.category !== "all") {
            results = results.filter((t) => t.helpType === args.category);
        }

        return results;
    },
});

export const get = query({
    args: { id: v.id("tickets") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const complete = mutation({
    args: { id: v.id("tickets") },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);

        const ticket = await ctx.db.get(args.id);
        if (!ticket) throw new Error("Ticket not found");
        if (user._id !== ticket.studentId) throw new Error("Unauthorized");

        await ctx.db.patch(args.id, { status: "resolved" });

        // Notify tutor who accepted the ticket
        const acceptedOffer = await ctx.db
            .query("offers")
            .withIndex("by_ticket", (q) => q.eq("ticketId", args.id))
            .filter((q) => q.eq(q.field("status"), "accepted"))
            .first();

        if (acceptedOffer) {
            await ctx.db.insert("notifications", {
                userId: acceptedOffer.tutorId,
                type: "ticket_resolved",
                data: { ticketId: args.id },
                isRead: false,
                createdAt: Date.now(),
            });
        }
    },
});

export const search = query({
    args: {
        query: v.string(),
        category: v.optional(v.string()),
        helpType: v.optional(v.string()),
        department: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        let results = await ctx.db
            .query("tickets")
            .withSearchIndex("search_title_description", (q) =>
                q.search("title", args.query)
            )
            .collect();

        // Filter by department
        if (args.department && args.department !== "all") {
            results = results.filter((t) => t.department === args.department);
        }

        // Filter by helpType (or old category)
        const filterType = args.helpType || args.category;
        if (filterType && filterType !== "all") {
            results = results.filter((t) => t.helpType === filterType);
        }

        return results;
    },
});

// New: List by department
export const listByDepartment = query({
    args: { department: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("tickets")
            .withIndex("by_department", (q) =>
                q.eq("department", args.department).eq("status", "open")
            )
            .order("desc")
            .collect();
    },
});

// New: Get history between student and tutor
export const getHistoryWithTutor = query({
    args: { tutorId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);

        return await ctx.db
            .query("tickets")
            .withIndex("by_student_and_tutor", (q) =>
                q.eq("studentId", user._id).eq("assignedTutorId", args.tutorId)
            )
            .order("desc")
            .collect();
    },
});
