import { internalMutation, internalQuery } from "./_generated/server";


const USERS = [
    {
        name: "Alice Johnson",
        email: "alice.johnson@example.com",
        bio: "Experienced tutor with a passion for teaching CS.",
        university: "LUMS",
        role: "tutor" as const,
    },
    {
        name: "Bob Smith",
        email: "bob.smith@example.com",
        bio: "CS student looking for help with projects.",
        university: "LUMS",
        role: "student" as const,
    },
    {
        name: "Charlie Brown",
        email: "charlie.brown@example.com",
        bio: "Math tutor helping students ace their exams.",
        university: "LUMS",
        role: "tutor" as const,
    },
    {
        name: "Diana Prince",
        email: "diana.prince@example.com",
        bio: "Content writer and editor.",
        university: "LUMS",
        role: "student" as const,
    },
    {
        name: "Evan Wright",
        email: "evan.wright@example.com",
        bio: "Full-stack developer and UI/UX enthusiast.",
        university: "LUMS",
        role: "tutor" as const,
    },
];

const TICKET_TITLES = [
    "Help with Data Structures Assignment",
    "Debug my Python script",
    "Explain Calculus concepts",
    "Fix bugs in React app",
    "Review my exam prep notes",
    "Help understand Linear Algebra",
    "Code review for project",
    "Explain database design",
    "Help with algorithm optimization",
    "Debugging session needed",
];

export const seedData = internalMutation({
    args: {},
    handler: async (ctx) => {
        const userIds = [];

        // First, ensure we have some courses
        const courses = await ctx.db.query("university_courses").collect();
        if (courses.length === 0) {
            // Seed some courses first
            const defaultCourses = [
                { code: "CS 100", name: "Computational Problem Solving", department: "CS", isActive: true },
                { code: "CS 200", name: "Data Structures", department: "CS", isActive: true },
                { code: "MATH 101", name: "Calculus I", department: "Math", isActive: true },
            ];
            for (const c of defaultCourses) {
                await ctx.db.insert("university_courses", c);
            }
        }

        const allCourses = await ctx.db.query("university_courses").collect();

        for (let i = 0; i < USERS.length; i++) {
            const userData = USERS[i];
            const tokenIdentifier = `test-user-${i + 1}`;

            // Check if user exists
            const existingUser = await ctx.db
                .query("users")
                .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
                .unique();

            let userId;
            if (existingUser) {
                userId = existingUser._id;
            } else {
                userId = await ctx.db.insert("users", {
                    name: userData.name,
                    email: userData.email,
                    tokenIdentifier: tokenIdentifier,
                    bio: userData.bio,
                    university: userData.university,
                    reputation: 0,
                    ratingSum: 0,
                    ratingCount: 0,
                    role: userData.role,
                    isVerified: true,
                    isAdmin: false,
                    isBanned: false,
                    termsAcceptedAt: new Date().toISOString(),
                });
            }
            userIds.push(userId);

            // Create 5 tickets for student users
            if (userData.role === "student") {
                for (let j = 0; j < 5; j++) {
                    const title = TICKET_TITLES[(i * 5 + j) % TICKET_TITLES.length];
                    const course = allCourses[j % allCourses.length];
                    await ctx.db.insert("tickets", {
                        studentId: userId,
                        courseId: course._id,
                        title: title,
                        description: `This is a test ticket for ${title}. Need help ASAP!`,
                        budget: 500 + (j * 100),
                        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                        status: "open",
                        urgency: j % 3 === 0 ? "high" : j % 3 === 1 ? "medium" : "low",
                        helpType: "Debugging",
                        createdAt: Date.now(),
                    });
                }
            }
        }

        return "Seeding completed successfully!";
    },
});

export const checkData = internalQuery({
    args: {},
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();
        const tickets = await ctx.db.query("tickets").collect();
        return {
            userCount: users.length,
            ticketCount: tickets.length,
            users: users.map((u) => ({ name: u.name, id: u._id })),
        };
    },
});

// Seed 20 diverse dummy tickets
const DUMMY_TICKETS = [
    { title: "Help with Binary Search Trees", helpType: "concept", urgency: "high" as const },
    { title: "Debug my Python Flask API", helpType: "debugging", urgency: "high" as const },
    { title: "Explain Recursion step-by-step", helpType: "concept", urgency: "medium" as const },
    { title: "React useState not updating", helpType: "debugging", urgency: "high" as const },
    { title: "Midterm prep for Calculus", helpType: "exam_prep", urgency: "medium" as const },
    { title: "Code review for my Java project", helpType: "review", urgency: "low" as const },
    { title: "Need help with SQL joins", helpType: "concept", urgency: "medium" as const },
    { title: "Fix CSS layout issues", helpType: "debugging", urgency: "low" as const },
    { title: "Explain Big O notation", helpType: "concept", urgency: "low" as const },
    { title: "Help with Dynamic Programming", helpType: "concept", urgency: "high" as const },
    { title: "Debug Node.js async/await", helpType: "debugging", urgency: "medium" as const },
    { title: "Physics exam prep - Mechanics", helpType: "exam_prep", urgency: "high" as const },
    { title: "Review my resume", helpType: "review", urgency: "low" as const, isGeneral: true, category: "career_advice" },
    { title: "Career guidance for CS major", helpType: "other", urgency: "low" as const, isGeneral: true, category: "mentorship" },
    { title: "Help with Git merge conflicts", helpType: "debugging", urgency: "medium" as const },
    { title: "Explain OOP principles", helpType: "concept", urgency: "low" as const },
    { title: "Final project code review", helpType: "review", urgency: "high" as const },
    { title: "Debug machine learning model", helpType: "debugging", urgency: "medium" as const },
    { title: "General mentorship session", helpType: "other", urgency: "low" as const, isGeneral: true, category: "mentorship" },
    { title: "Essay review for writing class", helpType: "review", urgency: "medium" as const, isGeneral: true, category: "essay_review" },
];

export const seed20Tickets = internalMutation({
    args: {},
    handler: async (ctx) => {
        // Get existing users and courses
        const users = await ctx.db.query("users").collect();
        const courses = await ctx.db.query("university_courses").collect();

        if (users.length === 0) {
            throw new Error("No users found. Run seedData first.");
        }
        if (courses.length === 0) {
            throw new Error("No courses found. Run seedData first.");
        }

        // Get student users only
        const students = users.filter(u => u.role === "student");
        if (students.length === 0) {
            // Use any user if no students
            students.push(users[0]);
        }

        let created = 0;
        for (let i = 0; i < DUMMY_TICKETS.length; i++) {
            const ticket = DUMMY_TICKETS[i];
            const student = students[i % students.length];
            const course = courses[i % courses.length];

            await ctx.db.insert("tickets", {
                studentId: student._id,
                courseId: ticket.isGeneral ? undefined : course._id,
                customCategory: ticket.isGeneral ? ticket.category : undefined,
                department: ticket.isGeneral ? undefined : course.department,
                title: ticket.title,
                description: `This is a test ticket: ${ticket.title}. I need help with this topic as soon as possible. Looking for a tutor who can explain clearly.`,
                budget: 300 + (i * 50),
                deadline: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
                status: "open",
                urgency: ticket.urgency,
                helpType: ticket.helpType,
                createdAt: Date.now() - (i * 60 * 60 * 1000), // Stagger creation times
            });
            created++;
        }

        return `Created ${created} test tickets!`;
    },
});
