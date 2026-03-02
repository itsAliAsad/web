"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar, Clock, GraduationCap, Vote, DollarSign } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface CrashCourseCardProps {
    crashCourse: {
        _id: string;
        origin: "demand" | "supply";
        title: string;
        examType: string;
        status: string;
        currentEnrollment: number;
        maxEnrollment: number;
        pricePerStudent?: number;
        budgetPerStudent?: number;
        scheduledAt?: number;
        duration?: number;
        topics: string[];
        createdAt: number;
        course: { code: string; name: string } | null;
        creatorName: string;
        applicationCount?: number;
    };
}

const statusConfig: Record<string, { label: string; color: string }> = {
    open: { label: "Open", color: "bg-emerald-500/15 text-emerald-700" },
    requesting: { label: "Requesting", color: "bg-amber-500/15 text-amber-700" },
    voting: { label: "Voting", color: "bg-blue-500/15 text-blue-700" },
    confirming: { label: "Confirming", color: "bg-violet-500/15 text-violet-700" },
    confirmed: { label: "Confirmed", color: "bg-emerald-500/15 text-emerald-700" },
    in_progress: { label: "In Progress", color: "bg-teal-500/15 text-teal-700" },
    completed: { label: "Completed", color: "bg-gray-500/15 text-gray-700" },
    cancelled: { label: "Cancelled", color: "bg-red-500/15 text-red-700" },
};

const examTypeLabels: Record<string, string> = {
    quiz: "Quiz",
    midterm: "Midterm",
    final: "Final",
    other: "Other",
};

export default function CrashCourseCard({ crashCourse }: CrashCourseCardProps) {
    const status = statusConfig[crashCourse.status] ?? statusConfig.open;

    return (
        <Link href={`/crash-courses/${crashCourse._id}`} className="block group">
            <Card className="glass-card border-none overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
                <CardContent className="p-5">
                    {/* Header: Status + Exam Type */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Badge className={`${status.color} border-none text-xs font-semibold`}>
                                {status.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                                {examTypeLabels[crashCourse.examType] ?? crashCourse.examType}
                            </Badge>
                        </div>
                        {crashCourse.origin === "demand" ? (
                            <Badge variant="outline" className="text-xs bg-amber-500/5 text-amber-700 border-amber-200">
                                🔥 Requested
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-xs bg-blue-500/5 text-blue-700 border-blue-200">
                                📚 Offered
                            </Badge>
                        )}
                    </div>

                    {/* Title + Course Code */}
                    <h3 className="font-semibold text-foreground group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors line-clamp-1 mb-1">
                        {crashCourse.title}
                    </h3>
                    {crashCourse.course && (
                        <p className="text-sm text-muted-foreground mb-3">
                            {crashCourse.course.code} — {crashCourse.course.name}
                        </p>
                    )}

                    {/* Topics preview */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {crashCourse.topics.slice(0, 3).map((topic) => (
                            <span
                                key={topic}
                                className="text-xs px-2 py-0.5 rounded-full bg-foreground/5 text-muted-foreground"
                            >
                                {topic}
                            </span>
                        ))}
                        {crashCourse.topics.length > 3 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-foreground/5 text-muted-foreground">
                                +{crashCourse.topics.length - 3} more
                            </span>
                        )}
                    </div>

                    {/* Footer Meta */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                {crashCourse.origin === "supply"
                                    ? `${crashCourse.currentEnrollment}/${crashCourse.maxEnrollment}`
                                    : `${crashCourse.currentEnrollment} interested`}
                            </span>

                            {crashCourse.scheduledAt && (
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {new Date(crashCourse.scheduledAt).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                    })}
                                </span>
                            )}

                            {crashCourse.duration && (
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {crashCourse.duration >= 60
                                        ? `${Math.floor(crashCourse.duration / 60)}h${crashCourse.duration % 60 ? ` ${crashCourse.duration % 60}m` : ""}`
                                        : `${crashCourse.duration}m`}
                                </span>
                            )}

                            {crashCourse.origin === "demand" && crashCourse.applicationCount !== undefined && crashCourse.applicationCount > 0 && (
                                <span className="flex items-center gap-1">
                                    <GraduationCap className="h-3.5 w-3.5" />
                                    {crashCourse.applicationCount} applied
                                </span>
                            )}
                        </div>

                        {/* Price */}
                        <span className="font-semibold text-foreground flex items-center gap-1">
                            {crashCourse.pricePerStudent ? (
                                <>PKR {crashCourse.pricePerStudent.toLocaleString()}</>
                            ) : crashCourse.budgetPerStudent ? (
                                <span className="text-muted-foreground">~PKR {crashCourse.budgetPerStudent.toLocaleString()}</span>
                            ) : (
                                <span className="text-muted-foreground">TBD</span>
                            )}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
