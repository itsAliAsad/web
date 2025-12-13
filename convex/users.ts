import { v } from "convex/values";
import { z } from "zod";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./utils";

const updateSchema = z
    .object({
        bio: z.string().optional(),
        university: z.string().optional(),
        avatar: z.string().optional(),
        name: z.string().optional(),
        // New fields
        currency: z.string().optional(),
        language: z.string().optional(),
        theme: z.string().optional(),
        links: z.object({
            linkedin: z.string().optional(),
            portfolio: z.string().optional(),
            twitter: z.string().optional(),
        }).optional(),
        notificationPreferences: z.object({
            email_marketing: z.boolean(),
            email_transactional: z.boolean(),
            push_messages: z.boolean(),
        }).optional(),
        marketingConsent: z.boolean().optional(),
    })
    .strict();

export const store = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Called storeUser without authentication present");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

        if (user !== null) {
            // If we've seen this identity before but the name has changed, patch the value.
            const patch: any = { lastLoginAt: Date.now() };
            if (user.name !== identity.name) {
                patch.name = identity.name;
            }
            await ctx.db.patch(user._id, patch);
            return user._id;
        }

        // If it's a new identity, create a new `User`.
        return await ctx.db.insert("users", {
            tokenIdentifier: identity.tokenIdentifier,
            name: identity.name!,
            email: identity.email!,
            image: identity.pictureUrl,
            reputation: 0,
            ratingSum: 0,
            ratingCount: 0,
            role: "buyer",
            isVerified: false,
            isAdmin: false,
            isBanned: false,
            // Defaults
            lastLoginAt: Date.now(),
            notificationPreferences: {
                email_marketing: false,
                email_transactional: true,
                push_messages: true,
            },
            currency: "USD",
            language: "en",
            theme: "system",
            marketingConsent: false,
        });
    },
});

export const currentUser = query({
    args: {},
    handler: async (ctx) => {
        try {
            const user = await requireUser(ctx, { allowBanned: true });
            const ratingSum = user.ratingSum ?? 0;
            const ratingCount = user.ratingCount ?? 0;

            return {
                ...user,
                reputation: ratingCount > 0 ? ratingSum / ratingCount : 0,
            };
        } catch (error) {
            // If unauthenticated, return null to keep existing behavior
            if (error instanceof Error && error.message === "Unauthenticated") {
                return null;
            }
            throw error;
        }
    },
});

export const update = mutation({
    args: {
        updates: v.any(),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);

        const parsed = updateSchema.parse(args.updates ?? {});

        const patch: Record<string, unknown> = {};
        if (parsed.bio !== undefined) patch.bio = parsed.bio;
        if (parsed.university !== undefined) patch.university = parsed.university;
        if (parsed.avatar !== undefined) patch.image = parsed.avatar;
        if (parsed.name !== undefined) patch.name = parsed.name;
        if (parsed.currency !== undefined) patch.currency = parsed.currency;
        if (parsed.language !== undefined) patch.language = parsed.language;
        if (parsed.theme !== undefined) patch.theme = parsed.theme;
        if (parsed.links !== undefined) patch.links = parsed.links;
        if (parsed.notificationPreferences !== undefined) patch.notificationPreferences = parsed.notificationPreferences;
        if (parsed.marketingConsent !== undefined) {
            patch.marketingConsent = parsed.marketingConsent;
            patch.marketingConsentUpdatedAt = Date.now();
        }

        if (Object.keys(patch).length === 0) return;

        await ctx.db.patch(user._id, patch);
    },
});

export const get = query({
    args: { id: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.id);
        if (!user) return null;

        const ratingSum = user.ratingSum ?? 0;
        const ratingCount = user.ratingCount ?? 0;

        return {
            ...user,
            reputation: ratingCount > 0 ? ratingSum / ratingCount : 0,
        };
    },
});

export const setRole = mutation({
    args: { role: v.union(v.literal("buyer"), v.literal("seller")) },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);
        await ctx.db.patch(user._id, { role: args.role });
        return args.role;
    },
});

export const acceptTerms = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await requireUser(ctx, { allowBanned: true });
        const termsAcceptedAt = new Date().toISOString();

        await ctx.db.patch(user._id, { termsAcceptedAt });

        return termsAcceptedAt;
    },
});
