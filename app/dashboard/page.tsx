"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export default function DashboardPage() {
    const requests = useQuery(api.tickets.listMyRequests);

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">My Dashboard</h1>
                <Button onClick={() => (window.location.href = "/requests/new")}>
                    Post New Request
                </Button>
            </div>

            <div className="grid gap-6">
                <h2 className="text-xl font-semibold">My Requests</h2>
                {requests === undefined ? (
                    <p>Loading...</p>
                ) : requests.length === 0 ? (
                    <p className="text-gray-500">You haven't posted any requests yet.</p>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {requests.map((request) => (
                            <Card
                                key={request._id}
                                className="cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => window.location.href = `/requests/${request._id}`}
                            >
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg">{request.title}</CardTitle>
                                        <Badge
                                            variant={
                                                request.status === "open"
                                                    ? "default"
                                                    : request.status === "resolved"
                                                        ? "secondary"
                                                        : "outline"
                                            }
                                        >
                                            {request.status}
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        {request.deadline ? `Due: ${new Date(request.deadline).toLocaleDateString()}` : "No deadline"}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                                        {request.description}
                                    </p>
                                    <div className="flex justify-between items-center text-sm font-medium">
                                        <span>PKR {request.budget}</span>
                                        <span className="text-xs text-gray-500">
                                            {request.helpType || request.customCategory || "General"}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
