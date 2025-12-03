import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
    args: {
        requestId: v.id("requests"),
        rating: v.number(),
        comment: v.optional(v.string()),
        type: v.union(v.literal("buyer_to_seller"), v.literal("seller_to_buyer")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthenticated call to create review");
        }

        const request = await ctx.db.get(args.requestId);
        if (!request) throw new Error("Request not found");

        // Verify user is involved
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

        if (!user) throw new Error("User not found");

        // Determine reviewee
        let revieweeId;
        if (args.type === "buyer_to_seller") {
            // Find the accepted offer to get the seller
            const offer = await ctx.db
                .query("offers")
                .withIndex("by_request", q => q.eq("requestId", args.requestId))
                .filter(q => q.eq(q.field("status"), "accepted"))
                .unique();

            if (!offer) throw new Error("No accepted offer found");
            revieweeId = offer.sellerId;
        } else {
            revieweeId = request.buyerId;
        }

        await ctx.db.insert("reviews", {
            reviewerId: user._id,
            revieweeId: revieweeId,
            requestId: args.requestId,
            rating: args.rating,
            comment: args.comment,
            type: args.type,
        });

        // Update reputation (simple average for MVP)
        const reviews = await ctx.db
            .query("reviews")
            .withIndex("by_reviewee", q => q.eq("revieweeId", revieweeId))
            .collect();

        const totalRating = reviews.reduce((acc, r) => acc + r.rating, 0);
        const newReputation = totalRating / reviews.length;

        await ctx.db.patch(revieweeId, { reputation: newReputation });
    },
});
