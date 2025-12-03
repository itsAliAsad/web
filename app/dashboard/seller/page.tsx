"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search, DollarSign, Briefcase, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { EarningsChart } from "@/components/dashboard/EarningsChart";

export default function SellerDashboard() {
    const requests = useQuery(api.requests.listOpen, {});
    const myOffers = useQuery(api.offers.listMyOffers, {});

    if (requests === undefined || myOffers === undefined) {
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

    const activeJobsCount = myOffers.filter(o => o.status === "accepted").length;
    const totalEarnings = myOffers
        .filter(o => o.status === "accepted")
        .reduce((acc, curr) => acc + curr.price, 0);

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Seller Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Manage your jobs and earnings.</p>
                </div>
                <Link href="/search">
                    <Button>
                        <Search className="mr-2 h-4 w-4" />
                        Find Jobs
                    </Button>
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mb-8">
                <Card className="col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeJobsCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Jobs in progress
                        </p>
                    </CardContent>
                </Card>
                <Card className="col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">PKR {totalEarnings.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            From {activeJobsCount} accepted offers
                        </p>
                    </CardContent>
                </Card>
                <div className="col-span-3">
                    <EarningsChart />
                </div>
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Active Jobs</h2>
                {myOffers.filter(o => o.status === "accepted").length === 0 ? (
                    <EmptyState
                        icon={Briefcase}
                        title="No active jobs"
                        description="You don't have any active jobs at the moment."
                        action={
                            <Link href="/search">
                                <Button variant="outline">Find Jobs</Button>
                            </Link>
                        }
                    />
                ) : (
                    <div className="grid gap-4">
                        {myOffers.filter(o => o.status === "accepted").map((offer) => (
                            <Card key={offer._id} className="hover:bg-muted/50 transition-colors border-l-4 border-l-primary">
                                <CardHeader className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="text-base">
                                                <Link href={`/requests/${offer.requestId}`} className="hover:underline">
                                                    Job for: {offer.requestTitle}
                                                </Link>
                                            </CardTitle>
                                            <CardDescription>
                                                Status: <span className="font-medium text-primary capitalize">{offer.status}</span>
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-medium">PKR {offer.price}</span>
                                            <Button size="sm" variant="secondary" asChild>
                                                <Link href={`/requests/${offer.requestId}`}>View Details</Link>
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Recommended Jobs</h2>
                {requests.length === 0 ? (
                    <EmptyState
                        icon={Search}
                        title="No jobs found"
                        description="There are no open requests at the moment. Check back later!"
                        action={
                            <Link href="/search">
                                <Button variant="outline">Browse All Jobs</Button>
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
                                            <span className="text-sm font-medium">PKR {request.budget}</span>
                                            <Button size="sm" variant="secondary" asChild>
                                                <Link href={`/requests/${request._id}`}>View</Link>
                                            </Button>
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
