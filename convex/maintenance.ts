import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// One-time helper to backfill rating counters on existing users.
export const backfillUserRatings = internalMutation({
    args: {},
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();
        let updated = 0;

        for (const user of users) {
            if (user.ratingSum === undefined || user.ratingCount === undefined) {
                await ctx.db.patch(user._id, {
                    ratingSum: 0,
                    ratingCount: 0,
                });
                updated += 1;
            }
        }

        return { updated };
    },
});

// One-time helper to backfill studentId on offers using the parent ticket.
export const backfillOfferStudentId = internalMutation({
    args: {},
    handler: async (ctx) => {
        const offers = await ctx.db.query("offers").collect();
        let updated = 0;

        for (const offer of offers) {
            // studentId may be missing in older data
            if (!offer.studentId) {
                const ticket = await ctx.db.get(offer.ticketId);
                if (ticket) {
                    await ctx.db.patch(offer._id, { studentId: ticket.studentId });
                    updated += 1;
                }
            }
        }

        return { updated };
    },
});

// Optional: backfill termsAcceptedAt for trusted seed/test accounts to avoid re-prompts.
export const backfillTermsAccepted = internalMutation({
    args: { timestamp: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const ts = args.timestamp ?? new Date().toISOString();
        const users = await ctx.db.query("users").collect();
        let updated = 0;

        for (const user of users) {
            if (!user.termsAcceptedAt) {
                await ctx.db.patch(user._id, { termsAcceptedAt: ts });
                updated += 1;
            }
        }

        return { updated };
    },
});