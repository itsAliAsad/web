import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./utils";

export const create = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        maxMembers: v.number(),
        courseId: v.id("university_courses"),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);

        const groupId = await ctx.db.insert("study_groups", {
            hostId: user._id,
            courseId: args.courseId,
            title: args.title,
            maxMembers: args.maxMembers,
            currentMembers: 1,
            status: "active",
            createdAt: Date.now(),
        });

        return groupId;
    },
});

export const join = mutation({
    args: { groupId: v.id("study_groups") },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);

        const group = await ctx.db.get(args.groupId);
        if (!group) throw new Error("Group not found");
        if (group.status !== "active") throw new Error("Group is not active");
        if (group.currentMembers >= group.maxMembers) throw new Error("Group is full");
        if (group.hostId === user._id) throw new Error("You are already the host");

        // Update member count
        await ctx.db.patch(args.groupId, {
            currentMembers: group.currentMembers + 1,
        });
    },
});

export const leave = mutation({
    args: { groupId: v.id("study_groups") },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);

        const group = await ctx.db.get(args.groupId);
        if (!group) throw new Error("Group not found");
        if (group.hostId === user._id) {
            throw new Error("Host cannot leave. Close the group instead.");
        }

        await ctx.db.patch(args.groupId, {
            currentMembers: Math.max(1, group.currentMembers - 1),
        });
    },
});

export const listByCourse = query({
    args: { courseId: v.optional(v.id("university_courses")) },
    handler: async (ctx, args) => {
        if (!args.courseId) {
            return [];
        }

        return await ctx.db
            .query("study_groups")
            .withIndex("by_course", (q) => q.eq("courseId", args.courseId!))
            .filter((q) => q.eq(q.field("status"), "active"))
            .collect();
    },
});
