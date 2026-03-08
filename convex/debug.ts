import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./utils";

export const listDevUsers = query({
    args: {},
    handler: async (ctx) => {
        await requireAdmin(ctx);
        const users = await ctx.db.query("users").collect();
        return users.filter(u => !u.email.startsWith("tutor") && !u.email.startsWith("student")).map(u => ({ _id: u._id, name: u.name, email: u.email }));
    },
});

export const transferTicket = mutation({
    args: { ticketId: v.id("tickets"), targetUserId: v.id("users") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        
        const ticket = await ctx.db.get(args.ticketId);
        if (!ticket) throw new Error("Ticket not found");

        await ctx.db.patch(args.ticketId, { studentId: args.targetUserId });

        // Also update the pending offer that was created for the "student"
        const offers = await ctx.db.query("offers")
            .withIndex("by_ticket", q => q.eq("ticketId", args.ticketId))
            .collect();

        for (const offer of offers) {
            if (offer.studentId) {
                await ctx.db.patch(offer._id, { studentId: args.targetUserId });
            }
        }

        return `Transferred ticket ${args.ticketId} to user ${args.targetUserId}`;
    }
});

export const cleanupSeedData = mutation({
    args: { ticketId: v.id("tickets") },
    handler: async (ctx, args) => {
        await requireAdmin(ctx);
        
        // Create a dummy student for history
        let dummyStudent = await ctx.db.query("users").filter(q => q.eq(q.field("email"), "dummy_history@test.com")).first();
        if (!dummyStudent) {
            const dummyId = await ctx.db.insert("users", {
                name: "Dummy History Student",
                email: "dummy_history@test.com",
                tokenIdentifier: "dummy_history_" + Date.now(),
                reputation: 5,
                role: "student",
                verificationTier: "none" as const,
                ratingSum: 0,
                ratingCount: 0,
                marketingConsent: false,
            });
            dummyStudent = await ctx.db.get(dummyId);
        }

        // Find tickets that we already moved but assigned to wrong user in previous step
        const currentTicket = await ctx.db.get(args.ticketId);
        if (!currentTicket) return "Ticket not found";

        const dummyTickets = await ctx.db
            .query("tickets")
            .filter(q => q.eq(q.field("title"), "Previous Job (Seed Data)"))
            .filter(q => q.eq(q.field("studentId"), currentTicket.studentId))
            .collect();

        console.log(`Found ${dummyTickets.length} incorrectly assigned dummy tickets.`);

        for (const ticket of dummyTickets) {
            await ctx.db.patch(ticket._id, { studentId: dummyStudent!._id });

            // Also move the offers associated with these tickets
            const offers = await ctx.db
                .query("offers")
                .withIndex("by_ticket", q => q.eq("ticketId", ticket._id))
                .collect();

            for (const offer of offers) {
                await ctx.db.patch(offer._id, { studentId: dummyStudent!._id });
            }
        }

        return `Reassigned ${dummyTickets.length} dummy tickets to Dummy Student.`;
    }
});

export const clearAll = mutation({
    args: {},
    handler: async (ctx) => {
        const tables = [
            "audit_logs", "announcements", "courses", "portfolio_items", "reports",
            "notifications", "messages", "conversations", "reviews", "offers",
            "study_groups", "tutor_credentials", "crash_course_votes",
            "crash_course_applications", "crash_course_enrollments", "crash_courses",
            "tickets", "tutor_offerings", "university_courses", "tutor_profiles",
            "users", "universities",
        ] as const;

        let total = 0;
        for (const table of tables) {
            const docs = await ctx.db.query(table).collect();
            for (const doc of docs) {
                await ctx.db.delete(doc._id);
            }
            total += docs.length;
        }
        return `Deleted ${total} documents across all tables.`;
    },
});
