"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { FileText } from "lucide-react";

interface TicketHistorySectionProps {
    tutorId: Id<"users">;
}

export default function TicketHistorySection({ tutorId }: TicketHistorySectionProps) {
    const history = useQuery(api.tickets.getHistoryWithTutor, { tutorId });

    if (history === undefined) {
        return <div className="text-sm text-muted-foreground">Loading history...</div>;
    }

    if (history.length === 0) {
        return (
            <div className="text-sm text-muted-foreground py-4 text-center">
                No previous work together.
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Past Work ({history.length})
            </h4>
            <div className="space-y-2">
                {history.slice(0, 5).map((ticket: any) => (
                    <Link
                        key={ticket._id}
                        href={`/requests/${ticket._id}`}
                        className="block p-2 rounded-md hover:bg-accent transition-colors"
                    >
                        <div className="flex justify-between items-start gap-2">
                            <span className="text-sm font-medium line-clamp-1">
                                {ticket.title}
                            </span>
                            <Badge
                                variant={ticket.status === "resolved" ? "secondary" : "outline"}
                                className="shrink-0"
                            >
                                {ticket.status}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(ticket.createdAt, { addSuffix: true })}
                        </p>
                    </Link>
                ))}
            </div>
            {history.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                    +{history.length - 5} more
                </p>
            )}
        </div>
    );
}
