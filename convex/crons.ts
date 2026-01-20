import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
    "check-idle-tutors",
    { minutes: 10 },
    internal.tutor_profiles.checkIdleTutors
);

export default crons;
