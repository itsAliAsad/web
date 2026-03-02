# Peer — Infrastructure & Codebase Documentation

> **Last updated:** March 2, 2026
> **Purpose:** Full developer onboarding reference for the Peer codebase.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Environment & Configuration](#4-environment--configuration)
5. [Database Schema (Convex)](#5-database-schema-convex)
6. [Backend — Convex Functions](#6-backend--convex-functions)
7. [Frontend — App Router (Pages & Routes)](#7-frontend--app-router-pages--routes)
8. [Components Deep-Dive](#8-components-deep-dive)
9. [Context Providers](#9-context-providers)
10. [Styling & Design System](#10-styling--design-system)
11. [Authentication Flow](#11-authentication-flow)
12. [Core Business Flows](#12-core-business-flows)
13. [Matching & Ranking Algorithms](#13-matching--ranking-algorithms)
14. [Real-Time Features](#14-real-time-features)
15. [Admin System](#15-admin-system)
16. [Security & Trust Layer](#16-security--trust-layer)
17. [Cron Jobs & Background Tasks](#17-cron-jobs--background-tasks)
18. [Seed & Migration Scripts](#18-seed--migration-scripts)
19. [Utility Modules](#19-utility-modules)
20. [Known Conventions & Patterns](#20-known-conventions--patterns)
21. [Crash Courses Feature](#21-crash-courses-feature)

---

## 1. Project Overview

**Peer** is a peer-to-peer tutoring and mentorship marketplace for university students. Students can post academic help requests ("Tickets") and tutors can submit offers to fulfill them. The platform also supports **Crash Courses** — group exam-prep sessions that can be student-requested (demand-side) or tutor-offered (supply-side). Additional features include real-time chat, study groups, reputation/reviews, an admin panel, and a pre-launch waitlist.

### Core Concepts

| Concept | Description |
|---|---|
| **Ticket** | A help request posted by a student (e.g., "Help me debug my Red-Black Tree implementation"). Replaces the old "request" terminology. |
| **Offer** | A tutor's bid on a Ticket, specifying a price. |
| **Conversation** | A 1-on-1 messaging thread between two users. Only created after an offer is accepted. |
| **Study Group** | A course-specific collaborative group that students can create and join. |
| **Tutor Profile** | A separated data entity from the User, containing tutor-specific settings (rates, availability, expertise). |
| **Tutor Offering** | A join record linking a tutor to a university course with an expertise level. |
| **University Course** | A catalog entry (e.g., "CS-200 Data Structures") used to tag Tickets and Offerings. |
| **Crash Course** | A group exam-prep session linked to a course. Can originate from **demand** (students request → tutors apply → students vote → tutor selected) or **supply** (tutor offers → students enroll directly). |
| **Crash Course Application** | A tutor's proposal to teach a demand-side crash course, including price, date/time, duration, location, and topics covered. |
| **Crash Course Enrollment** | A student's enrollment/interest record in a crash course. Statuses: enrolled, interested, pending_confirmation, confirmed, withdrawn. |

### Dual-Role System

Every user can switch between **Student** (buyer) and **Tutor** (seller) roles at any time via the RoleSwitcher in the navbar. The active role determines which dashboard view is shown and which navigation links appear.

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Framework** | Next.js (App Router) | 16.x |
| **Language** | TypeScript | 5.x |
| **Backend / DB** | Convex (BaaS) | 1.30+ |
| **Authentication** | Clerk | 6.35+ |
| **UI Library** | Shadcn UI + Radix UI | Latest |
| **Styling** | Tailwind CSS 4 + PostCSS | 4.x |
| **State Management** | Convex React hooks (`useQuery`, `useMutation`) + React Context | — |
| **Forms** | React Hook Form + Zod | 7.x / 4.x |
| **Charts** | Recharts | 2.15+ |
| **Animations** | Framer Motion + Lottie React | 12.x / 2.x |
| **Search Palette** | cmdk | 1.x |
| **Date Utils** | date-fns | 4.x |
| **Notifications** | Sonner (toast) | 2.x |
| **Theming** | next-themes pattern (custom) | — |

---

## 3. Repository Structure

```
peer/
├── app/                          # Next.js App Router (pages & layouts)
│   ├── layout.tsx                # Root layout — providers, navbar, toaster
│   ├── template.tsx              # Route guard + page transitions
│   ├── page.tsx                  # Landing / Waitlist page (public)
│   ├── ConvexClientProvider.tsx  # Clerk + Convex provider wrapper
│   ├── globals.css               # Design system tokens & utilities
│   ├── admin/page.tsx            # Admin dashboard
│   ├── courses/page.tsx          # Course catalog browser
│   ├── dashboard/
│   │   ├── buyer/page.tsx        # Student dashboard
│   │   └── seller/page.tsx       # Tutor dashboard
│   ├── messages/page.tsx         # Chat interface
│   ├── onboarding/page.tsx       # New user onboarding wizard
│   ├── opportunities/page.tsx    # Opportunity board (tutors browse open tickets)
│   ├── profile/
│   │   ├── page.tsx              # Own profile editor
│   │   └── [id]/page.tsx         # Public profile viewer
│   ├── requests/
│   │   ├── new/page.tsx          # Create new ticket
│   │   └── [id]/page.tsx         # Ticket detail (offers, reviews, messaging)
│   ├── search/page.tsx           # Job search with filters
│   ├── settings/page.tsx         # User & tutor settings
│   ├── study-groups/page.tsx     # Study groups browser
│   ├── crash-courses/
│   │   ├── page.tsx              # Crash courses browse/filter page
│   │   ├── new/page.tsx          # Create new crash course (supply or demand)
│   │   └── [id]/page.tsx         # Crash course detail (enroll, vote, apply, lifecycle)
│   └── components/
│       └── OnlinePresence.tsx    # Tutor heartbeat component
│
├── components/                   # Reusable React components
│   ├── admin/                    # Admin-specific components
│   ├── auth/                     # Authentication sync
│   ├── chat/                     # Messaging components
│   ├── crash-courses/            # Crash course components
│   ├── dashboard/                # Dashboard widgets & charts
│   ├── layout/                   # Navbar, role switcher, banners
│   ├── notifications/            # Notification dropdown
│   ├── onboarding/               # Onboarding wizard
│   ├── portfolio/                # Portfolio & courses display
│   ├── profile/                  # Profile editing components
│   ├── reviews/                  # Star rating display
│   ├── search/                   # Search bar, filters, command palette
│   ├── study-groups/             # Study group cards
│   ├── trust/                    # Report dialog, terms modal, verified badge
│   ├── ui/                       # Shadcn UI primitives (34 components)
│   ├── waitlist/                 # Landing page components
│   ├── CourseSelector.tsx        # Searchable course combobox
│   └── TutorStatusToggle.tsx     # Online/offline toggle
│
├── context/                      # React context providers
│   ├── RoleContext.tsx            # Student/tutor role switching
│   └── ThemeProvider.tsx          # Light/dark/system theme
│
├── convex/                       # Backend (Convex functions)
│   ├── schema.ts                 # Database schema definition
│   ├── users.ts                  # User CRUD, role management, presence
│   ├── tickets.ts                # Ticket CRUD, search, matching algorithm
│   ├── offers.ts                 # Offer CRUD, ranking algorithm
│   ├── messages.ts               # Conversations & messaging
│   ├── notifications.ts          # Notification CRUD with pagination
│   ├── reviews.ts                # Review creation + reputation update
│   ├── reports.ts                # User report submission
│   ├── crash_courses.ts          # Crash courses: create, enroll, apply, vote, lifecycle
│   ├── admin.ts                  # Admin functions (stats, bans, announcements)
│   ├── portfolio.ts              # Portfolio items & tutor courses
│   ├── tutor_profiles.ts         # Tutor profile CRUD + idle detection
│   ├── tutor_offerings.ts        # Course expertise management
│   ├── university_courses.ts     # Course catalog search & seed
│   ├── study_groups.ts           # Study groups CRUD
│   ├── waitlist.ts               # Waitlist join, stats, admin management
│   ├── maintenance.ts            # Data backfill migrations
│   ├── crons.ts                  # Scheduled tasks
│   ├── seed.ts                   # Test data seeding
│   ├── seedCourses.ts            # Full course catalog seeding (529 courses)
│   ├── init.ts                   # Initial seed script
│   ├── debug.ts                  # Admin debug utilities
│   ├── utils.ts                  # Auth helpers, rate limits, audit logging
│   └── auth.config.ts            # Clerk ↔ Convex auth config
│
├── lib/                          # Utility modules
│   ├── utils.ts                  # cn() class merge, formatStatus()
│   └── animations.ts             # Lottie animation data (rocket placeholder)
│
├── docs/                         # Documentation utilities
│   ├── infra_scan_gen.py         # Infrastructure scan generator
│   └── infra_scan.json           # Generated scan output
│
├── public/animations/            # Static animation assets
├── proxy.ts                      # Clerk auth middleware
├── package.json                  # Dependencies & scripts
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript config
├── components.json               # Shadcn UI configuration
├── eslint.config.mjs             # ESLint + Next.js rules
└── postcss.config.mjs            # PostCSS + Tailwind plugin
```

---

## 4. Environment & Configuration

### Required Environment Variables

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Convex Backend
CONVEX_DEPLOYMENT=...             # Set automatically by `npx convex dev`
NEXT_PUBLIC_CONVEX_URL=...        # Set automatically by `npx convex dev`
```

### Running the Project

```bash
# Terminal 1 — Frontend
npm run dev

# Terminal 2 — Backend
npx convex dev
```

### Key Config Files

| File | Purpose |
|---|---|
| `next.config.ts` | Transpiles `framer-motion` for compatibility |
| `tsconfig.json` | ES2017 target, bundler module resolution, `@/*` path alias |
| `components.json` | Shadcn UI config: "new-york" style, RSC, Tailwind CSS vars, Lucide icons |
| `eslint.config.mjs` | ESLint 9 flat config with Next.js core-web-vitals + TypeScript rules |
| `postcss.config.mjs` | Tailwind CSS 4 PostCSS plugin |
| `proxy.ts` | Clerk middleware — protects all routes except `/` and `/api/webhooks(.*)` |
| `convex/auth.config.ts` | Connects Convex to Clerk via the Clerk domain + "convex" application ID |

---

## 5. Database Schema (Convex)

The schema is defined in `convex/schema.ts`. Below is every table, its fields, and indexes.

### 5.1 `users` — Identity Table

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Display name |
| `email` | `string` | Email address |
| `tokenIdentifier` | `string` | Clerk token ID (unique) |
| `image` | `string?` | Avatar URL |
| `bio` | `string?` | User bio |
| `university` | `string?` | e.g., "LUMS" |
| `reputation` | `number` | Aggregated rating (computed: ratingSum / ratingCount) |
| `ratingSum` | `number?` | Sum of all ratings received |
| `ratingCount` | `number?` | Total number of ratings received |
| `termsAcceptedAt` | `string?` | ISO timestamp of ToS acceptance |
| `role` | `"student" \| "tutor" \| "admin"` | Current active role |
| `isVerified` | `boolean?` | Admin-set verification status |
| `isAdmin` | `boolean?` | Admin flag |
| `isBanned` | `boolean?` | Ban flag |
| `verifiedAt` | `number?` | Timestamp of verification |
| `verifiedBy` | `Id<"users">?` | Admin who verified |
| `notificationPreferences` | `object?` | `{ email_marketing, email_transactional, push_messages }` |
| `currency` | `string?` | Preferred currency (default: "PKR") |
| `language` | `string?` | Preferred language (default: "en") |
| `theme` | `string?` | "light", "dark", or "system" |
| `links` | `object?` | `{ linkedin?, portfolio?, twitter? }` |
| `lastLoginAt` | `number?` | Last login timestamp |
| `loginIp` | `string?` | Login IP (not yet populated) |
| `banReason` | `string?` | Reason for ban |
| `bannedAt` | `number?` | Ban timestamp |
| `marketingConsent` | `boolean?` | Marketing consent flag |
| `marketingConsentUpdatedAt` | `number?` | — |
| `deletedAt` | `number?` | Soft-delete marker |

**Indexes:** `by_token` (tokenIdentifier)

---

### 5.2 `tutor_profiles` — Tutor-Specific Data

| Field | Type | Description |
|---|---|---|
| `userId` | `Id<"users">` | Owner |
| `bio` | `string` | Tutor-specific bio |
| `isOnline` | `boolean` | Presence flag |
| `lastActiveAt` | `number` | Last heartbeat timestamp |
| `creditBalance` | `number` | Platform credits |
| `settings` | `object` | `{ acceptingRequests, acceptingPaid, acceptingFree, minRate, allowedHelpTypes[] }` |

**Indexes:** `by_user` (userId)

---

### 5.3 `university_courses` — Course Catalog

| Field | Type | Description |
|---|---|---|
| `code` | `string` | e.g., "CS-200" |
| `name` | `string` | e.g., "Data Structures" |
| `department` | `string?` | e.g., "Computer Science" |
| `isActive` | `boolean` | Is course available? |

**Search Index:** `search_course` (searchField: "code")

---

### 5.4 `tutor_offerings` — Tutor ↔ Course Expertise

| Field | Type | Description |
|---|---|---|
| `tutorId` | `Id<"users">` | — |
| `courseId` | `Id<"university_courses">` | — |
| `level` | `string` | "Beginner", "Intermediate", "Advanced", or "Expert" |

**Indexes:** `by_tutor` (tutorId), `by_course` (courseId)

---

### 5.5 `tickets` — Help Requests

| Field | Type | Description |
|---|---|---|
| `studentId` | `Id<"users">` | Request owner |
| `courseId` | `Id<"university_courses">?` | Linked course (optional for general requests) |
| `customCategory` | `string?` | Fallback category (e.g., "Mentorship") |
| `department` | `string?` | Denormalized from course |
| `title` | `string` | — |
| `description` | `string` | — |
| `budget` | `number?` | Budget in PKR |
| `deadline` | `string?` | Deadline date |
| `status` | `enum` | `"open" \| "offering" \| "in_progress" \| "in_session" \| "resolved" \| "cancelled"` |
| `urgency` | `enum` | `"low" \| "medium" \| "high"` |
| `helpType` | `string` | "Debugging", "Exam Prep", etc. |
| `assignedTutorId` | `Id<"users">?` | Tutor working on it |
| `createdAt` | `number` | Timestamp |
| `deletedAt` | `number?` | Soft-delete marker |

**Indexes:** `by_status`, `by_course`, `by_student`, `by_department` (department + status), `by_student_and_tutor` (studentId + assignedTutorId)

**Search Index:** `search_title_description` (searchField: "title", filterFields: [helpType, department, customCategory])

**Ticket Lifecycle:**
```
open → offering → in_progress / in_session → resolved
                                             → cancelled
```

---

### 5.6 `offers` — Tutor Bids on Tickets

| Field | Type | Description |
|---|---|---|
| `ticketId` | `Id<"tickets">` | — |
| `studentId` | `Id<"users">?` | Denormalized from ticket |
| `tutorId` | `Id<"users">` | — |
| `price` | `number` | Offer price in PKR |
| `status` | `enum` | `"pending" \| "accepted" \| "rejected"` |
| `deletedAt` | `number?` | Soft-delete |

**Indexes:** `by_ticket`, `by_tutor`, `by_ticket_and_tutor`, `by_student_and_tutor`

---

### 5.7 `conversations` — Chat Threads

| Field | Type | Description |
|---|---|---|
| `participant1` | `Id<"users">` | — |
| `participant2` | `Id<"users">` | — |
| `lastMessageId` | `Id<"messages">?` | — |
| `updatedAt` | `number` | — |

**Indexes:** `by_participant1`, `by_participant2`, `by_updated`

---

### 5.8 `messages` — Chat Messages

| Field | Type | Description |
|---|---|---|
| `conversationId` | `Id<"conversations">` | — |
| `senderId` | `Id<"users">` | — |
| `content` | `string` | — |
| `type` | `enum` | `"text" \| "image" \| "file"` |
| `metadata` | `object?` | `{ fileName, fileSize, mimeType }` for file messages |
| `isRead` | `boolean` | — |
| `createdAt` | `number` | — |

**Indexes:** `by_conversation`, `by_conversation_and_created`

---

### 5.9 `notifications`

| Field | Type | Description |
|---|---|---|
| `userId` | `Id<"users">` | — |
| `type` | `enum` | `"offer_received" \| "offer_accepted" \| "ticket_resolved" \| "request_completed" \| "new_message" \| "crash_course_new_application" \| "crash_course_voting_started" \| "crash_course_tutor_selected" \| "crash_course_confirmed" \| "crash_course_starting_soon" \| "crash_course_cancelled"` |
| `data` | `any` | Arbitrary payload (ticketId, offerId, crashCourseId, etc.) |
| `isRead` | `boolean` | — |
| `createdAt` | `number` | — |

**Indexes:** `by_user`, `by_user_and_read`

---

### 5.10 `reviews`

| Field | Type | Description |
|---|---|---|
| `reviewerId` | `Id<"users">` | — |
| `revieweeId` | `Id<"users">` | — |
| `ticketId` | `Id<"tickets">?` | Optional — set for ticket reviews |
| `crashCourseId` | `Id<"crash_courses">?` | Optional — set for crash course reviews |
| `rating` | `number` | 1-5 |
| `comment` | `string?` | — |
| `type` | `enum` | `"student_to_tutor" \| "tutor_to_student" \| "crash_course_review"` |

**Indexes:** `by_reviewee`

---

### 5.11 `reports`

| Field | Type | Description |
|---|---|---|
| `reporterId` | `Id<"users">` | — |
| `targetId` | `Id<"users">` | — |
| `ticketId` | `Id<"tickets">?` | — |
| `reason` | `string` | — |
| `description` | `string?` | — |
| `status` | `enum` | `"pending" \| "resolved" \| "dismissed"` |
| `createdAt` | `number` | — |

**Indexes:** `by_status`, `by_target`

---

### 5.12 `study_groups`

| Field | Type | Description |
|---|---|---|
| `hostId` | `Id<"users">` | Creator |
| `courseId` | `Id<"university_courses">` | — |
| `title` | `string` | — |
| `maxMembers` | `number` | — |
| `currentMembers` | `number` | — |
| `status` | `string` | "active", etc. |
| `createdAt` | `number` | — |

**Indexes:** `by_course`

---

### 5.13 `portfolio_items`

| Field | Type | Description |
|---|---|---|
| `userId` | `Id<"users">` | — |
| `title` | `string` | — |
| `description` | `string` | — |
| `imageUrl` | `string` | — |
| `link` | `string?` | External link |
| `createdAt` | `number` | — |

**Indexes:** `by_user`

---

### 5.14 `courses` (Tutor-Created Courses)

| Field | Type | Description |
|---|---|---|
| `userId` | `Id<"users">` | — |
| `title` | `string` | — |
| `description` | `string` | — |
| `price` | `number` | — |
| `imageUrl` | `string?` | — |
| `createdAt` | `number` | — |

**Indexes:** `by_user`

> **Note:** This is distinct from `university_courses`. This table holds courses that tutors create and sell (like mini-workshops).

---

### 5.15 `announcements`

| Field | Type |
|---|---|
| `title` | `string` |
| `content` | `string` |
| `isActive` | `boolean` |
| `createdAt` | `number` |

**Indexes:** `by_active`

---

### 5.16 `audit_logs`

| Field | Type |
|---|---|
| `actorId` | `Id<"users">?` |
| `action` | `string` |
| `targetId` | `Id<"users">?` |
| `targetType` | `string?` |
| `details` | `any?` |
| `ipAddress` | `string?` |
| `createdAt` | `number` |

**Indexes:** `by_actor`, `by_action`

---

### 5.17 `waitlist`

| Field | Type |
|---|---|
| `email` | `string` |
| `name` | `string?` |
| `university` | `string?` |
| `role` | `"student" \| "tutor"?` |
| `referralSource` | `string?` |
| `createdAt` | `number` |
| `notifiedAt` | `number?` |

**Indexes:** `by_email`, `by_creation`

---

### 5.18 `crash_courses` — Group Exam-Prep Sessions

| Field | Type | Description |
|---|---|---|
| `creatorId` | `Id<"users">` | User who created the crash course |
| `courseId` | `Id<"university_courses">` | Linked university course |
| `department` | `string?` | Denormalized from course |
| `title` | `string` | — |
| `description` | `string` | — |
| `examType` | `enum` | `"quiz" \| "midterm" \| "final" \| "other"` |
| `topics` | `string[]` | Topics to cover |
| `origin` | `enum` | `"demand"` (student-requested) or `"supply"` (tutor-offered) |
| `status` | `enum` | `"open" \| "requesting" \| "voting" \| "confirming" \| "pending_tutor_review" \| "confirmed" \| "in_progress" \| "completed" \| "cancelled"` |
| `selectedTutorId` | `Id<"users">?` | Tutor assigned (supply: creator; demand: vote winner) |
| `maxEnrollment` | `number` | Max capacity (supply: set at creation; demand: copied from winning tutor's application, default 200) |
| `minEnrollment` | `number?` | Minimum students needed (supply: set at creation; demand: copied from winning tutor's application) |
| `currentEnrollment` | `number` | Live count |
| `scheduledAt` | `number?` | Session date/time (supply: set at creation; demand: set after tutor selection) |
| `duration` | `number?` | Session duration in minutes |
| `location` | `string?` | Room or link |
| `pricePerStudent` | `number?` | Price per student (supply: set at creation; demand: from winning quote) |
| `budgetPerStudent` | `number?` | Student’s budget hint (demand-side only) |
| `preferredDateRange` | `string?` | Preferred date text (demand-side only) |
| `preferredDuration` | `number?` | Preferred duration in minutes (demand-side only) |
| `votingDeadline` | `number?` | Voting end timestamp |
| `confirmationDeadline` | `number?` | Enrollment confirmation deadline |
| `createdAt` | `number` | — |
| `deletedAt` | `number?` | Soft-delete marker |

**Indexes:** `by_status` (status), `by_course` (courseId), `by_department` (department + status), `by_creator` (creatorId), `by_tutor` (selectedTutorId)

**Search Index:** `search_title` (searchField: "title")

**Lifecycle — Supply (tutor-offered):**
```
open → confirmed → in_progress → completed
                                   → cancelled
```

**Lifecycle — Demand (student-requested):**
```
requesting → voting → confirming → confirmed → in_progress → completed
                          ↓                                    → cancelled
                   pending_tutor_review
                     ├─ accept → confirmed
                     ├─ renegotiate → confirming (new price, 24h deadline)
                     └─ cancel → cancelled
```

---

### 5.19 `crash_course_enrollments` — Student Enrollment Records

| Field | Type | Description |
|---|---|---|
| `crashCourseId` | `Id<"crash_courses">` | — |
| `studentId` | `Id<"users">` | — |
| `status` | `enum` | `"enrolled" \| "interested" \| "pending_confirmation" \| "confirmed" \| "withdrawn"` |
| `enrolledAt` | `number` | — |

**Indexes:** `by_crash_course` (crashCourseId), `by_student` (studentId), `by_crash_course_and_student` (crashCourseId + studentId)

---

### 5.20 `crash_course_applications` — Tutor Proposals (Demand-Side)

| Field | Type | Description |
|---|---|---|
| `crashCourseId` | `Id<"crash_courses">` | — |
| `tutorId` | `Id<"users">` | Applying tutor |
| `pitch` | `string` | Why the tutor is a good fit |
| `proposedPrice` | `number` | Price per student |
| `proposedDate` | `number` | Proposed date/time |
| `proposedDuration` | `number` | Proposed duration in minutes |
| `proposedLocation` | `string?` | Room or link |
| `proposedMinEnrollment` | `number?` | Min students the tutor needs to run the session |
| `proposedMaxEnrollment` | `number?` | Max students the tutor can handle |
| `topicsCovered` | `string[]` | Which topics the tutor will cover |
| `voteCount` | `number` | Number of student votes |
| `createdAt` | `number` | — |

**Indexes:** `by_crash_course` (crashCourseId), `by_tutor` (tutorId)

---

### 5.21 `crash_course_votes` — Student Votes on Applications

| Field | Type | Description |
|---|---|---|
| `crashCourseId` | `Id<"crash_courses">` | — |
| `studentId` | `Id<"users">` | Voting student |
| `applicationId` | `Id<"crash_course_applications">` | Application voted for |
| `votedAt` | `number` | — |

**Indexes:** `by_crash_course_and_student` (crashCourseId + studentId), `by_application` (applicationId)

---

## 6. Backend — Convex Functions

### 6.1 `convex/users.ts` — User Management

| Function | Type | Description |
|---|---|---|
| `store` | `mutation` | Called on auth. Creates or updates user from Clerk identity. Sets defaults (PKR, system theme, etc.) for new users. |
| `currentUser` | `query` | Returns the authenticated user with computed reputation. Returns `null` if not found (triggers UserSync). Allows banned users. |
| `update` | `mutation` | Updates user fields. Validated with Zod schema (`bio`, `university`, `avatar`, `name`, `currency`, `language`, `theme`, `links`, `notificationPreferences`, `marketingConsent`). |
| `get` | `query` | Returns public profile for a given user ID. Only public fields (no email, no settings). |
| `setRole` | `mutation` | Switches user between "student" and "tutor". Admin role cannot be set here. |
| `acceptTerms` | `mutation` | Records ToS acceptance timestamp. Allows banned users. |
| `updateTutorPresence` | `mutation` | Updates `isOnline` + `lastActiveAt` on tutor profile. |
| `updateTutorSettings` | `mutation` | Updates tutor profile settings (accepting requests, rates, help types). |

---

### 6.2 `convex/tickets.ts` — Ticket System

| Function | Type | Description |
|---|---|---|
| `create` | `mutation` | Creates a new ticket with input validation, rate limiting (10 per 5 min), and either `courseId` or `customCategory` required. Auto-denormalizes `department` from course. |
| `listMyRequests` / `listMyTickets` | `query` | Lists all tickets for the current user (as student), most recent first. Backfills `assignedTutorId` from accepted offers for legacy data. |
| `listOpen` | `query` | Lists all open tickets, filterable by department and helpType. Uses department index when available. |
| `get` | `query` | Returns a single ticket with enriched student details (name, image, university, reputation). |
| `complete` | `mutation` | Marks a ticket as "resolved" (only by ticket owner). Notifies the assigned tutor. |
| `search` | `query` | Full-text search on ticket titles, filtered by department and helpType. |
| `listByDepartment` | `query` | Lists open tickets for a specific department. |
| `getHistoryWithTutor` | `query` | Gets ticket history between the current student and a given tutor. |
| `matchingRecentJobs` / `getRecommendedJobs` | `query` | **Smart matching algorithm** — scores open tickets for the tutor dashboard. See [Section 13](#13-matching--ranking-algorithms). |

---

### 6.3 `convex/offers.ts` — Offer System

| Function | Type | Description |
|---|---|---|
| `create` | `mutation` | Creates an offer on a ticket. Validates: price > 0, ticket is open, no self-offer, no duplicate offer. Rate limited (5 per minute). Notifies student. |
| `listByTicket` | `query` | Lists offers for a ticket with **full tutor enrichment and ranking**. Ticket owner sees all offers; tutors see only their own. See [Section 13.2](#132-offer-ranking-algorithm-offerslistbyticket). |
| `listByRequest` | `query` | Legacy alias for `listByTicket` with simpler enrichment. |
| `accept` | `mutation` | Accepts an offer: updates offer status, moves ticket to "in_session", assigns tutor, rejects all other offers, creates a conversation between student and tutor, notifies the tutor. |
| `listMyOffers` | `query` | Lists all offers submitted by the current tutor, enriched with ticket title and status. |
| `listBetweenUsers` | `query` | Lists all offers between two specific users (used in DealSidebar). |
| `listOffersForBuyer` | `query` | Lists all offers on all tickets owned by the current student. |

---

### 6.4 `convex/messages.ts` — Real-Time Messaging

| Function | Type | Description |
|---|---|---|
| `listConversations` | `query` | Lists all conversations for the current user, enriched with other participant info and last message. Deduplicates across both participant indexes. |
| `list` | `query` | Lists all messages in a conversation (asc order). Authorization: only participants can read. |
| `send` | `mutation` | Sends a message. Creates conversation if needed (when starting from `recipientId`). Rate limited (30 per minute). Updates conversation's `lastMessageId` + `updatedAt`. Creates or updates notification (coalesces unread message notifications for the same conversation). |
| `markRead` | `mutation` | Marks all messages from the other user in a conversation as read. |
| `getConversation` | `query` | Gets a single conversation with other user details. |
| `getOrCreateConversation` | `mutation` | Gets or creates a conversation between two users. **Requires an accepted offer** between the users — messaging is strictly gated behind offer acceptance. |
| `canSendMessage` | `query` | Checks if the current user can message the other participant. Returns `true` only if an accepted offer exists between them. |
| `getUnreadMessagesFromUser` | `query` | Counts unread messages from a specific user. |

---

### 6.5 `convex/notifications.ts` — Notifications

| Function | Type | Description |
|---|---|---|
| `list` | `query` | Paginated notification list for the current user. Enriches `new_message` notifications with sender info. |
| `markRead` | `mutation` | Marks a single notification as read. |
| `markAllRead` | `mutation` | Marks all unread notifications as read. |
| `create` | `internalMutation` | Internal-only notification creation (used for testing / admin). In practice, notifications are inserted directly in other mutations. |

---

### 6.6 `convex/reviews.ts` — Review System

| Function | Type | Description |
|---|---|---|
| `create` | `mutation` | Creates a review. Validates: rating 1-5, ticket exists, accepted offer exists, correct reviewer role. Prevents duplicate reviews. **Atomically updates the reviewee's `ratingSum`, `ratingCount`, and `reputation`**. Students can review tutors on any ticket; tutors can only review students after ticket resolution. |

---

### 6.7 `convex/reports.ts` — User Reports

| Function | Type | Description |
|---|---|---|
| `create` | `mutation` | Submits a report against a user. Prevents self-reporting. Rate limited (5 per hour). |
| `list` | `query` | Lists all reports (admin only). |
| `resolve` | `mutation` | Resolves or dismisses a report (admin only). |

---

### 6.8 `convex/admin.ts` — Admin Functions

| Function | Type | Description |
|---|---|---|
| `getStats` | `query` | Returns total users, tickets, and reports count. |
| `getReports` | `query` | Lists all reports (desc). |
| `listUsers` | `query` | Lists all users (desc). |
| `banUser` | `mutation` | Bans/unbans a user with optional reason. Audit logged. |
| `createAnnouncement` | `mutation` | Creates a new announcement. Audit logged. |
| `getAnnouncements` | `query` | Returns active announcements (public). |
| `listAnnouncements` | `query` | Returns all announcements (admin). |
| `setAnnouncementStatus` | `mutation` | Activates/deactivates an announcement. Audit logged. |
| `setVerification` | `mutation` | Verifies/unverifies a user. Records `verifiedBy` and `verifiedAt`. Audit logged. |
| `setAdmin` | `mutation` | Grants/revokes admin privileges. Audit logged. |
| `resolveReport` | `mutation` | Resolves/dismisses a report. Audit logged. |
| `getAuditLogs` | `query` | Returns audit logs (last 100 by default), enriched with actor name/email. |

---

### 6.9 `convex/portfolio.ts` — Portfolio & Tutor Courses

| Function | Type | Description |
|---|---|---|
| `addPortfolioItem` | `mutation` | Adds a portfolio item (title, description, imageUrl, link). |
| `getPortfolioItems` | `query` | Lists portfolio items for a user. |
| `addCourse` | `mutation` | Adds a tutor-created course (title, description, price). |
| `getCourses` | `query` | Lists tutor-created courses for a user. |

---

### 6.10 `convex/tutor_profiles.ts` — Tutor Profiles

| Function | Type | Description |
|---|---|---|
| `getMyProfile` | `query` | Returns the current user's tutor profile. |
| `updateProfile` | `mutation` | Updates or creates a tutor profile. If profile doesn't exist, creates one with defaults. |
| `updateOnlineStatus` | `mutation` | Sets online/away/offline status. "online" = accepting requests, anything else = not accepting. |
| `checkIdleTutors` | `internalMutation` | **Cron job handler** — marks tutors as offline if no heartbeat for 10+ minutes. Also disables `acceptingRequests`. |

---

### 6.11 `convex/tutor_offerings.ts` — Course Expertise

| Function | Type | Description |
|---|---|---|
| `add` | `mutation` | Adds a course to the tutor's expertise. Prevents duplicates. |
| `remove` | `mutation` | Removes a course offering. Authorization: owner only. |
| `update` | `mutation` | Updates expertise level for an offering. |
| `listMyOfferings` | `query` | Lists current tutor's offerings, enriched with course details. |
| `listByTutor` | `query` | Lists a tutor's offerings (public). |
| `listByCourse` | `query` | Lists all tutors for a specific course. |

---

### 6.12 `convex/university_courses.ts` — Course Catalog

| Function | Type | Description |
|---|---|---|
| `seed` | `internalMutation` | Seeds 10 base courses. |
| `search` | `query` | In-memory search across all active courses. Matches all search terms against code + name. Prioritizes code matches. Returns up to 20 results. |
| `getAll` | `query` | Returns up to 50 courses. |

---

### 6.13 `convex/study_groups.ts` — Study Groups

| Function | Type | Description |
|---|---|---|
| `create` | `mutation` | Creates a study group (starts with 1 member — the host). |
| `join` | `mutation` | Joins a group. Validates: group is active, not full, user isn't the host. |
| `leave` | `mutation` | Leaves a group. Hosts cannot leave (must close instead). |
| `listByCourse` | `query` | Lists active study groups for a course. |

---

### 6.14 `convex/waitlist.ts` — Pre-Launch Waitlist

| Function | Type | Description |
|---|---|---|
| `joinWaitlist` | `mutation` | Adds an email to the waitlist. Normalizes email to lowercase. Detects duplicates. Returns structured result with `success` and `alreadyExists` flags. |
| `checkWaitlistStatus` | `query` | Checks if an email is on the waitlist. |
| `getWaitlistCount` | `query` | Returns total waitlist count (for social proof). |
| `getWaitlistEntries` | `query` | Returns all waitlist entries ordered by creation (admin only). |
| `getWaitlistStats` | `query` | Returns waitlist stats: total, by role, by referral source, last 7 days signups (admin only). |
| `deleteWaitlistEntry` | `mutation` | Deletes a waitlist entry (admin only). |

---

### 6.16 `convex/crash_courses.ts` — Crash Courses

| Function | Type | Description |
|---|---|---|
| `create` | `mutation` | Creates a crash course. For **supply**: requires price, date, time, duration; sets `selectedTutorId` to creator. For **demand**: accepts optional `budgetPerStudent`, `preferredDateRange`, `preferredDuration`; starts as "requesting". Rate limited (5 per 5 min). |
| `enroll` | `mutation` | Enrolls a student. Supply-side: status = "enrolled". Demand-side: status = "interested" (enables voting). Prevents duplicates, self-enrollment, and overflow. |
| `withdraw` | `mutation` | Withdraws from a crash course. Decrements `currentEnrollment`. |
| `apply` | `mutation` | Tutor submits a full proposal for a demand-side crash course: pitch, price, date/time, duration, location, topics covered, **proposed min/max enrollment** (the tutor's economic terms). Rate limited (10 per 5 min). Prevents duplicates. Validates min ≤ max. Notifies creator. |
| `startVoting` | `mutation` | Creator transitions a demand-side crash course from "requesting" → "voting". Sets 48-hour `votingDeadline`. Requires ≥1 application. Notifies all interested students. |
| `vote` | `mutation` | Enrolled student casts or changes their vote for a tutor application. Only during voting phase. Atomically updates `voteCount` on applications. |
| `selectTutor` | `mutation` | Creator picks the winning tutor (usually top-voted). Copies tutor's quoted price/date/duration/location **and enrollment terms (proposedMinEnrollment → minEnrollment, proposedMaxEnrollment → maxEnrollment)** to the crash course. Moves status → "confirming" with 48-hour `confirmationDeadline`. Updates enrolled students to "pending_confirmation". Notifies all parties. |
| `confirmEnrollment` | `mutation` | Student confirms at the revealed price during the "confirming" phase. Updates enrollment status → "confirmed". |
| `lockIn` | `mutation` | Creator or tutor finalizes the crash course. Moves status → "confirmed". For demand-side with `minEnrollment`, blocks if `currentEnrollment < minEnrollment` unless `forceLockin` is passed. Notifies all confirmed students. |
| `tutorReviewDecision` | `mutation` | Selected tutor acts on a `"pending_tutor_review"` crash course. Three decisions: **accept** (→ "confirmed" at current price), **renegotiate** (sets new `pricePerStudent`, resets enrolled students to "pending_confirmation", resets `currentEnrollment` to 0, new 24h deadline, status → "confirming"), **cancel** (→ "cancelled", no penalty, notifies all). |
| `start` | `mutation` | Moves status → "in_progress" (tutor or creator only). |
| `complete` | `mutation` | Moves status → "completed" (tutor or creator only). |
| `cancel` | `mutation` | Moves status → "cancelled". Notifies all enrolled students. |
| `get` | `query` | Returns a crash course enriched with creator, tutor, and course details. |
| `list` | `query` | Lists crash courses with optional filters: origin, department, examType, status. Uses indexes where possible. Excludes deleted/cancelled. Returns up to 50, enriched with course info. |
| `listMy` | `query` | Lists crash courses where the user is creator, tutor, or enrolled. |
| `getEnrollments` | `query` | Lists all enrollments for a crash course, enriched with student name/image. |
| `getMyEnrollment` | `query` | Returns the current user's enrollment for a crash course (if any). |
| `getApplications` | `query` | Lists tutor applications for a crash course, enriched with tutor profile, expertise, and completed job count. Sorted by `voteCount` descending. |
| `getMyVote` | `query` | Returns the current user's vote for a crash course (if any). |
| `getUpcoming` | `query` | Returns upcoming crash courses for the current user (enrolled or teaching). Used in dashboard widgets. |
| `search` | `query` | Full-text search on crash course titles. |
| `autoCloseVoting` | `internalMutation` | Cron handler: finds crash courses past `votingDeadline`, auto-selects the top-voted tutor, transitions to "confirming". |
| `autoExpireConfirmations` | `internalMutation` | Cron handler: finds crash courses past `confirmationDeadline`. Withdraws non-confirmed students. If no one confirmed → cancels. If `minEnrollment` is set and not met, or if no `minEnrollment` and confirmed < 50% of interested (min 4 interested), → transitions to `"pending_tutor_review"` and notifies tutor (`"crash_course_low_enrollment"`). Otherwise → auto-confirms. |
| `sendReminders` | `internalMutation` | Cron handler: sends "starting soon" notifications for crash courses starting within 2 hours. |

---

### 6.15 `convex/utils.ts` — Shared Utilities

| Export | Description |
|---|---|
| `INPUT_LIMITS` | Constants: TITLE_MAX (200), DESCRIPTION_MAX (5000), MESSAGE_MAX (10000), BIO_MAX (1000), COMMENT_MAX (2000), REASON_MAX (500) |
| `validateLength(value, max, fieldName)` | Throws `ConvexError` if string exceeds max length. |
| `RATE_LIMITS` | `OFFER_CREATE` (5/min), `MESSAGE_SEND` (30/min), `TICKET_CREATE` (10/5min), `REPORT_CREATE` (5/hr) |
| `requireUser(ctx, options?)` | Authenticates and returns user. Throws if unauthenticated, not found, or banned (unless `allowBanned: true`). |
| `requireAdmin(ctx)` | Authenticates and requires `isAdmin` flag. |
| `logAudit(ctx, args)` | Inserts an audit log record with action, actor, target, and details. |

---

## 7. Frontend — App Router (Pages & Routes)

### 7.1 Route Map

| Route | Auth | Description |
|---|---|---|
| `/` | Public | Landing page with waitlist signup (Hero + Form + Counter + Features) |
| `/admin` | Admin | Admin dashboard with stats, waitlist management, announcements, user management, reports, audit logs |
| `/courses` | Protected | Browseable course catalog, searchable, filterable by department |
| `/dashboard/buyer` | Protected | Student dashboard: spending chart, KPIs, pending offers, recent requests |
| `/dashboard/seller` | Protected | Tutor dashboard: earnings chart, KPIs, recommended jobs, active bids |
| `/messages` | Protected | Chat interface with conversation list + chat window |
| `/onboarding` | Protected | 3-step onboarding wizard (role → profile → confirmation) |
| `/opportunities` | Protected | Opportunity board: tutors browse and submit offers on open tickets |
| `/profile` | Protected | Edit own profile (bio, university, portfolio, courses) |
| `/profile/[id]` | Protected | Public profile viewer with expertise, portfolio, report/edit dialogs |
| `/requests/new` | Protected | Create a new ticket (course or general, help type, budget, urgency) |
| `/requests/[id]` | Protected | Ticket detail: description, offers list with ranking, submit offer, reviews, messaging |
| `/search` | Protected | Full search page with filters (department, help type), job cards |
| `/settings` | Protected | Settings page: general, notifications, privacy, tutor profile, courses |
| `/study-groups` | Protected | Study groups browser with course filtering, create/join groups, tutor list |
| `/crash-courses` | Protected | Browse & filter crash courses (tabs: All/Requested/Offered/My Courses) |
| `/crash-courses/new` | Protected | 5-step multi-form wizard to create (supply) or request (demand) a crash course: Type → Basics → Topics → Schedule/Preferences → Review |
| `/crash-courses/[id]` | Protected | Crash course detail: schedule, enrollment, voting, applications, lifecycle actions |

### 7.2 Root Layout (`app/layout.tsx`)

Provider tree (outermost → innermost):
```
<html>
  <body>
    <ConvexClientProvider>          ← Clerk + Convex + UserSync
      <ThemeProvider>                ← Light/dark/system theme
        <RoleProvider>               ← Student/tutor role context
          <Navbar />
          <BannedBanner />
          <AnnouncementsBar />
          {children}                 ← Page content
          <Toaster />                ← Sonner toast notifications
          <TermsModal />             ← ToS acceptance modal
        </RoleProvider>
      </ThemeProvider>
    </ConvexClientProvider>
  </body>
</html>
```

### 7.3 Template (`app/template.tsx`)

Wraps every page with:
1. **Launch gate** — `IS_LAUNCHED` flag. If `false`, non-admin users on internal routes are redirected to `/` with a "Coming Soon" toast.
2. **Page transition** — Framer Motion fade + slide animation via `<PageTransition>`.

### 7.4 ConvexClientProvider (`app/ConvexClientProvider.tsx`)

- Creates a `ConvexReactClient` using `NEXT_PUBLIC_CONVEX_URL`.
- Wraps app with `ClerkProvider` (with custom appearance theme matching the design system) and `ConvexProviderWithClerk`.
- Renders `<UserSync />` to auto-sync Clerk users to Convex on every page load.

---

## 8. Components Deep-Dive

### 8.1 Layout Components

| Component | File | Description |
|---|---|---|
| **Navbar** | `components/layout/Navbar.tsx` | Main navigation: role-dependent links (Student: Dashboard + Post Request; Tutor: Dashboard + Find Jobs), **Crash Courses** link (both roles), Messages with unread count, Settings, Admin Portal, CommandSearch, RoleSwitcher, NotificationDropdown, Clerk UserButton. Sticky with backdrop blur. |
| **RoleSwitcher** | `components/layout/RoleSwitcher.tsx` (43 lines) | Toggle button between Student/Tutor roles with Framer Motion animation. Navigates to appropriate dashboard on switch. |
| **AnnouncementsBar** | `components/layout/AnnouncementsBar.tsx` (91 lines) | Dismissible admin announcements bar. Persists dismissed IDs in localStorage. Gradient background with glassmorphism. |
| **BannedBanner** | `components/layout/BannedBanner.tsx` (27 lines) | Red banner for banned users with sign-out link. |

### 8.2 Chat Components

| Component | File | Description |
|---|---|---|
| **ChatWindow** | `components/chat/ChatWindow.tsx` (161 lines) | Real-time message display with auto-scroll, read receipts (checkmarks), input bar, banned-user blocking. |
| **ConversationList** | `components/chat/ConversationList.tsx` (121 lines) | Scrollable list of conversations with avatars, last message preview, relative timestamps, unread indicators. |
| **DealSidebar** | `components/chat/DealSidebar.tsx` (167 lines) | Sheet panel showing offers and ticket history between two users. |
| **MessageButton** | `components/chat/MessageButton.tsx` (66 lines) | Reusable button to initiate/navigate to a conversation. Creates conversation if needed. |
| **TicketHistorySection** | `components/chat/TicketHistorySection.tsx` (126 lines) | Shows past tickets between current user and a tutor (max 5). |

### 8.3 Dashboard Components

| Component | File | Description |
|---|---|---|
| **SpendingChart** | `components/dashboard/SpendingChart.tsx` (127 lines) | Recharts area chart for buyer's 6-month spending. Coral/orange gradient. |
| **EarningsChart** | `components/dashboard/EarningsChart.tsx` (117 lines) | Recharts area chart for seller's 6-month earnings. Blue/teal gradient. |
| **OffersSection** | `components/dashboard/OffersSection.tsx` (158 lines) | Grid of pending offers for buyer review with sorting and pagination. |
| **BidCard** | `components/dashboard/BidCard.tsx` (70 lines) | Card displaying a single tutor bid with status, price, age. |

### 8.4 Search Components

| Component | File | Description |
|---|---|---|
| **CommandSearch** | `components/search/CommandSearch.tsx` | ⌘K command palette using cmdk. Suggestions: Dashboard, Messages, Profile, **Crash Courses**, **Create Crash Course**. |
| **SearchBar** | `components/search/SearchBar.tsx` (36 lines) | Debounced search input (500ms). |
| **Filters** | `components/search/Filters.tsx` (99 lines) | Department + help type + category filter dropdowns. Controlled component pattern. |

### 8.5 Trust & Safety Components

| Component | File | Description |
|---|---|---|
| **TermsModal** | `components/trust/TermsModal.tsx` (63 lines) | Forced ToS acceptance modal. Cannot be dismissed without accepting. Blocks outside clicks. |
| **ReportDialog** | `components/trust/ReportDialog.tsx` (96 lines) | Report a user with categorized reasons (spam, harassment, inappropriate, scam, other). |
| **VerifiedBadge** | `components/trust/VerifiedBadge.tsx` (19 lines) | Blue checkmark icon with "Verified User" tooltip. |

### 8.6 Profile Components

| Component | File | Description |
|---|---|---|
| **EditProfileDialog** | `components/profile/EditProfileDialog.tsx` (98 lines) | Dialog to edit name, bio, university, social links. |
| **ExpertiseSection** | `components/profile/ExpertiseSection.tsx` (155 lines) | Displays and manages tutor's course expertise. Add/remove courses with CourseSelector. |

### 8.7 Portfolio Components

| Component | File | Description |
|---|---|---|
| **PortfolioSection** | `components/portfolio/PortfolioSection.tsx` (128 lines) | Grid of portfolio items with add dialog (image URL, link). |
| **CoursesSection** | `components/portfolio/CoursesSection.tsx` (129 lines) | Grid of tutor-created courses with add dialog (price-based). |

### 8.8 Admin Components

| Component | File | Description |
|---|---|---|
| **AdminGuard** | `components/admin/AdminGuard.tsx` (20 lines) | Route guard — redirects non-admins to `/`. |
| **UserManagement** | `components/admin/UserManagement.tsx` (110 lines) | User table: verify/unverify, admin toggle, ban/unban. Self-protection on admin toggle. |
| **ReportsTable** | `components/admin/ReportsTable.tsx` (59 lines) | Reports table with resolve/dismiss actions. |
| **WaitlistManagement** | `components/admin/WaitlistManagement.tsx` (228 lines) | Full waitlist dashboard: stats, search, filter, CSV export, delete entries. |

### 8.9 Other Components

| Component | File | Description |
|---|---|---|
| **CourseSelector** | `components/CourseSelector.tsx` (101 lines) | Popover + Command combobox for searching and selecting university courses. Debounced search against `university_courses.search`. |
| **TutorStatusToggle** | `components/TutorStatusToggle.tsx` (107 lines) | Switch for online/offline status with settings dialog (accepting requests, paid/free). |
| **OnlinePresence** | `app/components/OnlinePresence.tsx` (43 lines) | Invisible component that sends heartbeat every 4 minutes to keep tutor's online status alive. Reactivates on tab visibility change. |
| **StarRating** | `components/reviews/StarRating.tsx` (55 lines) | Display-only star rating (supports half stars). |
| **StudyGroupCard** | `components/study-groups/StudyGroupCard.tsx` (88 lines) | Study group card with member count, join/leave buttons. Host sees disabled "You're the Host". |

### 8.12 Crash Course Components

| Component | File | Description |
|---|---|---|
| **CrashCourseCard** | `components/crash-courses/CrashCourseCard.tsx` | Card for browse grid: status badge, exam type, origin badge (Requested/Offered), title, course code, topic tags (max 3 + overflow), enrollment count, date, duration, application count, price. Links to `/crash-courses/[id]`. |
| **EnrollmentBar** | `components/crash-courses/EnrollmentBar.tsx` | Progress bar showing current enrollment vs max capacity. Optional min-enrollment indicator line. |
| **ApplicationCard** | `components/crash-courses/ApplicationCard.tsx` | Tutor application card for voting: rank badge (🏆/🥈/🥉), tutor avatar + verification/online status, reputation, expertise level, completed jobs, pitch text, full quote (price/date/duration/location), **proposed min/max enrollment** (enrollment terms), topic coverage with color-coded badges, vote bar with progress, vote button. |
| **VotingSection** | `components/crash-courses/VotingSection.tsx` | Voting interface wrapping ApplicationCards. Fetches applications via `useQuery`, handles vote mutation with toast, shows voting deadline countdown, renders ApplicationCards sorted by votes. |
| **NotificationDropdown** | `components/notifications/NotificationDropdown.tsx` | Bell icon dropdown with paginated notifications, mark read, route by type. Supports crash course notification types (new application, voting started, tutor selected, confirmed, starting soon, cancelled). |
| **UserSync** | `components/auth/UserSync.tsx` (19 lines) | Auto-syncs Clerk user to Convex on every page load. |
| **OnboardingWizard** | `components/onboarding/OnboardingWizard.tsx` (119 lines) | 3-step wizard: role selection → bio/university → confirmation. Redirects to dashboard. |

### 8.10 Waitlist Components

| Component | File | Description |
|---|---|---|
| **WaitlistHero** | `components/waitlist/WaitlistHero.tsx` | Animated hero section with gradient text and "Coming Soon" badge. |
| **WaitlistForm** | `components/waitlist/WaitlistForm.tsx` | Full waitlist signup form: email, name, university, role selection, referral source. Success state with checkmark. |
| **WaitlistCounter** | `components/waitlist/WaitlistCounter.tsx` | Live count of waitlist signups (social proof). |
| **FeaturesPreview** | `components/waitlist/FeaturesPreview.tsx` | 4-card feature preview grid (Find Tutors, Study Groups, 1-on-1 Chat, Verified Profiles). |

### 8.11 UI Primitives (`components/ui/`)

34 Shadcn UI components in "new-york" style: `aspect-ratio`, `avatar`, `badge`, `button`, `calendar`, `card`, `carousel`, `chart`, `checkbox`, `command`, `dialog`, `dropdown-menu`, `empty-state`, `form`, `gradient-card`, `hover-card`, `input`, `label`, `lottie-animation`, `PageTransition`, `popover`, `progress`, `radio-group`, `scroll-area`, `select`, `separator`, `sheet`, `skeleton`, `sonner`, `switch`, `table`, `tabs`, `textarea`, `tooltip`.

**Custom UI primitives:**
- `empty-state.tsx` — Centered icon + title + description + optional action
- `gradient-card.tsx` — Card with 3 gradient variants (sunrise, ocean, berry)
- `lottie-animation.tsx` — Client-only Lottie wrapper with skeleton fallback
- `PageTransition.tsx` — Framer Motion fade + slide wrapper

---

## 9. Context Providers

### 9.1 RoleContext (`context/RoleContext.tsx`)

**Purpose:** Manages the current user's active role (student vs tutor).

**How it works:**
1. On mount, reads user's role from Convex, falls back to localStorage, defaults to "student".
2. Handles legacy role names ("buyer" → "student", "seller" → "tutor").
3. Persists to localStorage (`path_user_role`) and syncs to Convex via `setRole` mutation.
4. Provides: `role`, `setRole(role)`, `toggleRole()`.

**Usage:** `import { useRole } from "@/context/RoleContext"` → `const { role, toggleRole } = useRole();`

### 9.2 ThemeProvider (`context/ThemeProvider.tsx`)

**Purpose:** Applies the user's preferred theme (light/dark/system) to the DOM.

**How it works:**
1. Reads `user.theme` from Convex.
2. Applies the correct class (`light` or `dark`) to `<html>`.
3. For "system", listens to `prefers-color-scheme` media query changes.
4. No UI — purely side-effect provider.

---

## 10. Styling & Design System

### 10.1 Foundation

- **Tailwind CSS 4** with CSS custom properties (OKLCH colors)
- **"Premium macOS Sonoma-inspired"** visual language: frosted glass effects, warm neutrals, subtle gradients
- **Geist Sans** / **Geist Mono** fonts (Google Fonts)
- **Path alias:** `@/*` maps to project root

### 10.2 Color Palette Summary

| Token | Light | Dark |
|---|---|---|
| Background | Warm off-white (`oklch(0.985 0.002 80)`) | Deep charcoal (`oklch(0.145 0.015 260)`) |
| Primary | Deep charcoal (`oklch(0.205 0.015 260)`) | Off-white (`oklch(0.97 0.003 80)`) |
| Accent Amber | `oklch(0.78 0.15 75)` | `oklch(0.75 0.155 75)` |
| Accent Coral | `oklch(0.68 0.14 25)` | `oklch(0.65 0.15 25)` |
| Accent Teal | `oklch(0.55 0.12 195)` | `oklch(0.52 0.13 195)` |
| Destructive | Apple-style red `oklch(0.55 0.22 27)` | — |

### 10.3 Custom Utility Classes

| Class | Description |
|---|---|
| `.glass` | Frosted glass effect (`backdrop-blur-xl` + translucent bg) |
| `.mesh-bg` | Multi-layered radial-gradient background |
| `.glass-card` | Premium glassmorphism card with layered box shadows, hover lift |
| `.shadow-glow-*` | Colored glow shadows (amber, coral, teal) |
| `.card-3d` | 3D perspective hover tilt |
| `.animate-count` | Count-up animation |
| `.stagger-1/2/3` | Staggered animation delays (0.1s / 0.2s / 0.3s) |
| `.container` | Centered, max-w-7xl, responsive padding |

---

## 11. Authentication Flow

```
Browser → Clerk (sign-in/sign-up)
    ↓
Clerk authenticates → sets JWT cookie
    ↓
Route accessed → proxy.ts middleware checks if route is public
    ↓
If not public → auth.protect() blocks unauthenticated requests
    ↓
ConvexClientProvider loads → <UserSync /> fires
    ↓
UserSync calls users.store mutation:
    - If new user → creates user record with defaults
    - If existing user → patches lastLoginAt, syncs name changes
    ↓
TermsModal checks if termsAcceptedAt exists
    ↓
If not accepted → forces ToS acceptance before proceeding
    ↓
User lands on dashboard
```

**Key Points:**
- Clerk handles all auth UI (custom-themed to match design system)
- User data lives in Convex, synced from Clerk identity
- Every Convex mutation/query has access to `ctx.auth.getUserIdentity()` for auth
- The `requireUser()` utility standardizes auth checks across all functions
- Banned users can still access certain queries (`allowBanned: true`) but are blocked from most mutations

---

## 12. Core Business Flows

### 12.1 Ticket Creation Flow

```
Student → /requests/new
    ↓
Fill form: title, type (course/general), help type, description, budget, urgency
    ↓
CourseSelector: searches university_courses catalog → selects course
    ↓
Submit → tickets.create mutation:
    - Validates inputs (length limits)
    - Rate limits (10 per 5 minutes)
    - Denormalizes department from course
    - Inserts ticket with status: "open"
    ↓
Ticket appears on:
    - /search (all users)
    - /opportunities (all users)
    - /dashboard/seller (matched tutors via algorithm)
    - Student's /dashboard/buyer requests list
```

### 12.2 Offer & Acceptance Flow

```
Tutor sees open ticket (via search, opportunities, or dashboard match)
    ↓
Clicks "I Can Do This" / "Submit Offer" → enters price
    ↓
offers.create mutation:
    - Validates: price > 0, ticket is open, no self-offer, no duplicate
    - Rate limits (5 per minute)
    - Inserts offer with status: "pending"
    - Notifies student → notification: "offer_received"
    ↓
Student sees offer on /requests/[id] → offers ranked by matchPercent + reputation + price
    ↓
Student clicks "Accept" → offers.accept mutation:
    1. Updates offer status → "accepted"
    2. Updates ticket status → "in_session", assigns tutorId
    3. Rejects all other offers for this ticket → "rejected"
    4. Creates conversation between student & tutor
    5. Notifies tutor → notification: "offer_accepted"
    ↓
Student & tutor can now chat at /messages
```

### 12.3 Ticket Resolution & Review Flow

```
Session completes (async or live)
    ↓
Student clicks "Mark as Done" → tickets.complete mutation:
    - Status → "resolved"
    - Notifies tutor → "ticket_resolved"
    ↓
Both parties can leave reviews:
    - Student → tutor (student_to_tutor) — allowed anytime
    - Tutor → student (tutor_to_student) — only after resolution
    ↓
reviews.create mutation:
    - Validates rating (1-5), checks for duplicate
    - Inserts review
    - ATOMICALLY updates reviewee.ratingSum and ratingCount
    - Recomputes reviewee.reputation = ratingSum / ratingCount
```

### 12.4 Messaging Flow

```
Prerequisite: An accepted offer must exist between the two users
    ↓
User clicks MessageButton → messages.getOrCreateConversation:
    - Checks for accepted offer (either direction)
    - Throws "Messaging is only allowed after an offer has been accepted" if none
    - Finds existing conversation or creates new one
    ↓
Redirects to /messages?conversationId=...
    ↓
ChatWindow loads:
    - Queries messages.list (all messages in conversation, asc)
    - Queries messages.canSendMessage (re-validates offer status)
    - Auto-marks messages as read via messages.markRead
    ↓
User types message → messages.send:
    - Validates input length (10,000 char max)
    - Rate limits (30 per minute)
    - Inserts message
    - Updates conversation.lastMessageId + updatedAt
    - Creates/updates notification for recipient
        - Coalesces: if unread notification exists for same conversation,
          increments count instead of creating new notification
```

### 12.5 Crash Course — Supply-Side Flow (Tutor Offers)

```
Tutor → /crash-courses/new → 5-step wizard
    Step 1 — Type: selects "Offer a Crash Course"
    Step 2 — Basics: course, title, exam type, description
    Step 3 — Topics: add topic tags, set max enrollment
    Step 4 — Schedule & Pricing: date, time, duration, location,
             price per student, optional min enrollment
    Step 5 — Review: summary of all fields with inline edit buttons
    ↓
Submit → crash_courses.create mutation:
    - Validates all required fields (price, date, duration)
    - Rate limits (5 per 5 minutes)
    - Sets origin: "supply", status: "open"
    - Sets selectedTutorId = creator
    ↓
Crash course appears on /crash-courses ("Offered" tab)
    ↓
Students browse & click "Enroll — PKR X" → crash_courses.enroll:
    - status: "enrolled", currentEnrollment incremented
    ↓
Tutor clicks "Lock In & Confirm" → crash_courses.lockIn:
    - Status → "confirmed"
    - Notifies all enrolled students
    ↓
"Start Session" → status: "in_progress"
"Mark Completed" → status: "completed"
```

### 12.6 Crash Course — Demand-Side Flow (Student Requests)

```
Student → /crash-courses/new → 5-step wizard
    Step 1 — Type: selects "Request a Crash Course"
    Step 2 — Basics: course, title, exam type, description
    Step 3 — Topics: add topic tags (no enrollment numbers — tutor defines those)
    Step 4 — Preferences: preferred date range, preferred duration,
             budget per student (hint) — all optional
    Step 5 — Review: summary of all fields with inline edit buttons
    ↓
Submit → crash_courses.create mutation:
    - Sets origin: "demand", status: "requesting"
    - No tutor assigned yet, no hard pricing
    - maxEnrollment defaults to 200 (no student-set cap)
    ↓
Students express interest → crash_courses.enroll (status: "interested")
Tutors apply → crash_courses.apply:
    - Full quote: price, date/time, duration, location, topics, pitch
    - Enrollment terms: proposedMinEnrollment, proposedMaxEnrollment
      (e.g. “I’ll teach for PKR 300/head if at least 8 students confirm”)
    - Students see min/max in the ApplicationCard before voting
    - Notifies creator (“crash_course_new_application”)
    ↓
Creator opens voting → crash_courses.startVoting:
    - Status → "voting", 48-hour votingDeadline set
    - Notifies all interested students (“crash_course_voting_started”)
    ↓
Students vote for their preferred tutor → crash_courses.vote:
    - One vote per student, changeable during voting period
    - Atomically updates voteCount on applications
    - Min enrollment visible to help students weigh risk
    ↓
Voting ends (creator manually or auto-close cron):
    Creator selects tutor → crash_courses.selectTutor:
    - Copies winner's price/date/duration/location to crash course
    - Status → "confirming", 48-hour confirmationDeadline
    - All interested students → "pending_confirmation"
    - Notifies students (“crash_course_tutor_selected”)
    ↓
Students see the final price & confirm → crash_courses.confirmEnrollment:
    - Student enrollment transitions to "confirmed"
    ↓
Confirmation deadline expires → autoExpireConfirmations cron:
    - Withdraws non-confirmed students
    - If enough confirmed → status: "confirmed"
    - If too few confirmed (below minEnrollment or <50% of interested):
        Status → "pending_tutor_review"
        Tutor notified ("crash_course_low_enrollment")
        ↓
        Tutor decision → crash_courses.tutorReviewDecision:
            Accept → status: "confirmed" (proceed with current headcount)
            Renegotiate → new pricePerStudent, enrolled → "pending_confirmation",
                          currentEnrollment reset, new 24h deadline,
                          status → "confirming" (students re-confirm)
            Cancel → status: "cancelled" (no penalty)
    ↓
Creator/tutor locks in → crash_courses.lockIn:
    - Status → "confirmed"
    - Guards against low enrollment (requires forceLockin if below min)
    - Notifies confirmed students (“crash_course_confirmed”)
    ↓
"Start Session" → status: "in_progress"
"Mark Completed" → status: "completed"
```

---

## 13. Matching & Ranking Algorithms

### 13.1 Tutor Dashboard Job Matching (`tickets.matchingRecentJobs`)

This algorithm surfaces the **top 10 most relevant open tickets** for a tutor on their dashboard.

**Scoring Formula:**

| Factor | Score |
|---|---|
| **Direct course match** (tutor offers the exact course) | +1.0 |
| **General job** (no courseId — show to everyone) | +0.7 |
| **No offerings** (tutor has no course expertise set) | +0.5 |
| **No match** (tutor has offerings but not for this course) | **Filtered out** |
| **High urgency** | +0.2 |
| **Medium urgency** | +0.1 |
| **< 2 hours old** | +0.15 |
| **< 6 hours old** | +0.10 |
| **< 24 hours old** | +0.05 |

Tickets with helpTypes not in the tutor's `allowedHelpTypes` are filtered out (if the tutor has any preferences set).

Results are sorted by score descending, then by `createdAt` descending. Top 10 returned.

### 13.2 Offer Ranking Algorithm (`offers.listByTicket`)

When a student views offers on their ticket, each offer is enriched with a **match percentage** and a **rank score** for sorting.

**Match Percentage (0-100%):**

| Factor | Points |
|---|---|
| Course expertise match (exact course) | +40% |
| Expertise level: Expert | +15% |
| Expertise level: Intermediate | +10% |
| Related courses in same department | +10% |
| Verified user | +10% |
| Currently online | +15% |
| Active in last 24h (not online) | +8% |
| 10+ completed jobs | +10% |
| 5+ completed jobs | +5% |

**Rank Score (composite for sorting):**

$$\text{rankScore} = (\text{reputation} / 5 \times 100) \times 0.4 + \text{matchPercent} \times 0.35 + \text{priceScore} \times 0.25$$

Where:
$$\text{priceScore} = 100 - (\text{offerPrice} / \text{maxPrice} \times 100)$$

Lower-priced offers get a higher priceScore. Offers are sorted by `rankScore` descending.

---

## 14. Real-Time Features

Convex provides **automatic real-time subscriptions** for all `useQuery` hooks. When data changes on the server, UI updates instantly.

### What's Real-Time:

| Feature | How |
|---|---|
| **Chat messages** | `messages.list` subscription auto-updates when new messages arrive |
| **Conversation list** | `messages.listConversations` re-evaluates when conversations change |
| **Notifications** | `notifications.list` paginated query updates on new notifications |
| **Ticket status** | `tickets.get` / `tickets.listMyRequests` update when status changes |
| **Offer list** | `offers.listByTicket` updates when new offers arrive |
| **Online status** | Tutor profiles reflect `isOnline` changes |
| **Waitlist count** | `waitlist.getWaitlistCount` updates live |
| **Announcements** | `admin.getAnnouncements` reflects admin changes instantly |
| **Crash course enrollments** | `crash_courses.getEnrollments` updates when students enroll/withdraw |
| **Crash course voting** | `crash_courses.getApplications` + `crash_courses.getMyVote` update as votes are cast |
| **Crash course status** | `crash_courses.get` reflects lifecycle transitions in real-time |

### Presence System:

1. `OnlinePresence` component sends heartbeat every 4 minutes via `tutor_profiles.updateOnlineStatus` mutation.
2. On browser tab visibility change, immediately sends heartbeat.
3. Cron job (`checkIdleTutors`) runs every 10 minutes — marks tutors as offline if `lastActiveAt` is > 10 minutes ago.

---

## 15. Admin System

### Access Control

- Admin status is set via `admin.setAdmin` mutation (requires existing admin).
- All admin queries/mutations use `requireAdmin()` which calls `requireUser()` first, then checks `isAdmin`.
- Frontend uses `<AdminGuard>` component to redirect non-admins.
- Admin link appears in Navbar only when `user.isAdmin === true`.

### Admin Dashboard Tabs

| Tab | Content |
|---|---|
| **Waitlist** | WaitlistManagement: stats (total, weekly, by role/referral), searchable table, CSV export, delete entries |
| **Overview** | Announcement CRUD with active/inactive toggle |
| **Users** | UserManagement: verify/unverify, admin toggle, ban/unban |
| **Reports** | ReportsTable: resolve/dismiss user reports |
| **Audit Logs** | Timestamped log of all admin actions (actor, action, target) |

### Audit Trail

Every admin action is logged to `audit_logs` table:
- `user_banned` / `user_unbanned`
- `announcement_created` / `announcement_activated` / `announcement_deactivated`
- `user_verified` / `user_unverified`
- `admin_granted` / `admin_revoked`
- `report_resolved` / `report_dismissed`

---

## 16. Security & Trust Layer

### Authentication

- All non-public routes protected by Clerk middleware (`proxy.ts`)
- Backend functions use `requireUser()` — validates JWT, fetches user, checks ban status
- `requireAdmin()` additionally checks `isAdmin` flag

### Input Validation

- Server-side validation on all mutations using `validateLength()` with defined `INPUT_LIMITS`
- Zod schema validation for user updates (`users.update`)
- Budget range validation (0 to 1,000,000)
- Convex argument validators (`v.string()`, `v.number()`, etc.) provide type-level validation

### Rate Limiting

| Action | Limit |
|---|---|
| Create ticket | 10 per 5 minutes |
| Create offer | 5 per 1 minute |
| Send message | 30 per 1 minute |
| Create report | 5 per 1 hour |
| Create crash course | 5 per 5 minutes |
| Apply to crash course | 10 per 5 minutes |

Rate limiting is implemented by counting recent records per user within the time window.

### Authorization

| Rule | Enforcement |
|---|---|
| Only ticket owner can accept offers | `offers.accept` checks `user._id === ticket.studentId` |
| Only ticket owner can resolve tickets | `tickets.complete` checks ownership |
| Only participants can read messages | `messages.list` validates participant membership |
| Messaging requires accepted offer | `getOrCreateConversation` + `canSendMessage` check |
| Only offer owner can see their own offer (on others' tickets) | `listByTicket` filters by user |
| Tutors can review students only after resolution | `reviews.create` checks `ticket.status === "resolved"` |
| Self-reporting blocked | `reports.create` checks `targetId !== user._id` |
| Only admins can access admin functions | `requireAdmin()` on all admin endpoints |

### Ban System

- Banned users see `BannedBanner` with sign-out option
- Most mutations reject banned users via `requireUser()` (throws "Your account has been banned")
- Some queries allow banned users (`allowBanned: true`) so they can still see their data
- Admin can ban with reason, which sets `isBanned`, `banReason`, and is audit logged

### Terms of Service

- `TermsModal` component forces acceptance on first visit
- Modal cannot be dismissed without accepting (`onInteractOutside` prevented)
- Acceptance recorded as ISO timestamp in `termsAcceptedAt` field

---

## 17. Cron Jobs & Background Tasks

### Active Cron Jobs (`convex/crons.ts`)

| Job | Schedule | Handler | Description |
|---|---|---|---|
| `check-idle-tutors` | Every 10 minutes | `tutor_profiles.checkIdleTutors` | Scans all online tutors. If `lastActiveAt` > 10 minutes ago, sets `isOnline: false` and `acceptingRequests: false`. |
| `auto-close-crash-course-voting` | Every 30 minutes | `crash_courses.autoCloseVoting` | Finds crash courses past `votingDeadline` that are still in "voting" status. Auto-selects the top-voted tutor and transitions to "confirming" with a 48-hour confirmation deadline. |
| `auto-expire-crash-course-confirmations` | Every 30 minutes | `crash_courses.autoExpireConfirmations` | Finds crash courses past `confirmationDeadline` that are still in "confirming" status. Withdraws non-confirmed students. If enrollment is below the threshold (explicit `minEnrollment` or implicit 50% of interested), transitions to "pending_tutor_review" for tutor decision. Otherwise auto-confirms. |
| `crash-course-reminders` | Every 30 minutes | `crash_courses.sendReminders` | Sends "starting soon" notifications for confirmed crash courses scheduled to start within the next 2 hours. |

---

## 18. Seed & Migration Scripts

### Seed Scripts

| File | Function | Description |
|---|---|---|
| `convex/init.ts` | `seed` | Seeds 10 LUMS courses + 2 dummy users (Alice Student, Bob Tutor). |
| `convex/seed.ts` | `seedJobWithOffers` | Creates 1 student, 15 tutors with profiles/offerings, 1 ticket, and 15+ offers. Used to test the offer ranking algorithm. |
| `convex/seedCourses.ts` | `addCourse` | Seeds the **full course catalog** — 529 courses from all departments (ACCT, AI, ANTH, AST, BIO, CHE, CHEM, CLCA, CS, ECON, EE, MATH, MGS, MGMT, MKT, PHED, PHI, PHY, POL, PSYC, REL, SOC, SS, etc.). |
| `convex/university_courses.ts` | `seed` | Seeds 10 base courses (CS, MATH, PHY, ECON, SS). |

### Migration Scripts (`convex/maintenance.ts`)

| Function | Description |
|---|---|
| `backfillUserRatings` | Adds `ratingSum: 0, ratingCount: 0` to users missing those fields. |
| `backfillOfferStudentId` | Backfills `studentId` on offers using the parent ticket's `studentId`. |
| `backfillTermsAccepted` | Sets `termsAcceptedAt` on users who haven't accepted (for seed/test accounts). |

### Debug Utilities (`convex/debug.ts`)

| Function | Description |
|---|---|
| `listDevUsers` | Lists non-test users (admin only). |
| `transferTicket` | Transfers a ticket's ownership to another user + updates related offers (admin only). |
| `cleanupSeedData` | Cleans up seed-generated data for a specific ticket (admin only). |

---

## 19. Utility Modules

### `lib/utils.ts`

| Function | Description |
|---|---|
| `cn(...inputs)` | Merges Tailwind CSS class names using `clsx` + `tailwind-merge`. |
| `formatStatus(status)` | Converts snake_case status strings to Title Case (e.g., "in_progress" → "In Progress"). |

### `lib/animations.ts`

Contains a placeholder Lottie animation JSON object (`rocketAnimation`) — a simple blue ellipse. Used as a loading/placeholder animation.

---

## 20. Known Conventions & Patterns

### Naming Conventions

| Pattern | Example |
|---|---|
| Convex functions | `moduleName.functionName` (e.g., `tickets.create`, `offers.listByTicket`) |
| Page files | `app/<route>/page.tsx` (Next.js App Router convention) |
| Components | PascalCase (e.g., `ChatWindow.tsx`, `BidCard.tsx`) |
| Context hooks | `use<Context>` (e.g., `useRole()`) |

### Backward Compatibility Aliases

The codebase migrated from "request/buyer/seller" terminology to "ticket/student/tutor". Many aliases exist:

| Old Name | New Name | Where |
|---|---|---|
| `requestId` | `ticketId` | `offers.accept` args |
| `listMyRequests` | `listMyTickets` | `tickets.ts` |
| `listByRequest` | `listByTicket` | `offers.ts` |
| `sellerName` / `sellerId` | `tutorName` / `tutorId` | Enriched offer objects |
| `buyerId` | `studentId` | Offers table |
| `matchingRecentJobs` | `getRecommendedJobs` | `tickets.ts` |

### Data Fetching Pattern

All data fetching uses Convex's reactive `useQuery` / `useMutation` hooks:
- `useQuery(api.module.fn, args)` — auto-subscribes to real-time updates
- `useQuery(api.module.fn, "skip")` — skips the query (useful for conditional fetching)
- `useMutation(api.module.fn)` — returns an async function to call mutations

### Error Handling Pattern

- Backend: throws `ConvexError` or plain `Error` with descriptive messages
- Frontend: catches in try/catch, shows `toast.error()` via Sonner
- Auth failures return `null` (for queries) or throw (for mutations)

### Component Architecture

- **Page components** (in `app/`) handle data fetching and state
- **Reusable components** (in `components/`) receive data as props or fetch their own
- **UI primitives** (in `components/ui/`) are pure, stateless Shadcn components
- **Providers** render no UI — purely manage side effects and context

---

*This document covers every file, function, table, flow, and pattern in the Peer codebase as of March 2, 2026. For updates, re-run the infrastructure scan or manually append sections as features are added.*

---

## 21. Crash Courses Feature

### Overview

Crash Courses are **group exam-prep sessions** tied to a university course. They support two origination modes:

- **Supply-side (tutor-offered):** A tutor creates a fully specified crash course with pricing, date, time, duration, and location. Students enroll directly at the stated price. Simpler lifecycle.
- **Demand-side (student-requested):** A student requests a crash course with topic needs and optional budget preferences. Tutors submit full proposals (price, schedule, topics). Interested students vote on their preferred tutor. The selected tutor's quote becomes the course's price — students then confirm at that price before the course is locked in.

### Files Created

| File | Description |
|---|---|
| `convex/crash_courses.ts` | Full backend (~1400 lines): 12 mutations, 10 queries, 3 internal mutations (cron handlers) |
| `components/crash-courses/CrashCourseCard.tsx` | Browse grid card component |
| `components/crash-courses/EnrollmentBar.tsx` | Enrollment progress bar |
| `components/crash-courses/ApplicationCard.tsx` | Tutor application card with voting UI |
| `components/crash-courses/VotingSection.tsx` | Voting interface wrapping ApplicationCards |
| `app/crash-courses/page.tsx` | Browse page with tabs (All/Requested/Offered/My Courses) and filters |
| `app/crash-courses/new/page.tsx` | 5-step multi-form wizard (Type → Basics → Topics → Schedule/Preferences → Review) with progress bar, step indicators, per-step validation, and inline edit from review |
| `app/crash-courses/[id]/page.tsx` | Detail page with full lifecycle controls (enroll, vote, apply, confirm, start, complete, cancel) |

### Files Modified

| File | Change |
|---|---|
| `convex/schema.ts` | Added 4 tables (`crash_courses`, `crash_course_enrollments`, `crash_course_applications`, `crash_course_votes`), extended `notifications.type` union with 6 types, extended `reviews` with optional `crashCourseId` and `"crash_course_review"` type, made `ticketId` optional in reviews |
| `convex/crons.ts` | Added 3 cron jobs: auto-close voting, auto-expire confirmations, reminders |
| `components/layout/Navbar.tsx` | Added "Crash Courses" link for both student and tutor roles |
| `components/notifications/NotificationDropdown.tsx` | Added routing and display labels for 6 crash course notification types |
| `components/search/CommandSearch.tsx` | Added "Crash Courses" and "Create Crash Course" to command palette |
| `app/dashboard/buyer/page.tsx` | Added "Upcoming Crash Courses" widget using `getUpcoming` query |
| `app/dashboard/seller/page.tsx` | Added "My Crash Courses" widget using `getUpcoming` query |

### Key Design Decisions

1. **Single table for both origins:** `crash_courses` uses an `origin` field ("demand" / "supply") rather than separate tables. Supply-side courses have pricing/scheduling populated at creation; demand-side courses have those fields populated from the winning tutor's quote.

2. **"Confirming" phase:** After a tutor is selected for a demand-side course, there's an intermediate "confirming" status where students see the final price and must actively confirm. This prevents students from being locked into a price they didn't agree to.

3. **Vote-then-confirm pattern:** Students first vote on their preferred tutor (considering price, schedule, pitch), then once the winner is selected, they see the concrete price and confirm enrollment. This is more fair than first-come-first-served.

4. **Cron-based auto-progression:** Voting and confirmation phases have deadlines enforced by cron jobs. If the creator doesn't act, the system auto-selects the top-voted tutor and auto-locks confirmations.

5. **Dashboard integration:** Both buyer and seller dashboards show an "Upcoming Crash Courses" widget pulling from `getUpcoming`, which returns crash courses where the user is enrolled/teaching and the course is confirmed or in progress.
