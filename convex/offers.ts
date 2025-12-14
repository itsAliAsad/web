import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./utils";

export const create = mutation({
    args: {
        ticketId: v.id("tickets"),
        price: v.number(),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);

        // Check if ticket exists and is open
        const ticket = await ctx.db.get(args.ticketId);
        if (!ticket || ticket.status !== "open") {
            throw new Error("Ticket not available");
        }

        // Check if user already offered
        const existingOffer = await ctx.db
            .query("offers")
            .withIndex("by_ticket_and_tutor", (q) =>
                q.eq("ticketId", args.ticketId).eq("tutorId", user._id)
            )
            .unique();

        if (existingOffer) {
            throw new Error("You have already placed an offer");
        }

        const offerId = await ctx.db.insert("offers", {
            ticketId: args.ticketId,
            studentId: ticket.studentId,
            tutorId: user._id,
            price: args.price,
            status: "pending",
        });

        // Notify student
        await ctx.db.insert("notifications", {
            userId: ticket.studentId,
            type: "offer_received",
            data: { ticketId: args.ticketId, offerId },
            isRead: false,
            createdAt: Date.now(),
        });

        return offerId;
    },
});

// Primary function with new name
export const listByTicket = query({
    args: { ticketId: v.id("tickets") },
    handler: async (ctx, args) => {
        const offers = await ctx.db
            .query("offers")
            .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
            .collect();

        return await Promise.all(
            offers.map(async (offer) => {
                const tutor = await ctx.db.get(offer.tutorId);
                return {
                    ...offer,
                    tutorName: tutor?.name,
                    tutorId: offer.tutorId,
                    sellerName: tutor?.name, // Legacy alias
                    sellerId: offer.tutorId, // Legacy alias
                    sellerIsVerified: Boolean(tutor?.isVerified),
                };
            })
        );
    },
});

// Backward compat alias
export const listByRequest = query({
    args: { requestId: v.id("tickets") },
    handler: async (ctx, args) => {
        const offers = await ctx.db
            .query("offers")
            .withIndex("by_ticket", (q) => q.eq("ticketId", args.requestId))
            .collect();

        return await Promise.all(
            offers.map(async (offer) => {
                const tutor = await ctx.db.get(offer.tutorId);
                return {
                    ...offer,
                    tutorName: tutor?.name,
                    tutorId: offer.tutorId,
                    sellerName: tutor?.name,
                    sellerId: offer.tutorId,
                    sellerIsVerified: Boolean(tutor?.isVerified),
                };
            })
        );
    },
});

export const accept = mutation({
    args: {
        offerId: v.id("offers"),
        ticketId: v.optional(v.id("tickets")),
        requestId: v.optional(v.id("tickets")), // Legacy alias
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);

        // Support both ticketId and requestId for backward compat
        const resolvedTicketId = args.ticketId || args.requestId;
        if (!resolvedTicketId) throw new Error("ticketId is required");

        const ticket = await ctx.db.get(resolvedTicketId);
        if (!ticket) throw new Error("Ticket not found");
        if (user._id !== ticket.studentId) {
            throw new Error("Unauthorized");
        }

        // Update offer status
        await ctx.db.patch(args.offerId, { status: "accepted" });

        // Update ticket status
        await ctx.db.patch(resolvedTicketId, { status: "in_session" });

        // Reject other offers
        const otherOffers = await ctx.db
            .query("offers")
            .withIndex("by_ticket", (q) => q.eq("ticketId", resolvedTicketId))
            .collect();

        for (const offer of otherOffers) {
            if (offer._id !== args.offerId) {
                await ctx.db.patch(offer._id, { status: "rejected" });
            }
        }

        // Create conversation if it doesn't exist
        const offer = await ctx.db.get(args.offerId);
        if (!offer) throw new Error("Offer not found");

        const existing1 = await ctx.db
            .query("conversations")
            .withIndex("by_participant1", (q) => q.eq("participant1", user._id))
            .filter((q) => q.eq(q.field("participant2"), offer.tutorId))
            .first();

        const existing2 = await ctx.db
            .query("conversations")
            .withIndex("by_participant1", (q) => q.eq("participant1", offer.tutorId))
            .filter((q) => q.eq(q.field("participant2"), user._id))
            .first();

        let conversationId = existing1?._id || existing2?._id;

        if (!conversationId) {
            conversationId = await ctx.db.insert("conversations", {
                participant1: user._id,
                participant2: offer.tutorId,
                updatedAt: Date.now(),
            });
        }

        // Notify tutor
        await ctx.db.insert("notifications", {
            userId: offer.tutorId,
            type: "offer_accepted",
            data: { ticketId: resolvedTicketId, offerId: args.offerId },
            isRead: false,
            createdAt: Date.now(),
        });
    },
});

export const listMyOffers = query({
    args: {},
    handler: async (ctx) => {
        const user = await requireUser(ctx);

        const offers = await ctx.db
            .query("offers")
            .withIndex("by_tutor", (q) => q.eq("tutorId", user._id))
            .collect();

        return await Promise.all(
            offers.map(async (offer) => {
                const ticket = await ctx.db.get(offer.ticketId);
                return {
                    ...offer,
                    requestTitle: ticket?.title || "Unknown Ticket",
                    requestId: offer.ticketId, // Alias for backward compat
                };
            })
        );
    },
});

export const listBetweenUsers = query({
    args: { otherUserId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);

        const iAmStudent = await ctx.db
            .query("offers")
            .withIndex("by_student_and_tutor", (q) =>
                q.eq("studentId", user._id).eq("tutorId", args.otherUserId)
            )
            .collect();

        const iAmTutor = await ctx.db
            .query("offers")
            .withIndex("by_student_and_tutor", (q) =>
                q.eq("studentId", args.otherUserId).eq("tutorId", user._id)
            )
            .collect();

        const allOffers = [...iAmStudent, ...iAmTutor];

        return await Promise.all(
            allOffers.map(async (offer) => {
                const ticket = await ctx.db.get(offer.ticketId);
                return {
                    ...offer,
                    requestTitle: ticket?.title,
                    requestDescription: ticket?.description,
                    requestId: offer.ticketId, // Alias
                };
            })
        );
    },
});

export const listOffersForBuyer = query({
    args: {},
    handler: async (ctx) => {
        const user = await requireUser(ctx);

        // Get all tickets by this user (as student)
        const tickets = await ctx.db
            .query("tickets")
            .withIndex("by_student", (q) => q.eq("studentId", user._id))
            .collect();

        if (tickets.length === 0) return [];

        // Get offers for these tickets
        const offers = await Promise.all(
            tickets.map(async (ticket) => {
                const ticketOffers = await ctx.db
                    .query("offers")
                    .withIndex("by_ticket", (q) => q.eq("ticketId", ticket._id))
                    .collect();

                return ticketOffers.map(offer => ({
                    ...offer,
                    requestTitle: ticket.title,
                    requestId: offer.ticketId, // Alias for backward compat
                }));
            })
        );

        return offers.flat();
    },
});
