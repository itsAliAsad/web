import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Internal only - use from Convex dashboard for testing
export const seedJobWithOffers = internalMutation({
    args: {},
    handler: async (ctx) => {
        // 1. Create a student
        const studentId = await ctx.db.insert("users", {
            name: "Test Student",
            email: "student@test.com",
            tokenIdentifier: "test_student_" + Date.now(),
            reputation: 5,
            role: "student",
            isVerified: true,
        });

        // Create a dummy student for history
        const dummyStudentId = await ctx.db.insert("users", {
            name: "Dummy History Student",
            email: "dummy_seed_history@test.com",
            tokenIdentifier: "dummy_seed_" + Date.now(),
            reputation: 5,
            role: "student",
            isVerified: false,
        });

        // 2. Create a course (to test expertise match)
        const courseId = await ctx.db.insert("university_courses", {
            code: "CS 200",
            name: "Data Structures",
            department: "CS",
            isActive: true,
        });

        // 3. Create a ticket (Job Posting)
        const ticketId = await ctx.db.insert("tickets", {
            studentId,
            title: "Help with Data Structures Project (Seed Test)",
            description: "Need help implementing a Red-Black Tree. This is a seeded test job with 15 offers.",
            courseId,
            department: "CS",
            status: "open",
            urgency: "high",
            helpType: "Debugging",
            createdAt: Date.now(),
            budget: 5000,
        });

        console.log(`Created Ticket: ${ticketId}`);

        // 4. Create 15 Tutors and Offers
        const tutors = [];
        for (let i = 1; i <= 15; i++) {
            const isVerified = Math.random() > 0.5;
            const reputation = 3 + Math.random() * 2; // 3.0 to 5.0
            const isOnline = Math.random() > 0.7; // 30% chance online
            const completedJobs = Math.floor(Math.random() * 20);

            // Create user
            const tutorId = await ctx.db.insert("users", {
                name: `Tutor ${i} (${reputation.toFixed(1)})`,
                email: `tutor${i}@test.com`,
                tokenIdentifier: `test_tutor_${i}_` + Date.now(),
                reputation,
                role: "tutor",
                isVerified,
            });

            // Create profile
            await ctx.db.insert("tutor_profiles", {
                userId: tutorId,
                bio: `I am tutor #${i}. I have completed ${completedJobs} jobs.`,
                isOnline,
                lastActiveAt: Date.now() - Math.random() * 86400000 * 2, // Random time in last 48h
                creditBalance: 0,
                settings: {
                    acceptingRequests: true,
                    acceptingPaid: true,
                    acceptingFree: false,
                    minRate: 1000,
                    allowedHelpTypes: ["Debugging"],
                }
            });

            // Add expertise to some (randomly)
            if (Math.random() > 0.4) {
                await ctx.db.insert("tutor_offerings", {
                    tutorId,
                    courseId,
                    level: Math.random() > 0.5 ? "Expert" : "Intermediate",
                });
            }

            // Add dummy completed jobs (offers) so our count logic works
            for (let j = 0; j < completedJobs; j++) {
                // Create a dummy resolved ticket
                const dummyTicketId = await ctx.db.insert("tickets", {
                    studentId: dummyStudentId,
                    title: "Past Job (Seed)",
                    description: "Auto-generated history",
                    status: "resolved",
                    budget: 1000,
                    createdAt: Date.now() - 10000000,
                    assignedTutorId: tutorId,
                    urgency: "low",
                    helpType: "Debugging",
                });

                await ctx.db.insert("offers", {
                    ticketId: dummyTicketId,
                    studentId: dummyStudentId,
                    tutorId,
                    price: 1000,
                    status: "accepted",
                });
            }

            // Create Offer for THIS job
            const price = 2000 + Math.floor(Math.random() * 5000); // 2000 - 7000
            const offerId = await ctx.db.insert("offers", {
                ticketId,
                studentId,
                tutorId,
                price,
                status: "pending",
            });

            tutors.push({ name: `Tutor ${i}`, offerId });
        }

        return { ticketId, studentId, message: "Created 15 offers" };
    },
});
