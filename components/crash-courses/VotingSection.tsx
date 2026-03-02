"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import ApplicationCard from "./ApplicationCard";
import { toast } from "sonner";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface VotingSectionProps {
    crashCourseId: Id<"crash_courses">;
    topics: string[];
    votingDeadline?: number;
    status: string;
    isEnrolled: boolean;
}

export default function VotingSection({
    crashCourseId,
    topics,
    votingDeadline,
    status,
    isEnrolled,
}: VotingSectionProps) {
    const applications = useQuery(api.crash_courses.getApplications, { crashCourseId });
    const myVote = useQuery(api.crash_courses.getMyVote, { crashCourseId });
    const vote = useMutation(api.crash_courses.vote);
    const [votingAppId, setVotingAppId] = useState<string | null>(null);

    const canVote = status === "voting" && isEnrolled;
    const totalVotes = applications?.reduce((sum, app) => sum + app.voteCount, 0) ?? 0;

    const handleVote = async (applicationId: string) => {
        setVotingAppId(applicationId);
        try {
            await vote({ applicationId: applicationId as Id<"crash_course_applications"> });
            toast.success("Vote cast successfully!");
        } catch (error: any) {
            toast.error(error.message ?? "Failed to vote");
        } finally {
            setVotingAppId(null);
        }
    };

    if (!applications) {
        return (
            <div className="space-y-4">
                <div className="h-32 bg-foreground/5 rounded-xl animate-pulse" />
                <div className="h-32 bg-foreground/5 rounded-xl animate-pulse" />
            </div>
        );
    }

    const pendingApplications = applications.filter((a) => a.status === "pending" || a.status === "selected");

    return (
        <div className="space-y-6">
            {/* Voting Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-foreground">
                        {status === "voting"
                            ? "Vote for a Tutor"
                            : status === "requesting"
                                ? "Tutor Applications"
                                : "Selected Tutor"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {pendingApplications.length} application{pendingApplications.length !== 1 ? "s" : ""}
                        {totalVotes > 0 && ` · ${totalVotes} vote${totalVotes !== 1 ? "s" : ""} cast`}
                    </p>
                </div>

                {votingDeadline && status === "voting" && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-blue-500/10 px-3 py-1.5 rounded-full">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span>
                            Closes {formatDistanceToNow(new Date(votingDeadline), { addSuffix: true })}
                        </span>
                    </div>
                )}
            </div>

            {/* Applications */}
            {pendingApplications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <p>No applications yet. Tutors will apply soon!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {pendingApplications.map((app, index) => (
                        <ApplicationCard
                            key={app._id}
                            application={app}
                            rank={index + 1}
                            totalVotes={totalVotes}
                            requestedTopics={topics}
                            hasVoted={!!myVote}
                            votedForThis={myVote?.applicationId === app._id}
                            canVote={canVote}
                            onVote={handleVote}
                            isVoting={votingAppId === app._id}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
