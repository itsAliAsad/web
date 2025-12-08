import { MutationCtx, QueryCtx } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

interface RequireUserOptions {
    allowBanned?: boolean;
}

type Ctx = MutationCtx | QueryCtx;

async function fetchUser(ctx: Ctx): Promise<Doc<"users">> {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new Error("Unauthenticated");
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

    return user;
}

export async function requireUser(ctx: Ctx, options?: RequireUserOptions) {
    const user = await fetchUser(ctx);

    if (user.isBanned && !options?.allowBanned) {
        throw new Error("Your account has been banned. Please contact support.");
    }

    return user;
}

export async function requireAdmin(ctx: Ctx) {
    const user = await requireUser(ctx);
    if (!user.isAdmin) {
        throw new Error("Unauthorized: Admin access required");
    }
    return user;
}
