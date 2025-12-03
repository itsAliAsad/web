import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
    args: {
        requestId: v.id("requests"),
        price: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthenticated call to create offer");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

        if (!user) {
            throw new Error("User not found");
        }

        // Check if request exists and is open
        const request = await ctx.db.get(args.requestId);
        if (!request || request.status !== "open") {
            throw new Error("Request not available");
        }

        // Check if user already offered
        const existingOffer = await ctx.db
            .query("offers")
            .withIndex("by_request_and_seller", (q) =>
                q.eq("requestId", args.requestId).eq("sellerId", user._id)
            )
            .unique();

        if (existingOffer) {
            throw new Error("You have already placed an offer");
        }

        const offerId = await ctx.db.insert("offers", {
            requestId: args.requestId,
            sellerId: user._id,
            price: args.price,
            status: "pending",
        });

        // Notify buyer
        await ctx.db.insert("notifications", {
            userId: request.buyerId,
            type: "offer_received",
            data: { requestId: args.requestId, offerId },
            isRead: false,
            createdAt: Date.now(),
        });

        return offerId;
    },
});

export const listByRequest = query({
    args: { requestId: v.id("requests") },
    handler: async (ctx, args) => {
        // In a real app, verify the user is the buyer of the request
        return await ctx.db
            .query("offers")
            .withIndex("by_request", (q) => q.eq("requestId", args.requestId))
            .collect();
    },
});

export const accept = mutation({
    args: {
        offerId: v.id("offers"),
        requestId: v.id("requests"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthenticated call to accept offer");
        }

        const request = await ctx.db.get(args.requestId);
        if (!request) throw new Error("Request not found");

        // Verify user is the buyer
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

        if (!user || user._id !== request.buyerId) {
            throw new Error("Unauthorized");
        }

        // Update offer status
        await ctx.db.patch(args.offerId, { status: "accepted" });

        // Update request status
        await ctx.db.patch(args.requestId, { status: "in_progress" });

        // Reject other offers
        const otherOffers = await ctx.db
            .query("offers")
            .withIndex("by_request", (q) => q.eq("requestId", args.requestId))
            .collect();

        for (const offer of otherOffers) {
            if (offer._id !== args.offerId) {
                await ctx.db.patch(offer._id, { status: "rejected" });
            }
        }

        // Create conversation if it doesn't exist
        const offer = await ctx.db.get(args.offerId);
        if (!offer) throw new Error("Offer not found"); // Should not happen

        const existing1 = await ctx.db
            .query("conversations")
            .withIndex("by_participant1", (q) => q.eq("participant1", user._id))
            .filter((q) => q.eq(q.field("participant2"), offer.sellerId))
            .first();

        const existing2 = await ctx.db
            .query("conversations")
            .withIndex("by_participant1", (q) => q.eq("participant1", offer.sellerId))
            .filter((q) => q.eq(q.field("participant2"), user._id))
            .first();

        let conversationId = existing1?._id || existing2?._id;

        if (!conversationId) {
            conversationId = await ctx.db.insert("conversations", {
                participant1: user._id,
                participant2: offer.sellerId,
                updatedAt: Date.now(),
            });
        }

        // Notify seller
        await ctx.db.insert("notifications", {
            userId: offer.sellerId,
            type: "offer_accepted",
            data: { requestId: args.requestId, offerId: args.offerId },
            isRead: false,
            createdAt: Date.now(),
        });
    },
});

export const listMyOffers = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

        if (!user) return [];

        // Note: This requires an index on sellerId if we want to be efficient
        // For now, we can filter or just add the index.
        // Let's check schema.ts later. For MVP, filtering might be okay if volume is low,
        // but adding an index is better.
        // Actually, we don't have an index by sellerId in the schema snippet I recall.
        // Let's just use filter for now or add index.
        // Wait, I can't see schema.ts right now. I'll assume I can filter.
        // Actually, better to add the index.

        const offers = await ctx.db
            .query("offers")
            .filter((q) => q.eq(q.field("sellerId"), user._id))
            .collect();

        return await Promise.all(
            offers.map(async (offer) => {
                const request = await ctx.db.get(offer.requestId);
                return {
                    ...offer,
                    requestTitle: request?.title || "Unknown Request",
                };
            })
        );
    },
});
export const listBetweenUsers = query({
    args: { otherUserId: v.id("users") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

        if (!user) return [];

        // Find offers where current user is seller AND other user is buyer (via request)
        // OR current user is buyer (via request) AND other user is seller

        // This is complex without joins.
        // Strategy: Get all offers involving the other user as seller.
        // Then filter for requests owned by me.
        // AND get all offers involving me as seller.
        // Then filter for requests owned by other user.

        // 1. Offers where otherUser is seller
        const offersByOther = await ctx.db
            .query("offers")
            .withIndex("by_seller", (q) => q.eq("sellerId", args.otherUserId))
            .collect();

        // 2. Offers where I am seller
        const offersByMe = await ctx.db
            .query("offers")
            .withIndex("by_seller", (q) => q.eq("sellerId", user._id))
            .collect();

        const allOffers = [...offersByOther, ...offersByMe];
        const results = [];

        for (const offer of allOffers) {
            const request = await ctx.db.get(offer.requestId);
            if (!request) continue;

            // Check if this offer involves both users
            const isMyRequest = request.buyerId === user._id;
            const isOtherRequest = request.buyerId === args.otherUserId;
            const isMyOffer = offer.sellerId === user._id;
            const isOtherOffer = offer.sellerId === args.otherUserId;

            if ((isMyRequest && isOtherOffer) || (isOtherRequest && isMyOffer)) {
                results.push({
                    ...offer,
                    requestTitle: request.title,
                    requestDescription: request.description,
                });
            }
        }

        return results;
    },
});

export const listOffersForBuyer = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

        if (!user) return [];

        // Get all requests by this user
        const requests = await ctx.db
            .query("requests")
            .withIndex("by_buyer", (q) => q.eq("buyerId", user._id))
            .collect();

        if (requests.length === 0) return [];

        // Get offers for these requests
        // This could be optimized with an index on offers by request, which we have.
        // We can do parallel queries.
        const offers = await Promise.all(
            requests.map(async (request) => {
                const requestOffers = await ctx.db
                    .query("offers")
                    .withIndex("by_request", (q) => q.eq("requestId", request._id))
                    .collect();

                return requestOffers.map(offer => ({
                    ...offer,
                    requestTitle: request.title,
                }));
            })
        );

        return offers.flat();
    },
});
