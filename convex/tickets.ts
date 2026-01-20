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

        const tickets = await ctx.db
            .query("tickets")
            .withIndex("by_student", (q) => q.eq("studentId", user._id))
            .order("desc")
            .collect();

        return await Promise.all(
            tickets.map(async (ticket) => {
                let assignedTutorId = ticket.assignedTutorId;

                // Backfill for existing active tickets if needed
                if (!assignedTutorId && (ticket.status === "in_session" || ticket.status === "in_progress" || ticket.status === "resolved")) {
                    const offer = await ctx.db
                        .query("offers")
                        .withIndex("by_ticket", (q) => q.eq("ticketId", ticket._id))
                        .filter((q) => q.eq(q.field("status"), "accepted"))
                        .first();
                    if (offer) {
                        assignedTutorId = offer.tutorId;
                    }
                }

                return {
                    ...ticket,
                    assignedTutorId,
                };
            })
        );
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
        const ticket = await ctx.db.get(args.id);
        if (!ticket) return null;

        const student = await ctx.db.get(ticket.studentId);

        let studentDetails = undefined;
        if (student) {
            const ratingSum = student.ratingSum ?? 0;
            const ratingCount = student.ratingCount ?? 0;
            const reputation = ratingCount > 0 ? ratingSum / ratingCount : 0;

            studentDetails = {
                _id: student._id,
                name: student.name,
                image: student.image,
                university: student.university,
                isVerified: student.isVerified,
                reputation
            };
        }

        return {
            ...ticket,
            student: studentDetails
        };
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

        // Filter out non-open jobs
        results = results.filter((t) => t.status === "open");

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

// Get fresh matching jobs for tutor dashboard
export const matchingRecentJobs = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (!user) return [];

        // Get tutor's course offerings
        const offerings = await ctx.db
            .query("tutor_offerings")
            .withIndex("by_tutor", (q) => q.eq("tutorId", user._id))
            .collect();

        // Get tutor's allowed help types
        const tutorProfile = await ctx.db
            .query("tutor_profiles")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .unique();

        const allowedHelpTypes = tutorProfile?.settings?.allowedHelpTypes || [];
        const courseIds = offerings.map(o => o.courseId);

        // Get all open tickets (no time restriction)
        const allOpenTickets = await ctx.db
            .query("tickets")
            .withIndex("by_status", (q) => q.eq("status", "open"))
            .order("desc")
            .collect();

        // Score and filter tickets
        const scoredTickets = allOpenTickets
            .map(ticket => {
                let score = 0;

                // Course matching logic
                if (!ticket.courseId) {
                    // General job (no courseId) - show to everyone at lower priority
                    score += 0.7;
                } else if (courseIds.length > 0 && courseIds.includes(ticket.courseId)) {
                    // Direct course match
                    score += 1.0;
                } else if (courseIds.length === 0) {
                    // Tutor has no offerings - show all jobs at base priority
                    score += 0.5;
                } else {
                    // No match - filter out
                    return null;
                }

                // Help type filter (if tutor has preferences set)
                if (allowedHelpTypes.length > 0 && !allowedHelpTypes.includes(ticket.helpType)) {
                    return null;
                }

                // Urgency boost
                if (ticket.urgency === "high") score += 0.2;
                else if (ticket.urgency === "medium") score += 0.1;

                // Freshness boost (hours since creation)
                const hoursOld = (Date.now() - ticket.createdAt) / 3600000;
                if (hoursOld < 2) score += 0.15;
                else if (hoursOld < 6) score += 0.10;
                else if (hoursOld < 24) score += 0.05;

                return { ...ticket, _score: score };
            })
            .filter((t): t is NonNullable<typeof t> => t !== null);

        // Sort by score descending, then by creation time
        scoredTickets.sort((a, b) => {
            if (b._score !== a._score) return b._score - a._score;
            return b.createdAt - a.createdAt;
        });

        // Return top 10 (without the internal score field)
        return scoredTickets.slice(0, 10).map(({ _score, ...ticket }) => ticket);
    },
});

// Alias for new naming (can be used in frontend)
export const getRecommendedJobs = matchingRecentJobs;
