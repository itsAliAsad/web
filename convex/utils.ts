import { MutationCtx, QueryCtx } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { ConvexError } from "convex/values";

interface RequireUserOptions {
    allowBanned?: boolean;
}

type Ctx = MutationCtx | QueryCtx;

async function fetchUser(ctx: Ctx): Promise<Doc<"users">> {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new ConvexError("Unauthenticated");
    }

    const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
            q.eq("tokenIdentifier", identity.tokenIdentifier)
        )
        .unique();

    if (!user) {
        throw new ConvexError("User not found");
    }

    return user;
}

export async function requireUser(ctx: Ctx, options?: RequireUserOptions) {
    const user = await fetchUser(ctx);

    if (user.isBanned && !options?.allowBanned) {
        throw new ConvexError("Your account has been banned. Please contact support.");
    }

    return user;
}

export async function requireAdmin(ctx: Ctx) {
    const user = await requireUser(ctx);
    if (!user.isAdmin) {
        throw new ConvexError("Unauthorized: Admin access required");
    }
    return user;
}


import { Id } from "./_generated/dataModel";

export async function logAudit(
    ctx: MutationCtx,
    args: {
        action: string;
        actorId?: Id<"users">;
        targetId?: Id<"users">;
        targetType?: string;
        details?: any;
    }
) {
    await ctx.db.insert("audit_logs", {
        ...args,
        createdAt: Date.now(),
    });
}
