"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, MapPin, Star, Check, Shield, Users } from "lucide-react";

interface ApplicationCardProps {
    application: {
        _id: string;
        pitch: string;
        proposedPrice: number;
        proposedDate: number;
        proposedDuration: number;
        proposedLocation?: string;
        proposedMinEnrollment?: number;
        proposedMaxEnrollment?: number;
        topicsCovered: string[];
        voteCount: number;
        status: string;
        tutor: {
            _id: string;
            name: string;
            image?: string;
            reputation: number;
            isVerified?: boolean;
            isOnline: boolean;
            completedJobs: number;
            expertiseLevel: string | null;
        } | null;
    };
    rank: number;
    totalVotes: number;
    requestedTopics: string[];
    hasVoted: boolean;
    votedForThis: boolean;
    canVote: boolean;
    onVote: (applicationId: string) => void;
    isVoting?: boolean;
}

export default function ApplicationCard({
    application,
    rank,
    totalVotes,
    requestedTopics,
    hasVoted,
    votedForThis,
    canVote,
    onVote,
    isVoting,
}: ApplicationCardProps) {
    const tutor = application.tutor;
    const votePercentage = totalVotes > 0 ? (application.voteCount / totalVotes) * 100 : 0;
    const topicCoverage = requestedTopics.length > 0
        ? application.topicsCovered.filter((t) => requestedTopics.includes(t)).length
        : application.topicsCovered.length;

    return (
        <Card className={`glass-card border-none overflow-hidden transition-all ${votedForThis ? "ring-2 ring-amber-500/50" : ""}`}>
            <CardContent className="p-5">
                {/* Header: Rank + Tutor Info */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {rank <= 3 && (
                            <span className="text-lg font-bold text-muted-foreground">
                                {rank === 1 ? "🏆" : rank === 2 ? "🥈" : "🥉"} #{rank}
                            </span>
                        )}
                        {rank > 3 && (
                            <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
                        )}

                        <Avatar className="h-10 w-10">
                            <AvatarImage src={tutor?.image} />
                            <AvatarFallback>{tutor?.name?.charAt(0) ?? "?"}</AvatarFallback>
                        </Avatar>

                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground">{tutor?.name ?? "Unknown"}</span>
                                {tutor?.isVerified && (
                                    <Shield className="h-4 w-4 text-blue-500" />
                                )}
                                {tutor?.isOnline && (
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                <span>{tutor?.reputation?.toFixed(1) ?? "N/A"}</span>
                                {tutor?.expertiseLevel && (
                                    <>
                                        <span>·</span>
                                        <span>{tutor.expertiseLevel} in course</span>
                                    </>
                                )}
                                <span>·</span>
                                <span>{tutor?.completedJobs ?? 0} sessions</span>
                            </div>
                        </div>
                    </div>

                    {/* Vote button */}
                    {canVote && (
                        <Button
                            size="sm"
                            variant={votedForThis ? "default" : "outline"}
                            onClick={() => onVote(application._id)}
                            disabled={isVoting || votedForThis}
                            className={`rounded-full ${votedForThis ? "bg-amber-600 hover:bg-amber-700" : ""}`}
                        >
                            {votedForThis ? (
                                <>
                                    <Check className="h-4 w-4 mr-1" /> Voted
                                </>
                            ) : (
                                "Vote"
                            )}
                        </Button>
                    )}

                    {application.status === "selected" && (
                        <Badge className="bg-emerald-500/15 text-emerald-700 border-none">
                            ✅ Selected
                        </Badge>
                    )}
                    {application.status === "rejected" && (
                        <Badge className="bg-red-500/15 text-red-700 border-none">
                            Not Selected
                        </Badge>
                    )}
                </div>

                {/* Pitch */}
                <p className="text-sm text-foreground/80 mb-4 line-clamp-3">
                    &ldquo;{application.pitch}&rdquo;
                </p>

                {/* Quote Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className="flex items-center gap-1.5 text-sm">
                        <span className="font-bold text-foreground">PKR {application.proposedPrice.toLocaleString()}</span>
                        <span className="text-muted-foreground">/student</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(application.proposedDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                        })}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {application.proposedDuration >= 60
                            ? `${Math.floor(application.proposedDuration / 60)}h${application.proposedDuration % 60 ? ` ${application.proposedDuration % 60}m` : ""}`
                            : `${application.proposedDuration}m`}
                    </div>
                    {application.proposedLocation && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            {application.proposedLocation}
                        </div>
                    )}
                    {(application.proposedMinEnrollment || application.proposedMaxEnrollment) && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />
                            {application.proposedMinEnrollment && application.proposedMaxEnrollment
                                ? `${application.proposedMinEnrollment}–${application.proposedMaxEnrollment} students`
                                : application.proposedMinEnrollment
                                    ? `Min ${application.proposedMinEnrollment} students`
                                    : `Max ${application.proposedMaxEnrollment} students`}
                        </div>
                    )}
                </div>

                {/* Topics Covered */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {application.topicsCovered.map((topic) => (
                        <span
                            key={topic}
                            className={`text-xs px-2 py-0.5 rounded-full ${
                                requestedTopics.includes(topic)
                                    ? "bg-emerald-500/10 text-emerald-700"
                                    : "bg-foreground/5 text-muted-foreground"
                            }`}
                        >
                            {topic}
                        </span>
                    ))}
                    {requestedTopics.length > 0 && (
                        <span className="text-xs text-muted-foreground ml-1">
                            Covers {topicCoverage} of {requestedTopics.length}
                        </span>
                    )}
                </div>

                {/* Vote Bar */}
                {totalVotes > 0 && (
                    <div className="space-y-1">
                        <Progress value={votePercentage} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                            {application.voteCount} vote{application.voteCount !== 1 ? "s" : ""} ({votePercentage.toFixed(0)}%)
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
