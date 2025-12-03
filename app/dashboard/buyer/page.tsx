"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, DollarSign, FileText, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { SpendingChart } from "@/components/dashboard/SpendingChart";

export default function BuyerDashboard() {
    const requests = useQuery(api.requests.listMyRequests, {});
    const offers = useQuery(api.offers.listOffersForBuyer, {});

    if (requests === undefined || offers === undefined) {
        return (
            <div className="container mx-auto py-10">
                <div className="flex justify-between items-center mb-8">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                </div>
            </div>
        );
    }

    const activeRequestsCount = requests.filter(r => r.status === "open" || r.status === "in_progress").length;
    const totalSpent = requests
        .filter(r => r.status === "completed")
        .reduce((acc, curr) => acc + curr.budget, 0);

    const pendingOffers = offers.filter(o => o.status === "pending");

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Buyer Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Manage your requests and offers.</p>
                </div>
                <Link href="/requests/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Post a Request
                    </Button>
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mb-8">
                <Card className="col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeRequestsCount}</div>
                        <p className="text-xs text-muted-foreground">
                            {requests.length} total requests posted
                        </p>
                    </CardContent>
                </Card>
                <Card className="col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Offers Received</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{offers.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {pendingOffers.length} pending review
                        </p>
                    </CardContent>
                </Card>
                <div className="col-span-3">
                    <SpendingChart />
                </div>
            </div>

            {pendingOffers.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Offers Waiting for Action</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {pendingOffers.map((offer) => (
                            <Card key={offer._id} className="border-l-4 border-l-primary">
                                <CardHeader>
                                    <CardTitle className="text-lg flex justify-between items-start">
                                        <span>Offer for: {offer.requestTitle}</span>
                                        <Badge variant="outline">PKR {offer.price}</Badge>
                                    </CardTitle>
                                    <CardDescription>
                                        Status: <span className="font-medium text-primary capitalize">{offer.status}</span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Link href={`/requests/${offer.requestId}`}>
                                        <Button variant="secondary" className="w-full">View Request & Offer</Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">My Recent Requests</h2>
                {requests.length === 0 ? (
                    <EmptyState
                        icon={Plus}
                        title="No requests yet"
                        description="You haven't posted any requests. Create one to get started!"
                        action={
                            <Link href="/requests/new">
                                <Button>Post a Request</Button>
                            </Link>
                        }
                    />
                ) : (
                    <div className="grid gap-4">
                        {requests.slice(0, 5).map((request) => (
                            <Card key={request._id} className="hover:bg-muted/50 transition-colors">
                                <CardHeader className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="text-base">
                                                <Link href={`/requests/${request._id}`} className="hover:underline">
                                                    {request.title}
                                                </Link>
                                            </CardTitle>
                                            <CardDescription className="line-clamp-1">
                                                {request.description}
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge variant={request.status === "open" ? "default" : "secondary"}>
                                                {request.status}
                                            </Badge>
                                            <span className="text-sm font-medium">PKR {request.budget}</span>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
