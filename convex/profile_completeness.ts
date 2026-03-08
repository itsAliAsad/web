import { query } from "./_generated/server";
import { requireUser } from "./utils";

export interface CompletenessItem {
    id: string;
    label: string;
    complete: boolean;
    /** Route the card action link points to */
    href: string;
}

export interface CompletenessResult {
    role: "tutor" | "student";
    score: number;       // 0–100
    completed: number;
    total: number;
    items: CompletenessItem[];
}

/** Tutor completeness — 10-point checklist */
export const getTutorCompleteness = query({
    handler: async (ctx): Promise<CompletenessResult | null> => {
        const user = await requireUser(ctx);
        if (user.role !== "tutor") return null;

        // Load related data
        const tutorProfile = await ctx.db
            .query("tutor_profiles")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .unique();

        const offerings = await ctx.db
            .query("tutor_offerings")
            .withIndex("by_tutor", (q) => q.eq("tutorId", user._id))
            .collect();

        const credentials = await ctx.db
            .query("tutor_credentials")
            .withIndex("by_tutor", (q) => q.eq("tutorId", user._id))
            .collect();

        const tickets = await ctx.db
            .query("tickets")
            .withIndex("by_student", (q) => q.eq("studentId", user._id))
            .collect();

        const hasCustomPhoto = !!(user.image && !user.image.includes("gravatar") && !user.image.includes("clerk.dev/default"));
        const hasBio = (user.bio?.length ?? 0) > 30;
        const hasUniversity = !!user.universityId;
        const hasScope = (user.teachingScope?.length ?? 0) > 0;
        const hasOfferings = offerings.length > 0;
        const hasHelpTypes = (tutorProfile?.settings?.allowedHelpTypes?.length ?? 0) > 0;
        const hasPersonalEmail = !!((user as Record<string, unknown>).personalEmail);
        const hasWhatsapp = !!((user as Record<string, unknown>).whatsappNumber);
        const hasCredentialDoc = credentials.some((c) => c.storageId);
        const hasRate = (tutorProfile?.settings?.minRate ?? 0) > 0;

        const hasPostedTicket = tickets.length > 0;

        const items: CompletenessItem[] = [
            { id: "photo",       label: "Profile photo uploaded",         complete: hasCustomPhoto,   href: "/settings" },
            { id: "bio",         label: "Bio filled in (30+ chars)",      complete: hasBio,           href: "/profile" },
            { id: "university",  label: "University set",                  complete: hasUniversity,    href: "/profile" },
            { id: "scope",       label: "Teaching scope selected",         complete: hasScope,         href: "/profile" },
            { id: "offerings",   label: "At least 1 subject/course linked", complete: hasOfferings,   href: "/profile" },
            { id: "helptypes",   label: "Help types set",                  complete: hasHelpTypes,     href: "/settings" },
            { id: "email",       label: "Personal email confirmed",        complete: hasPersonalEmail, href: "/settings" },
            { id: "whatsapp",    label: "WhatsApp number set",             complete: hasWhatsapp,      href: "/settings" },
            { id: "credential",  label: "Credential document uploaded",    complete: hasCredentialDoc, href: "/profile" },
            { id: "rate",        label: "Minimum rate set",                complete: hasRate,          href: "/settings" },
        ];

        const completed = items.filter((i) => i.complete).length;
        const total = items.length;

        return {
            role: "tutor",
            score: Math.round((completed / total) * 100),
            completed,
            total,
            items,
        };
    },
});

/** Student completeness — 6-point checklist */
export const getStudentCompleteness = query({
    handler: async (ctx): Promise<CompletenessResult | null> => {
        const user = await requireUser(ctx);
        if (user.role !== "student") return null;

        const tickets = await ctx.db
            .query("tickets")
            .withIndex("by_student", (q) => q.eq("studentId", user._id))
            .take(1);

        const hasCustomPhoto = !!(user.image && !user.image.includes("gravatar") && !user.image.includes("clerk.dev/default"));
        const hasBio = (user.bio?.length ?? 0) > 10;
        const hasUniversity = !!user.universityId;
        const hasPostedTicket = tickets.length > 0;
        const hasNotifPrefs = !!(user.notificationPreferences);
        const hasLinks = Object.values(user.links ?? {}).some(Boolean);

        const items: CompletenessItem[] = [
            { id: "photo",       label: "Profile photo uploaded",      complete: hasCustomPhoto,    href: "/settings" },
            { id: "bio",         label: "Bio filled in",                complete: hasBio,            href: "/profile" },
            { id: "university",  label: "University set",               complete: hasUniversity,     href: "/profile" },
            { id: "ticket",      label: "First request posted",         complete: hasPostedTicket,   href: "/requests/new" },
            { id: "notifs",      label: "Notification preferences set", complete: hasNotifPrefs,     href: "/settings" },
            { id: "links",       label: "Social link added",            complete: hasLinks,          href: "/settings" },
        ];

        const completed = items.filter((i) => i.complete).length;
        const total = items.length;

        return {
            role: "student",
            score: Math.round((completed / total) * 100),
            completed,
            total,
            items,
        };
    },
});
