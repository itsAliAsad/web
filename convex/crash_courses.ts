import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { requireUser, RATE_LIMITS, INPUT_LIMITS, validateLength } from "./utils";
import { Id } from "./_generated/dataModel";

// ==========================================
// RATE LIMITS
// ==========================================
const CRASH_COURSE_RATE_LIMIT = { windowMs: 300_000, maxRequests: 5 }; // 5 per 5 min
const APPLICATION_RATE_LIMIT = { windowMs: 300_000, maxRequests: 10 }; // 10 per 5 min

// ==========================================
// MUTATIONS
// ==========================================

/**
 * Create a crash course.
 * - Supply (tutor): requires price, scheduledAt, duration. Status → "open".
 * - Demand (student): only preferences. Status → "requesting".
 */
export const create = mutation({
    args: {
        origin: v.union(v.literal("demand"), v.literal("supply")),
        courseId: v.optional(v.id("university_courses")),
        category: v.optional(v.union(
            v.literal("o_levels"),
            v.literal("a_levels"),
            v.literal("sat"),
            v.literal("ib"),
            v.literal("ap"),
            v.literal("general"),
        )),
        customSubject: v.optional(v.string()), // free text for non-university topics
        universityId: v.optional(v.id("universities")),
        title: v.string(),
        description: v.string(),
        topics: v.array(v.string()),
        examType: v.union(
            v.literal("quiz"),
            v.literal("midterm"),
            v.literal("final"),
            v.literal("other")
        ),
        maxEnrollment: v.optional(v.number()), // supply: required; demand: omitted (tutor sets it)
        // Supply-only (required for supply)
        pricePerStudent: v.optional(v.number()),
        scheduledAt: v.optional(v.number()),
        duration: v.optional(v.number()),
        location: v.optional(v.string()),
        minEnrollment: v.optional(v.number()), // supply-only (tutor sets this)
        // Demand-only (preferences)
        preferredDateRange: v.optional(v.string()),
        preferredDuration: v.optional(v.number()),
        budgetPerStudent: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);

        // Input validation
        validateLength(args.title, INPUT_LIMITS.TITLE_MAX, "Title");
        validateLength(args.description, INPUT_LIMITS.DESCRIPTION_MAX, "Description");
        if (args.topics.length === 0) {
            throw new Error("At least one topic is required");
        }
        if (args.topics.length > 20) {
            throw new Error("Maximum 20 topics allowed");
        }
        for (const topic of args.topics) {
            validateLength(topic, 100, "Topic");
        }
        if (args.origin === "supply") {
            if (!args.maxEnrollment || args.maxEnrollment < 2 || args.maxEnrollment > 200) {
                throw new Error("Max enrollment must be between 2 and 200");
            }
        }

        // Rate limiting
        const recentCourses = await ctx.db
            .query("crash_courses")
            .withIndex("by_creator", (q) => q.eq("creatorId", user._id))
            .filter((q) => q.gt(q.field("_creationTime"), Date.now() - CRASH_COURSE_RATE_LIMIT.windowMs))
            .collect();
        if (recentCourses.length >= CRASH_COURSE_RATE_LIMIT.maxRequests) {
            throw new Error("Rate limited: Too many crash courses created. Please wait.");
        }

        // Validate: must have either courseId or category
        if (!args.courseId && !args.category) {
            throw new Error("Either courseId or category must be provided");
        }

        // Get course details if university course
        const course = args.courseId ? await ctx.db.get(args.courseId) : null;
        if (args.courseId && (!course || !course.isActive)) {
            throw new Error("Course not found or inactive");
        }

        if (args.origin === "supply") {
            // Supply-side validations
            if (!args.pricePerStudent || args.pricePerStudent <= 0) {
                throw new Error("Price per student is required and must be positive");
            }
            if (args.pricePerStudent > 1_000_000) {
                throw new Error("Price exceeds maximum allowed");
            }
            if (!args.scheduledAt) {
                throw new Error("Scheduled date & time is required");
            }
            if (args.scheduledAt <= Date.now()) {
                throw new Error("Scheduled date must be in the future");
            }
            if (!args.duration || args.duration <= 0) {
                throw new Error("Duration is required and must be positive");
            }
            if (args.duration > 480) {
                throw new Error("Duration cannot exceed 8 hours");
            }

            const crashCourseId = await ctx.db.insert("crash_courses", {
                creatorId: user._id,
                origin: "supply",
                courseId: args.courseId,
                category: args.category,
                customSubject: args.customSubject,
                universityId: args.universityId,
                department: course?.department,
                title: args.title,
                description: args.description,
                topics: args.topics,
                examType: args.examType,
                scheduledAt: args.scheduledAt,
                duration: args.duration,
                location: args.location,
                pricePerStudent: args.pricePerStudent,
                maxEnrollment: args.maxEnrollment ?? 30,
                minEnrollment: args.minEnrollment,
                currentEnrollment: 0,
                selectedTutorId: user._id,
                status: "open",
                createdAt: Date.now(),
            });
            return crashCourseId;
        } else {
            // Demand-side
            if (args.budgetPerStudent !== undefined && args.budgetPerStudent < 0) {
                throw new Error("Budget must be non-negative");
            }

            const crashCourseId = await ctx.db.insert("crash_courses", {
                creatorId: user._id,
                origin: "demand",
                courseId: args.courseId,
                category: args.category,
                customSubject: args.customSubject,
                universityId: args.universityId,
                department: course?.department,
                title: args.title,
                description: args.description,
                topics: args.topics,
                examType: args.examType,
                preferredDateRange: args.preferredDateRange,
                preferredDuration: args.preferredDuration,
                budgetPerStudent: args.budgetPerStudent,
                maxEnrollment: 200, // no cap from student; tutor defines this via application
                currentEnrollment: 0,
                status: "requesting",
                createdAt: Date.now(),
            });

            // Auto-enroll creator as interested
            await ctx.db.insert("crash_course_enrollments", {
                crashCourseId,
                studentId: user._id,
                status: "interested",
                createdAt: Date.now(),
            });

            return crashCourseId;
        }
    },
});

/**
 * Enroll in a crash course.
 * - Supply: status → "enrolled"
 * - Demand (requesting/voting): status → "interested"
 */
export const enroll = mutation({
    args: {
        crashCourseId: v.id("crash_courses"),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);
        const crashCourse = await ctx.db.get(args.crashCourseId);
        if (!crashCourse || crashCourse.deletedAt) {
            throw new Error("Crash course not found");
        }

        // Check not already enrolled
        const existing = await ctx.db
            .query("crash_course_enrollments")
            .withIndex("by_crash_course_and_student", (q) =>
                q.eq("crashCourseId", args.crashCourseId).eq("studentId", user._id)
            )
            .first();
        if (existing && existing.status !== "withdrawn") {
            throw new Error("You are already enrolled in this crash course");
        }

        // Can't enroll in your own supply-side course as a student
        if (crashCourse.origin === "supply" && crashCourse.selectedTutorId === user._id) {
            throw new Error("You cannot enroll in your own crash course");
        }
        // Can't enroll if you're the creator of a demand course (already auto-enrolled)
        if (crashCourse.origin === "demand" && crashCourse.creatorId === user._id && !existing) {
            throw new Error("You are already enrolled as the creator");
        }

        if (crashCourse.origin === "supply") {
            if (crashCourse.status !== "open") {
                throw new Error("This crash course is not accepting enrollments");
            }
            if (crashCourse.currentEnrollment >= crashCourse.maxEnrollment) {
                throw new Error("This crash course is full");
            }

            if (existing) {
                await ctx.db.patch(existing._id, { status: "enrolled", createdAt: Date.now() });
            } else {
                await ctx.db.insert("crash_course_enrollments", {
                    crashCourseId: args.crashCourseId,
                    studentId: user._id,
                    status: "enrolled",
                    createdAt: Date.now(),
                });
            }

            const newCount = crashCourse.currentEnrollment + 1;
            await ctx.db.patch(args.crashCourseId, { currentEnrollment: newCount });

            // Auto-confirm if minEnrollment met
            if (crashCourse.minEnrollment && newCount >= crashCourse.minEnrollment && crashCourse.status === "open") {
                await ctx.db.patch(args.crashCourseId, { status: "confirmed" });
                // Notify all enrolled students
                const enrollments = await ctx.db
                    .query("crash_course_enrollments")
                    .withIndex("by_crash_course", (q) => q.eq("crashCourseId", args.crashCourseId))
                    .filter((q) => q.eq(q.field("status"), "enrolled"))
                    .collect();
                for (const enrollment of enrollments) {
                    await ctx.db.insert("notifications", {
                        userId: enrollment.studentId,
                        type: "crash_course_confirmed",
                        data: { crashCourseId: args.crashCourseId, title: crashCourse.title },
                        isRead: false,
                        createdAt: Date.now(),
                    });
                }
            }
        } else {
            // Demand-side: must be in requesting or voting
            if (crashCourse.status !== "requesting" && crashCourse.status !== "voting") {
                throw new Error("This crash course is not accepting new interest");
            }
            if (crashCourse.currentEnrollment >= crashCourse.maxEnrollment) {
                throw new Error("This crash course is full");
            }

            if (existing) {
                await ctx.db.patch(existing._id, { status: "interested", createdAt: Date.now() });
            } else {
                await ctx.db.insert("crash_course_enrollments", {
                    crashCourseId: args.crashCourseId,
                    studentId: user._id,
                    status: "interested",
                    createdAt: Date.now(),
                });
            }
            // Don't increment currentEnrollment for interested — only for confirmed enrollments
        }
    },
});

/**
 * Withdraw from a crash course.
 */
export const withdraw = mutation({
    args: {
        crashCourseId: v.id("crash_courses"),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);
        const crashCourse = await ctx.db.get(args.crashCourseId);
        if (!crashCourse) throw new Error("Crash course not found");

        const enrollment = await ctx.db
            .query("crash_course_enrollments")
            .withIndex("by_crash_course_and_student", (q) =>
                q.eq("crashCourseId", args.crashCourseId).eq("studentId", user._id)
            )
            .first();

        if (!enrollment || enrollment.status === "withdrawn") {
            throw new Error("You are not enrolled in this crash course");
        }

        // If demand creator, can't withdraw
        if (crashCourse.origin === "demand" && crashCourse.creatorId === user._id) {
            throw new Error("As the creator, you cannot withdraw. Cancel the crash course instead.");
        }

        const wasEnrolled = enrollment.status === "enrolled";
        await ctx.db.patch(enrollment._id, { status: "withdrawn" });

        if (wasEnrolled) {
            await ctx.db.patch(args.crashCourseId, {
                currentEnrollment: Math.max(0, crashCourse.currentEnrollment - 1),
            });
        }

        // Remove any votes by this student
        const vote = await ctx.db
            .query("crash_course_votes")
            .withIndex("by_crash_course_and_student", (q) =>
                q.eq("crashCourseId", args.crashCourseId).eq("studentId", user._id)
            )
            .first();
        if (vote) {
            const application = await ctx.db.get(vote.applicationId);
            if (application) {
                await ctx.db.patch(vote.applicationId, {
                    voteCount: Math.max(0, application.voteCount - 1),
                });
            }
            await ctx.db.delete(vote._id);
        }
    },
});

/**
 * Tutor applies to teach a demand-side crash course.
 */
export const apply = mutation({
    args: {
        crashCourseId: v.id("crash_courses"),
        pitch: v.string(),
        proposedPrice: v.number(),
        proposedDate: v.number(),
        proposedDuration: v.number(),
        proposedLocation: v.optional(v.string()),
        topicsCovered: v.array(v.string()),
        proposedMinEnrollment: v.optional(v.number()),
        proposedMaxEnrollment: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);

        // Input validation
        validateLength(args.pitch, INPUT_LIMITS.DESCRIPTION_MAX, "Pitch");
        if (args.proposedPrice <= 0 || args.proposedPrice > 1_000_000) {
            throw new Error("Price must be between 1 and 1,000,000");
        }
        if (args.proposedDate <= Date.now()) {
            throw new Error("Proposed date must be in the future");
        }
        if (args.proposedDuration <= 0 || args.proposedDuration > 480) {
            throw new Error("Duration must be between 1 and 480 minutes");
        }
        if (args.topicsCovered.length === 0) {
            throw new Error("You must cover at least one topic");
        }
        if (args.proposedMinEnrollment !== undefined && (args.proposedMinEnrollment < 1 || args.proposedMinEnrollment > 200)) {
            throw new Error("Min enrollment must be between 1 and 200");
        }
        if (args.proposedMaxEnrollment !== undefined && (args.proposedMaxEnrollment < 2 || args.proposedMaxEnrollment > 200)) {
            throw new Error("Max enrollment must be between 2 and 200");
        }
        if (args.proposedMinEnrollment !== undefined && args.proposedMaxEnrollment !== undefined && args.proposedMinEnrollment > args.proposedMaxEnrollment) {
            throw new Error("Min enrollment cannot exceed max enrollment");
        }

        const crashCourse = await ctx.db.get(args.crashCourseId);
        if (!crashCourse || crashCourse.deletedAt) {
            throw new Error("Crash course not found");
        }
        if (crashCourse.origin !== "demand") {
            throw new Error("Can only apply to student-requested crash courses");
        }
        if (crashCourse.status !== "requesting") {
            throw new Error("This crash course is not accepting applications");
        }
        if (crashCourse.creatorId === user._id) {
            throw new Error("You cannot apply to your own crash course request");
        }

        // Rate limiting
        const recentApps = await ctx.db
            .query("crash_course_applications")
            .withIndex("by_tutor", (q) => q.eq("tutorId", user._id))
            .filter((q) => q.gt(q.field("_creationTime"), Date.now() - APPLICATION_RATE_LIMIT.windowMs))
            .collect();
        if (recentApps.length >= APPLICATION_RATE_LIMIT.maxRequests) {
            throw new Error("Rate limited: Too many applications. Please wait.");
        }

        // Check for duplicate
        const existing = await ctx.db
            .query("crash_course_applications")
            .withIndex("by_crash_course_and_tutor", (q) =>
                q.eq("crashCourseId", args.crashCourseId).eq("tutorId", user._id)
            )
            .first();
        if (existing) {
            throw new Error("You have already applied to this crash course");
        }

        const appId = await ctx.db.insert("crash_course_applications", {
            crashCourseId: args.crashCourseId,
            tutorId: user._id,
            pitch: args.pitch,
            proposedPrice: args.proposedPrice,
            proposedDate: args.proposedDate,
            proposedDuration: args.proposedDuration,
            proposedLocation: args.proposedLocation,
            topicsCovered: args.topicsCovered,
            proposedMinEnrollment: args.proposedMinEnrollment,
            proposedMaxEnrollment: args.proposedMaxEnrollment,
            voteCount: 0,
            status: "pending",
            createdAt: Date.now(),
        });

        // Notify crash course creator
        await ctx.db.insert("notifications", {
            userId: crashCourse.creatorId,
            type: "crash_course_application",
            data: {
                crashCourseId: args.crashCourseId,
                title: crashCourse.title,
                tutorId: user._id,
                tutorName: user.name,
            },
            isRead: false,
            createdAt: Date.now(),
        });

        return appId;
    },
});

/**
 * Start voting phase on a demand-side crash course.
 */
export const startVoting = mutation({
    args: {
        crashCourseId: v.id("crash_courses"),
        votingDeadlineHours: v.optional(v.number()), // hours from now, default 48
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);
        const crashCourse = await ctx.db.get(args.crashCourseId);
        if (!crashCourse) throw new Error("Crash course not found");
        if (crashCourse.creatorId !== user._id) {
            throw new Error("Only the creator can start voting");
        }
        if (crashCourse.status !== "requesting") {
            throw new Error("Crash course must be in requesting status to start voting");
        }

        // Check there's at least 1 application
        const applications = await ctx.db
            .query("crash_course_applications")
            .withIndex("by_crash_course", (q) => q.eq("crashCourseId", args.crashCourseId))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .collect();
        if (applications.length === 0) {
            throw new Error("At least one tutor application is required before voting");
        }

        const hours = args.votingDeadlineHours ?? 48;
        const votingDeadline = Date.now() + hours * 60 * 60 * 1000;

        await ctx.db.patch(args.crashCourseId, {
            status: "voting",
            votingDeadline,
        });

        // Notify all interested students
        const enrollments = await ctx.db
            .query("crash_course_enrollments")
            .withIndex("by_crash_course", (q) => q.eq("crashCourseId", args.crashCourseId))
            .filter((q) => q.eq(q.field("status"), "interested"))
            .collect();
        for (const enrollment of enrollments) {
            await ctx.db.insert("notifications", {
                userId: enrollment.studentId,
                type: "crash_course_vote_open",
                data: { crashCourseId: args.crashCourseId, title: crashCourse.title },
                isRead: false,
                createdAt: Date.now(),
            });
        }
    },
});

/**
 * Vote for a tutor application. One vote per student per crash course.
 * Can change vote.
 */
export const vote = mutation({
    args: {
        applicationId: v.id("crash_course_applications"),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);
        const application = await ctx.db.get(args.applicationId);
        if (!application || application.status !== "pending") {
            throw new Error("Application not found or not pending");
        }

        const crashCourse = await ctx.db.get(application.crashCourseId);
        if (!crashCourse || crashCourse.status !== "voting") {
            throw new Error("Voting is not open for this crash course");
        }

        // Verify user is enrolled (interested)
        const enrollment = await ctx.db
            .query("crash_course_enrollments")
            .withIndex("by_crash_course_and_student", (q) =>
                q.eq("crashCourseId", application.crashCourseId).eq("studentId", user._id)
            )
            .first();
        if (!enrollment || enrollment.status === "withdrawn") {
            throw new Error("You must be enrolled to vote");
        }

        // Check for existing vote
        const existingVote = await ctx.db
            .query("crash_course_votes")
            .withIndex("by_crash_course_and_student", (q) =>
                q.eq("crashCourseId", application.crashCourseId).eq("studentId", user._id)
            )
            .first();

        if (existingVote) {
            if (existingVote.applicationId === args.applicationId) {
                throw new Error("You have already voted for this application");
            }
            // Change vote: decrement old, increment new
            const oldApplication = await ctx.db.get(existingVote.applicationId);
            if (oldApplication) {
                await ctx.db.patch(existingVote.applicationId, {
                    voteCount: Math.max(0, oldApplication.voteCount - 1),
                });
            }
            await ctx.db.delete(existingVote._id);
        }

        // Create new vote
        await ctx.db.insert("crash_course_votes", {
            applicationId: args.applicationId,
            crashCourseId: application.crashCourseId,
            studentId: user._id,
            createdAt: Date.now(),
        });

        await ctx.db.patch(args.applicationId, {
            voteCount: application.voteCount + 1,
        });
    },
});

/**
 * Select a tutor (creator picks or auto from top vote).
 * Moves to "confirming" phase. Copies quote to crash course.
 */
export const selectTutor = mutation({
    args: {
        crashCourseId: v.id("crash_courses"),
        applicationId: v.id("crash_course_applications"),
        confirmationDeadlineHours: v.optional(v.number()), // default 48
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);
        const crashCourse = await ctx.db.get(args.crashCourseId);
        if (!crashCourse) throw new Error("Crash course not found");
        if (crashCourse.creatorId !== user._id) {
            throw new Error("Only the creator can select a tutor");
        }
        if (crashCourse.status !== "voting" && crashCourse.status !== "requesting") {
            throw new Error("Cannot select tutor in current status");
        }

        const application = await ctx.db.get(args.applicationId);
        if (!application || application.crashCourseId !== args.crashCourseId) {
            throw new Error("Application not found for this crash course");
        }

        const hours = args.confirmationDeadlineHours ?? 48;
        const confirmationDeadline = Date.now() + hours * 60 * 60 * 1000;

        // Copy quote + enrollment terms to crash course
        await ctx.db.patch(args.crashCourseId, {
            selectedTutorId: application.tutorId,
            pricePerStudent: application.proposedPrice,
            scheduledAt: application.proposedDate,
            duration: application.proposedDuration,
            location: application.proposedLocation,
            minEnrollment: application.proposedMinEnrollment,
            maxEnrollment: application.proposedMaxEnrollment ?? 200,
            status: "confirming",
            confirmationDeadline,
        });

        // Mark selected application
        await ctx.db.patch(args.applicationId, { status: "selected" });

        // Reject other applications
        const allApplications = await ctx.db
            .query("crash_course_applications")
            .withIndex("by_crash_course", (q) => q.eq("crashCourseId", args.crashCourseId))
            .collect();
        for (const app of allApplications) {
            if (app._id !== args.applicationId && app.status === "pending") {
                await ctx.db.patch(app._id, { status: "rejected" });
            }
        }

        // Move all interested enrollments to pending_confirmation
        const enrollments = await ctx.db
            .query("crash_course_enrollments")
            .withIndex("by_crash_course", (q) => q.eq("crashCourseId", args.crashCourseId))
            .filter((q) => q.eq(q.field("status"), "interested"))
            .collect();
        for (const enrollment of enrollments) {
            await ctx.db.patch(enrollment._id, { status: "pending_confirmation" });
            // Notify each student
            await ctx.db.insert("notifications", {
                userId: enrollment.studentId,
                type: "crash_course_confirmed",
                data: {
                    crashCourseId: args.crashCourseId,
                    title: crashCourse.title,
                    price: application.proposedPrice,
                    scheduledAt: application.proposedDate,
                },
                isRead: false,
                createdAt: Date.now(),
            });
        }

        // Notify the selected tutor
        await ctx.db.insert("notifications", {
            userId: application.tutorId,
            type: "crash_course_selected",
            data: { crashCourseId: args.crashCourseId, title: crashCourse.title },
            isRead: false,
            createdAt: Date.now(),
        });
    },
});

/**
 * Confirm enrollment after tutor selection (demand-side).
 * Student commits at the announced price.
 */
export const confirmEnrollment = mutation({
    args: {
        crashCourseId: v.id("crash_courses"),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);
        const crashCourse = await ctx.db.get(args.crashCourseId);
        if (!crashCourse) throw new Error("Crash course not found");
        if (crashCourse.status !== "confirming") {
            throw new Error("Crash course is not in confirmation phase");
        }

        const enrollment = await ctx.db
            .query("crash_course_enrollments")
            .withIndex("by_crash_course_and_student", (q) =>
                q.eq("crashCourseId", args.crashCourseId).eq("studentId", user._id)
            )
            .first();

        if (!enrollment || enrollment.status !== "pending_confirmation") {
            throw new Error("No pending confirmation found");
        }

        await ctx.db.patch(enrollment._id, { status: "enrolled" });

        const newCount = crashCourse.currentEnrollment + 1;
        await ctx.db.patch(args.crashCourseId, { currentEnrollment: newCount });

        // Auto-confirm the crash course if minEnrollment met
        if (crashCourse.minEnrollment && newCount >= crashCourse.minEnrollment) {
            await ctx.db.patch(args.crashCourseId, { status: "confirmed" });
        }
    },
});

/**
 * Creator or tutor manually locks in a confirming crash course as confirmed.
 * For demand-side courses, warns if confirmed count is below minEnrollment.
 */
export const lockIn = mutation({
    args: {
        crashCourseId: v.id("crash_courses"),
        forceLockin: v.optional(v.boolean()), // acknowledge low enrollment
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);
        const crashCourse = await ctx.db.get(args.crashCourseId);
        if (!crashCourse) throw new Error("Crash course not found");

        const isCreator = crashCourse.creatorId === user._id;
        const isTutor = crashCourse.selectedTutorId === user._id;
        if (!isCreator && !isTutor) {
            throw new Error("Only the creator or selected tutor can lock in");
        }

        if (crashCourse.status !== "confirming" && crashCourse.status !== "open" && crashCourse.status !== "pending_tutor_review") {
            throw new Error("Cannot lock in from current status");
        }

        // For demand-side: guard against low enrollment
        if (
            crashCourse.origin === "demand" &&
            crashCourse.minEnrollment &&
            crashCourse.currentEnrollment < crashCourse.minEnrollment &&
            !args.forceLockin
        ) {
            throw new Error(
                `Only ${crashCourse.currentEnrollment} of ${crashCourse.minEnrollment} required students confirmed. Pass forceLockin to proceed, or renegotiate.`
            );
        }

        await ctx.db.patch(args.crashCourseId, { status: "confirmed" });

        // Notify all enrolled students
        const enrollments = await ctx.db
            .query("crash_course_enrollments")
            .withIndex("by_crash_course", (q) => q.eq("crashCourseId", args.crashCourseId))
            .filter((q) => q.eq(q.field("status"), "enrolled"))
            .collect();
        for (const enrollment of enrollments) {
            await ctx.db.insert("notifications", {
                userId: enrollment.studentId,
                type: "crash_course_confirmed",
                data: { crashCourseId: args.crashCourseId, title: crashCourse.title },
                isRead: false,
                createdAt: Date.now(),
            });
        }
    },
});

/**
 * Start the crash course session.
 */
export const start = mutation({
    args: { crashCourseId: v.id("crash_courses") },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);
        const crashCourse = await ctx.db.get(args.crashCourseId);
        if (!crashCourse) throw new Error("Crash course not found");

        const isTutor = crashCourse.selectedTutorId === user._id;
        const isCreator = crashCourse.creatorId === user._id;
        if (!isTutor && !isCreator) {
            throw new Error("Only the tutor or creator can start the session");
        }
        if (crashCourse.status !== "confirmed") {
            throw new Error("Crash course must be confirmed before starting");
        }

        await ctx.db.patch(args.crashCourseId, { status: "in_progress" });
    },
});

/**
 * Complete the crash course.
 */
export const complete = mutation({
    args: { crashCourseId: v.id("crash_courses") },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);
        const crashCourse = await ctx.db.get(args.crashCourseId);
        if (!crashCourse) throw new Error("Crash course not found");

        const isTutor = crashCourse.selectedTutorId === user._id;
        const isCreator = crashCourse.creatorId === user._id;
        if (!isTutor && !isCreator) {
            throw new Error("Only the tutor or creator can complete the session");
        }
        if (crashCourse.status !== "in_progress") {
            throw new Error("Crash course must be in progress to complete");
        }

        await ctx.db.patch(args.crashCourseId, { status: "completed" });
    },
});

/**
 * Cancel the crash course.
 */
export const cancel = mutation({
    args: { crashCourseId: v.id("crash_courses") },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);
        const crashCourse = await ctx.db.get(args.crashCourseId);
        if (!crashCourse) throw new Error("Crash course not found");

        const isCreator = crashCourse.creatorId === user._id;
        const isTutor = crashCourse.selectedTutorId === user._id;
        if (!isCreator && !isTutor) {
            throw new Error("Only the creator or tutor can cancel");
        }
        if (crashCourse.status === "completed" || crashCourse.status === "cancelled") {
            throw new Error("Cannot cancel a completed or already cancelled crash course");
        }

        await ctx.db.patch(args.crashCourseId, { status: "cancelled" });

        // Notify all enrolled/interested students
        const enrollments = await ctx.db
            .query("crash_course_enrollments")
            .withIndex("by_crash_course", (q) => q.eq("crashCourseId", args.crashCourseId))
            .filter((q) => q.neq(q.field("status"), "withdrawn"))
            .collect();
        for (const enrollment of enrollments) {
            await ctx.db.insert("notifications", {
                userId: enrollment.studentId,
                type: "crash_course_cancelled",
                data: { crashCourseId: args.crashCourseId, title: crashCourse.title },
                isRead: false,
                createdAt: Date.now(),
            });
        }
    },
});

/**
 * Tutor reviews a demand-side crash course after the confirmation deadline
 * when too few students confirmed (status: "pending_tutor_review").
 *
 * Decisions:
 *  - "accept"       → proceed to "confirmed" at the current price.
 *  - "renegotiate"  → set a new pricePerStudent, move enrolled students back to
 *                     pending_confirmation, and reopen a 24-hour confirmation window.
 *  - "cancel"       → cancel without penalty.
 */
export const tutorReviewDecision = mutation({
    args: {
        crashCourseId: v.id("crash_courses"),
        decision: v.union(v.literal("accept"), v.literal("renegotiate"), v.literal("cancel")),
        newPrice: v.optional(v.number()), // required when decision === "renegotiate"
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);
        const crashCourse = await ctx.db.get(args.crashCourseId);
        if (!crashCourse) throw new Error("Crash course not found");

        if (crashCourse.status !== "pending_tutor_review") {
            throw new Error("This crash course is not pending tutor review");
        }

        const isTutor = crashCourse.selectedTutorId === user._id;
        if (!isTutor) {
            throw new Error("Only the selected tutor can make this decision");
        }

        const now = Date.now();

        if (args.decision === "accept") {
            // Proceed with however many students confirmed
            await ctx.db.patch(args.crashCourseId, { status: "confirmed" });

            // Notify enrolled students
            const enrollments = await ctx.db
                .query("crash_course_enrollments")
                .withIndex("by_crash_course", (q) => q.eq("crashCourseId", args.crashCourseId))
                .filter((q) => q.eq(q.field("status"), "enrolled"))
                .collect();
            for (const enrollment of enrollments) {
                await ctx.db.insert("notifications", {
                    userId: enrollment.studentId,
                    type: "crash_course_confirmed",
                    data: { crashCourseId: args.crashCourseId, title: crashCourse.title },
                    isRead: false,
                    createdAt: now,
                });
            }
        } else if (args.decision === "renegotiate") {
            if (!args.newPrice || args.newPrice <= 0) {
                throw new Error("A valid new price is required for renegotiation");
            }

            // Move already-confirmed students back to pending_confirmation
            const confirmedEnrollments = await ctx.db
                .query("crash_course_enrollments")
                .withIndex("by_crash_course", (q) => q.eq("crashCourseId", args.crashCourseId))
                .filter((q) => q.eq(q.field("status"), "enrolled"))
                .collect();
            for (const enrollment of confirmedEnrollments) {
                await ctx.db.patch(enrollment._id, { status: "pending_confirmation" });
                await ctx.db.insert("notifications", {
                    userId: enrollment.studentId,
                    type: "crash_course_low_enrollment",
                    data: {
                        crashCourseId: args.crashCourseId,
                        title: crashCourse.title,
                        oldPrice: crashCourse.pricePerStudent,
                        newPrice: args.newPrice,
                        message: "The tutor has proposed a new price due to low enrollment. Please re-confirm.",
                    },
                    isRead: false,
                    createdAt: now,
                });
            }

            // Reset currentEnrollment to 0 since all enrolled are now pending
            const newConfirmationDeadline = now + 24 * 60 * 60 * 1000; // 24 hours
            await ctx.db.patch(args.crashCourseId, {
                pricePerStudent: args.newPrice,
                currentEnrollment: 0,
                status: "confirming",
                confirmationDeadline: newConfirmationDeadline,
            });
        } else {
            // Cancel without penalty
            await ctx.db.patch(args.crashCourseId, { status: "cancelled" });

            const allEnrollments = await ctx.db
                .query("crash_course_enrollments")
                .withIndex("by_crash_course", (q) => q.eq("crashCourseId", args.crashCourseId))
                .filter((q) => q.neq(q.field("status"), "withdrawn"))
                .collect();
            for (const enrollment of allEnrollments) {
                await ctx.db.insert("notifications", {
                    userId: enrollment.studentId,
                    type: "crash_course_cancelled",
                    data: {
                        crashCourseId: args.crashCourseId,
                        title: crashCourse.title,
                        message: "The tutor cancelled due to insufficient enrollment.",
                    },
                    isRead: false,
                    createdAt: now,
                });
            }

            // Notify course creator
            if (crashCourse.creatorId !== user._id) {
                await ctx.db.insert("notifications", {
                    userId: crashCourse.creatorId,
                    type: "crash_course_cancelled",
                    data: {
                        crashCourseId: args.crashCourseId,
                        title: crashCourse.title,
                        message: "The tutor cancelled due to insufficient enrollment.",
                    },
                    isRead: false,
                    createdAt: now,
                });
            }
        }
    },
});

// ==========================================
// QUERIES
// ==========================================

/**
 * Get a single crash course with enriched details.
 */
export const get = query({
    args: { crashCourseId: v.id("crash_courses") },
    handler: async (ctx, args) => {
        const crashCourse = await ctx.db.get(args.crashCourseId);
        if (!crashCourse || crashCourse.deletedAt) return null;

        const creator = await ctx.db.get(crashCourse.creatorId);
        const course = crashCourse.courseId ? await ctx.db.get(crashCourse.courseId) : null;
        const tutor = crashCourse.selectedTutorId
            ? await ctx.db.get(crashCourse.selectedTutorId)
            : null;

        // Get tutor profile for online status
        let tutorProfile = null;
        if (tutor) {
            tutorProfile = await ctx.db
                .query("tutor_profiles")
                .withIndex("by_user", (q) => q.eq("userId", tutor._id))
                .first();
        }

        return {
            ...crashCourse,
            creator: creator ? { _id: creator._id, name: creator.name, image: creator.image } : null,
            course: course ? { _id: course._id, code: course.code, name: course.name, department: course.department } : null,
            tutor: tutor
                ? {
                    _id: tutor._id,
                    name: tutor.name,
                    image: tutor.image,
                    reputation: tutor.reputation,
                    isVerified: tutor.verificationTier === "academic" || tutor.verificationTier === "expert",
                    isOnline: tutorProfile?.isOnline ?? false,
                }
                : null,
        };
    },
});

/**
 * List crash courses with optional filters.
 */
export const list = query({
    args: {
        origin: v.optional(v.union(v.literal("demand"), v.literal("supply"))),
        department: v.optional(v.string()),
        category: v.optional(v.union(
            v.literal("o_levels"),
            v.literal("a_levels"),
            v.literal("sat"),
            v.literal("ib"),
            v.literal("ap"),
            v.literal("general"),
        )),
        examType: v.optional(v.union(
            v.literal("quiz"),
            v.literal("midterm"),
            v.literal("final"),
            v.literal("other")
        )),
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        let results;

        // Use category index when filtering by category
        if (args.category && args.status) {
            results = await ctx.db
                .query("crash_courses")
                .withIndex("by_category", (q) =>
                    q.eq("category", args.category!).eq("status", args.status as any) // eslint-disable-line @typescript-eslint/no-explicit-any
                )
                .collect();
        } else if (args.category) {
            results = await ctx.db
                .query("crash_courses")
                .withIndex("by_category", (q) =>
                    q.eq("category", args.category!) as any
                )
                .collect();
        } else if (args.department && args.status) {
            results = await ctx.db
                .query("crash_courses")
                .withIndex("by_department", (q) =>
                    q.eq("department", args.department!).eq("status", args.status as any)
                )
                .collect();
        } else if (args.status) {
            results = await ctx.db
                .query("crash_courses")
                .withIndex("by_status", (q) => q.eq("status", args.status as any))
                .collect();
        } else {
            results = await ctx.db.query("crash_courses").collect();
        }

        // Apply additional filters
        if (args.origin) {
            results = results.filter((c) => c.origin === args.origin);
        }
        if (args.department && !args.category) {
            results = results.filter((c) => c.department === args.department);
        }
        if (args.examType) {
            results = results.filter((c) => c.examType === args.examType);
        }

        // Exclude deleted/cancelled, sort by newest
        results = results
            .filter((c) => !c.deletedAt && c.status !== "cancelled")
            .sort((a, b) => b.createdAt - a.createdAt);

        // Enrich with course info
        const enriched = await Promise.all(
            results.slice(0, 50).map(async (c) => {
                const course = c.courseId ? await ctx.db.get(c.courseId) : null;
                const creator = await ctx.db.get(c.creatorId);

                // Count applications for demand-side
                let applicationCount = 0;
                if (c.origin === "demand") {
                    const apps = await ctx.db
                        .query("crash_course_applications")
                        .withIndex("by_crash_course", (q) => q.eq("crashCourseId", c._id))
                        .filter((q) => q.eq(q.field("status"), "pending"))
                        .collect();
                    applicationCount = apps.length;
                }

                return {
                    ...c,
                    course: course ? { code: course.code, name: course.name } : null,
                    creatorName: creator?.name ?? "Unknown",
                    applicationCount,
                };
            })
        );

        return enriched;
    },
});

/**
 * List crash courses the current user is involved in (created or enrolled).
 */
export const listMy = query({
    args: {},
    handler: async (ctx) => {
        const user = await requireUser(ctx, { allowBanned: true });

        // Courses I created
        const created = await ctx.db
            .query("crash_courses")
            .withIndex("by_creator", (q) => q.eq("creatorId", user._id))
            .filter((q) => q.eq(q.field("deletedAt"), undefined))
            .collect();

        // Courses I'm enrolled in
        const enrollments = await ctx.db
            .query("crash_course_enrollments")
            .withIndex("by_student", (q) => q.eq("studentId", user._id))
            .filter((q) => q.neq(q.field("status"), "withdrawn"))
            .collect();

        const enrolledCourseIds = new Set(enrollments.map((e) => e.crashCourseId));

        // Get enrolled courses (not already in created)
        const enrolledCourses = [];
        for (const courseId of enrolledCourseIds) {
            if (!created.some((c) => c._id === courseId)) {
                const course = await ctx.db.get(courseId);
                if (course && !course.deletedAt) {
                    enrolledCourses.push(course);
                }
            }
        }

        const allCourses = [...created, ...enrolledCourses].sort(
            (a, b) => b.createdAt - a.createdAt
        );

        // Enrich with course details
        const enriched = await Promise.all(
            allCourses.map(async (c) => {
                const course = c.courseId ? await ctx.db.get(c.courseId) : null;
                return {
                    ...c,
                    course: course ? { code: course.code, name: course.name } : null,
                };
            })
        );

        return enriched;
    },
});

/**
 * Get enrollments for a crash course.
 */
export const getEnrollments = query({
    args: { crashCourseId: v.id("crash_courses") },
    handler: async (ctx, args) => {
        const enrollments = await ctx.db
            .query("crash_course_enrollments")
            .withIndex("by_crash_course", (q) => q.eq("crashCourseId", args.crashCourseId))
            .filter((q) => q.neq(q.field("status"), "withdrawn"))
            .collect();

        const enriched = await Promise.all(
            enrollments.map(async (e) => {
                const student = await ctx.db.get(e.studentId);
                return {
                    ...e,
                    student: student
                        ? { _id: student._id, name: student.name, image: student.image }
                        : null,
                };
            })
        );

        return enriched;
    },
});

/**
 * Get my enrollment status for a crash course.
 */
export const getMyEnrollment = query({
    args: { crashCourseId: v.id("crash_courses") },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx, { allowBanned: true });
        const enrollment = await ctx.db
            .query("crash_course_enrollments")
            .withIndex("by_crash_course_and_student", (q) =>
                q.eq("crashCourseId", args.crashCourseId).eq("studentId", user._id)
            )
            .first();
        return enrollment;
    },
});

/**
 * Get applications for a crash course with enriched tutor info, sorted by voteCount.
 */
export const getApplications = query({
    args: { crashCourseId: v.id("crash_courses") },
    handler: async (ctx, args) => {
        const applications = await ctx.db
            .query("crash_course_applications")
            .withIndex("by_crash_course", (q) => q.eq("crashCourseId", args.crashCourseId))
            .collect();

        const crashCourse = await ctx.db.get(args.crashCourseId);

        const enriched = await Promise.all(
            applications.map(async (app) => {
                const tutor = await ctx.db.get(app.tutorId);
                const tutorProfile = tutor
                    ? await ctx.db
                        .query("tutor_profiles")
                        .withIndex("by_user", (q) => q.eq("userId", tutor._id))
                        .first()
                    : null;

                // Get tutor's expertise for this course
                let expertiseLevel = null;
                if (crashCourse) {
                    const offering = await ctx.db
                        .query("tutor_offerings")
                        .withIndex("by_tutor", (q) => q.eq("tutorId", app.tutorId))
                        .filter((q) => q.eq(q.field("courseId"), crashCourse.courseId))
                        .first();
                    expertiseLevel = offering?.level ?? null;
                }

                // Count completed jobs
                const completedOffers = await ctx.db
                    .query("offers")
                    .withIndex("by_tutor", (q) => q.eq("tutorId", app.tutorId))
                    .filter((q) => q.eq(q.field("status"), "accepted"))
                    .collect();

                return {
                    ...app,
                    tutor: tutor
                        ? {
                            _id: tutor._id,
                            name: tutor.name,
                            image: tutor.image,
                            reputation: tutor.reputation,
                            isVerified: tutor.verificationTier === "academic" || tutor.verificationTier === "expert",
                            isOnline: tutorProfile?.isOnline ?? false,
                            completedJobs: completedOffers.length,
                            expertiseLevel,
                        }
                        : null,
                };
            })
        );

        // Sort by voteCount desc, then by createdAt asc
        enriched.sort((a, b) => {
            if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
            return a.createdAt - b.createdAt;
        });

        return enriched;
    },
});

/**
 * Get current user's vote for a crash course.
 */
export const getMyVote = query({
    args: { crashCourseId: v.id("crash_courses") },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx, { allowBanned: true });
        const vote = await ctx.db
            .query("crash_course_votes")
            .withIndex("by_crash_course_and_student", (q) =>
                q.eq("crashCourseId", args.crashCourseId).eq("studentId", user._id)
            )
            .first();
        return vote;
    },
});

/**
 * Get upcoming confirmed crash courses for the current user (for dashboard widgets).
 */
export const getUpcoming = query({
    args: {},
    handler: async (ctx) => {
        const user = await requireUser(ctx, { allowBanned: true });

        // Get courses I'm enrolled in
        const enrollments = await ctx.db
            .query("crash_course_enrollments")
            .withIndex("by_student", (q) => q.eq("studentId", user._id))
            .filter((q) => q.eq(q.field("status"), "enrolled"))
            .collect();

        // Also get courses I'm teaching
        const teaching = await ctx.db
            .query("crash_courses")
            .withIndex("by_tutor", (q) => q.eq("selectedTutorId", user._id))
            .collect();

        const allCourseIds = new Set([
            ...enrollments.map((e) => e.crashCourseId),
            ...teaching.map((t) => t._id),
        ]);

        const upcoming = [];
        for (const courseId of allCourseIds) {
            const course = await ctx.db.get(courseId);
            if (
                course &&
                !course.deletedAt &&
                (course.status === "confirmed" || course.status === "in_progress") &&
                course.scheduledAt &&
                course.scheduledAt > Date.now() - 24 * 60 * 60 * 1000 // include courses from last 24h
            ) {
                const uniCourse = course.courseId ? await ctx.db.get(course.courseId) : null;
                upcoming.push({
                    ...course,
                    course: uniCourse ? { code: uniCourse.code, name: uniCourse.name } : null,
                    isTeaching: course.selectedTutorId === user._id,
                });
            }
        }

        // Sort by scheduledAt
        upcoming.sort((a, b) => (a.scheduledAt ?? 0) - (b.scheduledAt ?? 0));
        return upcoming.slice(0, 10);
    },
});

/**
 * Search crash courses by title.
 */
export const search = query({
    args: {
        query: v.string(),
        department: v.optional(v.string()),
        examType: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        if (!args.query.trim()) return [];

        let searchQuery = ctx.db
            .query("crash_courses")
            .withSearchIndex("search_crash_courses", (q) => {
                let search = q.search("title", args.query);
                if (args.department) {
                    search = search.eq("department", args.department);
                }
                if (args.examType) {
                    search = search.eq("examType", args.examType as any);
                }
                return search;
            });

        const results = await searchQuery.collect();

        const enriched = await Promise.all(
            results
                .filter((c) => !c.deletedAt && c.status !== "cancelled" && c.status !== "completed")
                .slice(0, 20)
                .map(async (c) => {
                    const course = c.courseId ? await ctx.db.get(c.courseId) : null;
                    return {
                        ...c,
                        course: course ? { code: course.code, name: course.name } : null,
                    };
                })
        );

        return enriched;
    },
});

// ==========================================
// INTERNAL MUTATIONS (for cron jobs)
// ==========================================

/**
 * Auto-close voting when deadline passes. Select top-voted tutor.
 */
export const autoCloseVoting = internalMutation({
    args: {},
    handler: async (ctx) => {
        const votingCourses = await ctx.db
            .query("crash_courses")
            .withIndex("by_status", (q) => q.eq("status", "voting"))
            .collect();

        const now = Date.now();
        for (const course of votingCourses) {
            if (course.votingDeadline && course.votingDeadline < now) {
                // Find top-voted application
                const applications = await ctx.db
                    .query("crash_course_applications")
                    .withIndex("by_crash_course", (q) => q.eq("crashCourseId", course._id))
                    .filter((q) => q.eq(q.field("status"), "pending"))
                    .collect();

                if (applications.length === 0) {
                    await ctx.db.patch(course._id, { status: "cancelled" });
                    continue;
                }

                // Sort by voteCount desc
                applications.sort((a, b) => b.voteCount - a.voteCount);
                const winner = applications[0];

                // Copy quote to crash course
                const confirmationDeadline = now + 48 * 60 * 60 * 1000;
                await ctx.db.patch(course._id, {
                    selectedTutorId: winner.tutorId,
                    pricePerStudent: winner.proposedPrice,
                    scheduledAt: winner.proposedDate,
                    duration: winner.proposedDuration,
                    location: winner.proposedLocation,
                    status: "confirming",
                    confirmationDeadline,
                });

                await ctx.db.patch(winner._id, { status: "selected" });

                // Reject others
                for (const app of applications) {
                    if (app._id !== winner._id) {
                        await ctx.db.patch(app._id, { status: "rejected" });
                    }
                }

                // Update enrollments to pending_confirmation
                const enrollments = await ctx.db
                    .query("crash_course_enrollments")
                    .withIndex("by_crash_course", (q) => q.eq("crashCourseId", course._id))
                    .filter((q) => q.eq(q.field("status"), "interested"))
                    .collect();
                for (const enrollment of enrollments) {
                    await ctx.db.patch(enrollment._id, { status: "pending_confirmation" });
                    await ctx.db.insert("notifications", {
                        userId: enrollment.studentId,
                        type: "crash_course_confirmed",
                        data: {
                            crashCourseId: course._id,
                            title: course.title,
                            price: winner.proposedPrice,
                            scheduledAt: winner.proposedDate,
                        },
                        isRead: false,
                        createdAt: now,
                    });
                }

                // Notify selected tutor
                await ctx.db.insert("notifications", {
                    userId: winner.tutorId,
                    type: "crash_course_selected",
                    data: { crashCourseId: course._id, title: course.title },
                    isRead: false,
                    createdAt: now,
                });
            }
        }
    },
});

/**
 * Auto-expire confirmations when deadline passes.
 * If too few students confirmed relative to minEnrollment (or < 50% of
 * interested when no minEnrollment is set), the crash course transitions
 * to "pending_tutor_review" so the tutor can accept, renegotiate, or cancel.
 */
export const autoExpireConfirmations = internalMutation({
    args: {},
    handler: async (ctx) => {
        const confirmingCourses = await ctx.db
            .query("crash_courses")
            .withIndex("by_status", (q) => q.eq("status", "confirming"))
            .collect();

        const now = Date.now();
        for (const course of confirmingCourses) {
            if (course.confirmationDeadline && course.confirmationDeadline < now) {
                // Withdraw students still pending
                const pendingEnrollments = await ctx.db
                    .query("crash_course_enrollments")
                    .withIndex("by_crash_course", (q) => q.eq("crashCourseId", course._id))
                    .filter((q) => q.eq(q.field("status"), "pending_confirmation"))
                    .collect();

                for (const enrollment of pendingEnrollments) {
                    await ctx.db.patch(enrollment._id, { status: "withdrawn" });
                }

                // Nobody confirmed → cancel outright
                if (course.currentEnrollment === 0) {
                    await ctx.db.patch(course._id, { status: "cancelled" });
                    continue;
                }

                // Determine if enrollment threshold is met
                let thresholdMet = true;

                if (course.minEnrollment) {
                    // Explicit min: check confirmed count against it
                    thresholdMet = course.currentEnrollment >= course.minEnrollment;
                } else {
                    // No explicit min: check if at least 50% of interested students confirmed.
                    // Count total interested (enrolled + pending that we just withdrew + already withdrawn)
                    const allEnrollments = await ctx.db
                        .query("crash_course_enrollments")
                        .withIndex("by_crash_course", (q) => q.eq("crashCourseId", course._id))
                        .collect();
                    const totalInterested = allEnrollments.filter(
                        (e) => e.status !== "withdrawn" || pendingEnrollments.some((p) => p._id === e._id)
                    ).length;
                    // If we have a meaningful sample and less than half confirmed
                    if (totalInterested >= 4 && course.currentEnrollment < totalInterested * 0.5) {
                        thresholdMet = false;
                    }
                }

                if (thresholdMet) {
                    // Enough confirmed → auto-lock in
                    await ctx.db.patch(course._id, { status: "confirmed" });
                } else {
                    // Too few confirmed → let the tutor decide
                    await ctx.db.patch(course._id, { status: "pending_tutor_review" });

                    // Notify the tutor
                    if (course.selectedTutorId) {
                        const enrolled = await ctx.db
                            .query("crash_course_enrollments")
                            .withIndex("by_crash_course", (q) => q.eq("crashCourseId", course._id))
                            .filter((q) => q.eq(q.field("status"), "enrolled"))
                            .collect();

                        await ctx.db.insert("notifications", {
                            userId: course.selectedTutorId,
                            type: "crash_course_low_enrollment",
                            data: {
                                crashCourseId: course._id,
                                title: course.title,
                                confirmedCount: course.currentEnrollment,
                                minEnrollment: course.minEnrollment,
                                message: `Only ${course.currentEnrollment} student(s) confirmed. You can accept, renegotiate the price, or cancel.`,
                            },
                            isRead: false,
                            createdAt: now,
                        });
                    }
                }
            }
        }
    },
});

/**
 * Send reminders for upcoming crash courses (within 1 hour).
 */
export const sendReminders = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const oneHourFromNow = now + 60 * 60 * 1000;

        // Get confirmed courses starting within 1 hour
        const confirmedCourses = await ctx.db
            .query("crash_courses")
            .withIndex("by_status", (q) => q.eq("status", "confirmed"))
            .collect();

        for (const course of confirmedCourses) {
            if (
                course.scheduledAt &&
                course.scheduledAt > now &&
                course.scheduledAt <= oneHourFromNow
            ) {
                // Check if we already sent reminders (simple check: look for existing reminder notification)
                const existingReminder = await ctx.db
                    .query("notifications")
                    .filter((q) =>
                        q.and(
                            q.eq(q.field("type"), "crash_course_reminder"),
                            q.eq(q.field("data.crashCourseId"), course._id)
                        )
                    )
                    .first();

                if (existingReminder) continue; // Already sent

                // Notify enrolled students
                const enrollments = await ctx.db
                    .query("crash_course_enrollments")
                    .withIndex("by_crash_course", (q) => q.eq("crashCourseId", course._id))
                    .filter((q) => q.eq(q.field("status"), "enrolled"))
                    .collect();

                for (const enrollment of enrollments) {
                    await ctx.db.insert("notifications", {
                        userId: enrollment.studentId,
                        type: "crash_course_reminder",
                        data: { crashCourseId: course._id, title: course.title, scheduledAt: course.scheduledAt },
                        isRead: false,
                        createdAt: now,
                    });
                }

                // Notify tutor
                if (course.selectedTutorId) {
                    await ctx.db.insert("notifications", {
                        userId: course.selectedTutorId,
                        type: "crash_course_reminder",
                        data: { crashCourseId: course._id, title: course.title, scheduledAt: course.scheduledAt },
                        isRead: false,
                        createdAt: now,
                    });
                }
            }
        }
    },
});
