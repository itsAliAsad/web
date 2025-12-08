import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

const USERS = [
    {
        name: "Alice Johnson",
        email: "alice.johnson@example.com",
        bio: "Experienced graphic designer with a passion for minimalism.",
        university: "Stanford University",
        role: "seller" as const,
    },
    {
        name: "Bob Smith",
        email: "bob.smith@example.com",
        bio: "Software engineer looking for side projects.",
        university: "MIT",
        role: "buyer" as const,
    },
    {
        name: "Charlie Brown",
        email: "charlie.brown@example.com",
        bio: "Marketing specialist helping brands grow.",
        university: "Harvard University",
        role: "seller" as const,
    },
    {
        name: "Diana Prince",
        email: "diana.prince@example.com",
        bio: "Content writer and editor.",
        university: "Yale University",
        role: "buyer" as const,
    },
    {
        name: "Evan Wright",
        email: "evan.wright@example.com",
        bio: "Full-stack developer and UI/UX enthusiast.",
        university: "UC Berkeley",
        role: "seller" as const,
    },
];

const REQUEST_TITLES = [
    "Build a React Native App",
    "Design a Logo for a Startup",
    "Write SEO Blog Posts",
    "Fix Bugs in Python Script",
    "Create a Marketing Strategy",
    "Develop a Shopify Store",
    "Edit a YouTube Video",
    "Translate Document to Spanish",
    "Consultation on Cloud Architecture",
    "Data Analysis and Visualization",
];

export const seedData = internalMutation({
    args: {},
    handler: async (ctx) => {
        const userIds = [];

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

            // Create 5 requests for each user
            for (let j = 0; j < 5; j++) {
                const title = REQUEST_TITLES[(i * 5 + j) % REQUEST_TITLES.length];
                await ctx.db.insert("requests", {
                    buyerId: userId,
                    title: title,
                    description: `This is a test request for ${title}. We need high quality work delivered on time.`,
                    budget: 100 + (j * 50),
                    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
                    status: "open",
                    category: "Development",
                });
            }
        }

        return "Seeding completed successfully!";
    },
});

export const checkData = internalQuery({
    args: {},
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();
        const requests = await ctx.db.query("requests").collect();
        return {
            userCount: users.length,
            requestCount: requests.length,
            users: users.map((u) => ({ name: u.name, id: u._id })),
        };
    },
});
