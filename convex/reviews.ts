import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./utils";

export const create = mutation({
    args: {
        requestId: v.id("requests"),
        rating: v.number(),
        comment: v.optional(v.string()),
        type: v.union(v.literal("buyer_to_seller"), v.literal("seller_to_buyer")),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);
        const request = await ctx.db.get(args.requestId);
        if (!request) throw new Error("Request not found");

        const acceptedOffer = await ctx.db
            .query("offers")
            .withIndex("by_request", (q) => q.eq("requestId", args.requestId))
            .filter((q) => q.eq(q.field("status"), "accepted"))
            .unique();

        if (!acceptedOffer) throw new Error("No accepted offer found for this request");

        let revieweeId;
        if (args.type === "buyer_to_seller") {
            if (user._id !== request.buyerId) {
                throw new Error("Only the buyer can review the seller");
            }
            revieweeId = acceptedOffer.sellerId;
        } else {
            if (user._id !== acceptedOffer.sellerId) {
                throw new Error("Only the accepted seller can review the buyer");
            }
            if (request.status !== "completed") {
                throw new Error("Reviews from sellers are allowed after completion");
            }
            revieweeId = request.buyerId;
        }

        const existing = await ctx.db
            .query("reviews")
            .withIndex("by_reviewee", (q) => q.eq("revieweeId", revieweeId))
            .filter((q) => q.eq(q.field("requestId"), args.requestId))
            .filter((q) => q.eq(q.field("reviewerId"), user._id))
            .filter((q) => q.eq(q.field("type"), args.type))
            .first();

        if (existing) {
            throw new Error("You have already submitted this review");
        }

        await ctx.db.insert("reviews", {
            reviewerId: user._id,
            revieweeId,
            requestId: args.requestId,
            rating: args.rating,
            comment: args.comment,
            type: args.type,
        });

        const reviewee = await ctx.db.get(revieweeId);
        if (!reviewee) throw new Error("Reviewee not found");

        const nextRatingSum = (reviewee.ratingSum ?? 0) + args.rating;
        const nextRatingCount = (reviewee.ratingCount ?? 0) + 1;
        const newReputation =
            nextRatingCount > 0 ? nextRatingSum / nextRatingCount : 0;

        await ctx.db.patch(revieweeId, {
            ratingSum: nextRatingSum,
            ratingCount: nextRatingCount,
            reputation: newReputation,
        });
    },
});
