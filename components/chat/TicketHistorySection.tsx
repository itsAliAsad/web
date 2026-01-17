"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface TicketHistorySectionProps {
    tutorId: Id<"users">;
}

export default function TicketHistorySection({ tutorId }: TicketHistorySectionProps) {
    const history = useQuery(api.tickets.getHistoryWithTutor, { tutorId });

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "resolved":
                return {
                    variant: "default" as const,
                    icon: CheckCircle2,
                    className: "bg-teal-500/10 text-teal-700 border-teal-500/20 dark:bg-teal-500/20 dark:text-teal-400"
                };
            case "in_progress":
            case "in_session":
                return {
                    variant: "secondary" as const,
                    icon: Clock,
                    className: "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400"
                };
            case "open":
                return {
                    variant: "outline" as const,
                    icon: AlertCircle,
                    className: ""
                };
            default:
                return {
                    variant: "outline" as const,
                    icon: FileText,
                    className: ""
                };
        }
    };

    if (history === undefined) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-center space-y-2">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                    <p className="text-xs text-muted-foreground">Loading history...</p>
                </div>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Ticket History
                </h3>
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-2">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground mb-0.5">
                            No past work
                        </p>
                        <p className="text-xs text-muted-foreground">
                            No tickets have been worked on together yet
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Ticket History
                </h3>
                <Badge variant="secondary" className="text-xs">
                    {history.length} {history.length === 1 ? "ticket" : "tickets"}
                </Badge>
            </div>

            <div className="space-y-2">
                {history.slice(0, 5).map((ticket: any) => {
                    const statusConfig = getStatusConfig(ticket.status);
                    const StatusIcon = statusConfig.icon;

                    return (
                        <Link
                            key={ticket._id}
                            href={`/requests/${ticket._id}`}
                            className="block group"
                        >
                            <Card className="hover:shadow-md transition-all duration-300 border-muted/50 hover:border-muted">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start gap-3 mb-2">
                                        <span className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors flex-1">
                                            {ticket.title}
                                        </span>
                                        <Badge
                                            variant={statusConfig.variant}
                                            className={`shrink-0 flex items-center gap-1 px-2 py-0.5 ${statusConfig.className}`}
                                        >
                                            <StatusIcon className="h-3 w-3" />
                                            <span className="text-xs capitalize">
                                                {ticket.status.replace('_', ' ')}
                                            </span>
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatDistanceToNow(ticket.createdAt, { addSuffix: true })}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>

            {history.length > 5 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                    +{history.length - 5} more {history.length - 5 === 1 ? "ticket" : "tickets"}
                </p>
            )}
        </div>
    );
}
