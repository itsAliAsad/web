import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { mutation, query, internalMutation } from "./_generated/server";
import { requireUser } from "./utils";

export const list = query({
    args: { paginationOpts: paginationOptsValidator },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx, { allowBanned: true });

        return await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .order("desc")
            .paginate(args.paginationOpts);
    },
});

export const markRead = mutation({
    args: { notificationId: v.id("notifications") },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx, { allowBanned: true });

        const notification = await ctx.db.get(args.notificationId);
        if (!notification) throw new Error("Notification not found");

        if (notification.userId !== user._id) throw new Error("Unauthorized");

        await ctx.db.patch(args.notificationId, { isRead: true });
    },
});

export const markAllRead = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await requireUser(ctx, { allowBanned: true });

        const unread = await ctx.db
            .query("notifications")
            .withIndex("by_user_and_read", (q) =>
                q.eq("userId", user._id).eq("isRead", false)
            )
            .collect();

        await Promise.all(
            unread.map((n) => ctx.db.patch(n._id, { isRead: true }))
        );
    },
});

export const create = mutation({
    args: {
        userId: v.id("users"),
        type: v.union(
            v.literal("offer_received"),
            v.literal("offer_accepted"),
            v.literal("request_completed"),
            v.literal("new_message")
        ),
        data: v.any(),
    },
    handler: async (ctx, args) => {
        // Internal use mostly, but can be public if secured or used by other mutations via internalMutation
        // For MVP, we'll keep it simple and call it directly from other mutations or make it internal.
        // Since we can't easily call other mutations from mutations in Convex without `internalMutation` and `internal`,
        // we'll define it as a helper function or just duplicate logic?
        // Better: Use `internalMutation` and call it via `ctx.runMutation` (only available in actions) or just insert directly in the other mutations.
        // Actually, for simplicity in MVP, I'll just export a helper function or insert directly in other files.
        // But to keep it clean, let's make it a mutation that can be called.
        // Wait, regular mutations can't call other mutations.
        // So I will just write the insert logic in the respective files for now, or use a helper function if I was in the same file.
        // Since they are different files, I'll just duplicate the insert code or import a helper if I extract it to a shared file.
        // For now, I'll just define the schema and queries here.
        // The `create` mutation here can be used for testing or admin.

        await ctx.db.insert("notifications", {
            userId: args.userId,
            type: args.type,
            data: args.data,
            isRead: false,
            createdAt: Date.now(),
        });
    },
});
