# Peer: The University Tutoring Network

**Peer** is a next-generation peer-to-peer tutoring and mentorship platform tailored for university students. It bridges the gap between students seeking academic assistance and those capable of providing it, fostering a collaborative learning environment within campus communities.

Powered by a modern tech stack—**Next.js 15**, **Convex**, and **Clerk**—Peer delivers a real-time, secure, and intuitive experience for managing academic requests, coordinating study groups, and building professional connections.

---

## 🌟 Key Features

### 🎯 Smart Request System ("Tickets")

- **Dynamic Ticketing**: Students create detailed "Tickets" for specific needs—whether it's debugging code, understanding a complex theorem, or getting career advice.
- **Context-Aware**: Tickets can be linked to specific university courses (fetched from a verified catalog) or custom categories.
- **Urgency Levels**: Users can flag requests as Low, Medium, or High urgency to prioritize help.

### 👩‍🏫 Tutor Profiles & Offerings

- **Verified Profiles**: Tutors showcase their expertise with verified university credentials, bio, and portfolio items.
- **Reputation System**: A robust rating and review system ensures trust and quality control.
- **Flexible Offerings**: Tutors can send custom offers to open tickets, specifying price, duration, and approach.

### 💬 Real-Time Collaboration

- **Instant Messaging**: Built-in chat for seamless communication between students and tutors.
- **File Sharing**: Securely share assignments, notes, and resources directly within the chat.
- **Status Tracking**: Real-time updates on ticket status (Open -> In Progress -> Resolved).

### 📚 Academic Hub

- **Course Catalog**: A searchable database of university courses to standardize requests and offerings.
- **Study Groups**: Create and join study groups for specific courses to collaborate with peers.
- **Resource Library**: Mentors can upload and share valuable resources and portfolio items.

---

## 🧩 How It Works

Peer operates on a dual-role system where users can act as both **Students (Buyers)** and **Tutors (Sellers)**.

### 1. The Entry Point (Waitlist & Auth)

- **Landing Page**: The root page (`/`) serves as a high-conversion waitlist for pre-launch interest, capturing user emails and roles.
- **Authentication**: Secure login is handled by **Clerk**. Upon authentication, users are synchronized with the **Convex** database via `convex/users.ts`.

### 2. The Dashboard (`/dashboard`)

Once logged in, the experience splits based on the user's current intent:

- **Buyer View**: Focuses on "Spending" and "My Requests". Students can track their active tickets and budget.
- **Seller View**: Focuses on "Earnings" and "Opportunities". Tutors see a feed of recommended tickets using a **smart matching algorithm** (`convex/tickets.ts:matchingRecentJobs`) that scores requests based on:
  - Course expertise match
  - Urgency level
  - Ticket freshness

### 3. The Transaction Flow

1.  **Request**: Student posts a ticket via `/requests/new`.
2.  **Match**: Algorithms surface this ticket to relevant tutors.
3.  **Offer**: Tutor sends an offer.
4.  **Chat**: Parties discuss details in real-time (`/messages`).
5.  **Resolution**: Student accepts offer, session happens, and ticket is marked resolved.

---

## 🏗️ Technical Architecture

Peer is built on a **Serverless, Real-time** architecture ensuring high performance and scalability.

### Core Stack

- **Frontend**: [Next.js 15](https://nextjs.org/) (App Router) for server-side rendering and routing.
- **Language**: [TypeScript](https://www.typescriptlang.org/) for type-safe code across the full stack.
- **Backend & Database**: [Convex](https://www.convex.dev/) provides a reactive backend-as-a-service, handling database storage, real-time subscriptions, and server-side functions.
- **Authentication**: [Clerk](https://clerk.com/) handles secure user management and authentication.
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) with [Shadcn UI](https://ui.shadcn.com/) and [Radix UI](https://www.radix-ui.com/) for accessible, beautiful components.

### Directory Structure

```plaintext
├── app/                  # Next.js App Router
│   ├── (auth)/           # Clerk Authentication routes
│   ├── dashboard/        # Main App Interface
│   │   ├── buyer/        # Student-focused dashboard view
│   │   └── seller/       # Tutor-focused dashboard view
│   ├── requests/         # Ticket lifecycle management
│   ├── page.tsx          # Landing / Waitlist page
│   └── layout.tsx        # Root layout with Providers
├── components/           # React Components
│   ├── dashboard/        # Charts (Recharts) & Stats widgets
│   ├── waitlist/         # Landing page components
│   └── ui/               # Shared primitive components
├── convex/               # Backend Logic (The "API")
│   ├── schema.ts         # Database Schema Definition
│   ├── tickets.ts        # Matching algo & CRUD for tickets
│   ├── users.ts          # Identity sync & profile management
│   └── auth.config.ts    # Clerk integration config
└── lib/                  # Utilities
    └── utils.ts          # Helper functions (cn, formatters)
```

---

## 🚀 Getting Started

Follow these steps to set up Peer locally.

### Prerequisites

- **Node.js 18+**
- **npm**, **pnpm**, or **bun**

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/peer.git
cd peer
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
# or
bun install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory. You will need keys from **Clerk** and **Convex**.

```env
# .env.local

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Convex Backend
CONVEX_DEPLOYMENT=... # Automatically set by `npx convex dev`
NEXT_PUBLIC_CONVEX_URL=... # Automatically set by `npx convex dev`
```

### 4. Start Development Servers

You need to run both the Next.js frontend and the Convex backend.

**Terminal 1 (Frontend):**

```bash
npm run dev
```

**Terminal 2 (Backend):**

```bash
npx convex dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🛡️ Security & Privacy

- **Role-Based Access**: Strict separation between Student, Tutor, and Admin capabilities.
- **Secure Payments**: (In implementation) Secure handling of transaction data.
- **Data Privacy**: User data is protected and only shared with explicit consent (e.g., when accepting an offer).

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on how to submit pull requests, report issues, and request features.

## 📄 License

This project is licensed under the [MIT License](LICENSE).
