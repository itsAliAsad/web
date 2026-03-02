import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
    "check-idle-tutors",
    { minutes: 10 },
    internal.tutor_profiles.checkIdleTutors
);

// Crash Courses: auto-close voting when deadline passes
crons.interval(
    "auto-close-crash-course-voting",
    { minutes: 30 },
    internal.crash_courses.autoCloseVoting
);

// Crash Courses: auto-expire confirmations when deadline passes
crons.interval(
    "auto-expire-crash-course-confirmations",
    { minutes: 30 },
    internal.crash_courses.autoExpireConfirmations
);

// Crash Courses: send reminders 1 hour before session
crons.interval(
    "crash-course-reminders",
    { minutes: 30 },
    internal.crash_courses.sendReminders
);

export default crons;
