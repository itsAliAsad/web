"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, FileText, Calendar, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export default function MyRequestsPage() {
    const requests = useQuery(api.tickets.listMyRequests, {});

    if (requests === undefined) {
        return (
            <div className="container mx-auto py-10">
                <div className="flex justify-between items-center mb-8">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 max-w-5xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Requests</h1>
                    <p className="text-muted-foreground mt-1">View and manage all your posted requests.</p>
                </div>
                <Link href="/requests/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Post a Request
                    </Button>
                </Link>
            </div>

            {requests.length === 0 ? (
                <EmptyState
                    icon={FileText}
                    title="No requests found"
                    description="You haven't posted any requests yet."
                    action={
                        <Link href="/requests/new">
                            <Button>Post a Request</Button>
                        </Link>
                    }
                />
            ) : (
                <div className="grid gap-4">
                    {requests.map((request) => (
                        <Card key={request._id} className="hover:bg-muted/50 transition-colors">
                            <CardHeader className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <CardTitle className="text-xl">
                                                <Link href={`/requests/${request._id}`} className="hover:underline">
                                                    {request.title}
                                                </Link>
                                            </CardTitle>
                                            <Badge variant={
                                                request.status === "open" ? "default" :
                                                    request.status === "in_progress" ? "secondary" :
                                                        request.status === "resolved" ? "outline" : "destructive"
                                            }>
                                                {request.status.replace("_", " ")}
                                            </Badge>
                                        </div>
                                        <CardDescription className="line-clamp-2 max-w-2xl">
                                            {request.description}
                                        </CardDescription>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span>Posted {formatDistanceToNow(request._creationTime)} ago</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <DollarSign className="h-3.5 w-3.5" />
                                                <span>Budget: PKR {request.budget}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button variant="outline" asChild>
                                            <Link href={`/requests/${request._id}`}>View Details</Link>
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
