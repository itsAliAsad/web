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

            {/* 1. Top KPI Strip (Compact Row) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* Total Spent */}
                <Card className="glass-card relative overflow-hidden border-none bg-gradient-to-br from-pink-500/10 to-rose-600/10 dark:from-pink-500/20 dark:to-rose-600/20">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent pointer-events-none" />
                    <CardContent className="p-6 relative z-10">
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <span className="text-sm font-semibold text-pink-900 dark:text-pink-100">Total Spent</span>
                            <DollarSign className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-foreground">PKR {totalSpent.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Active Requests */}
                <Card className="glass-card relative overflow-hidden border-none bg-gradient-to-br from-cyan-500/10 to-blue-600/10 dark:from-cyan-500/20 dark:to-blue-600/20">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
                    <CardContent className="p-6 relative z-10">
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <span className="text-sm font-semibold text-cyan-900 dark:text-cyan-100">Active Requests</span>
                            <FileText className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-foreground">{activeRequestsCount}</span>
                            <span className="text-xs font-medium text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-900/30 px-2 py-0.5 rounded-full">
                                {requests.length} posted
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Offers Received */}
                <Card className="glass-card relative overflow-hidden border-none bg-gradient-to-br from-violet-500/10 to-purple-600/10 dark:from-violet-500/20 dark:to-purple-600/20">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent pointer-events-none" />
                    <CardContent className="p-6 relative z-10">
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <span className="text-sm font-semibold text-violet-900 dark:text-violet-100">Offers Received</span>
                            <MessageSquare className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-foreground">{offers.length}</span>
                            <span className="text-xs font-medium text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 rounded-full">
                                {pendingOffers.length} pending
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 2. Offers Waiting for Action (High Priority) */}
            {pendingOffers.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Offers Waiting for Action</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {pendingOffers.map((offer) => (
                            <Card key={offer._id} className="glass-card border-l-4 border-l-primary hover:shadow-lg transition-all">
                                <CardHeader>
                                    <div className="flex justify-between items-start gap-4">
                                        <CardTitle className="text-base font-semibold leading-tight">
                                            Offer for: <span className="text-primary">{offer.requestTitle}</span>
                                        </CardTitle>
                                        <Badge variant="outline" className="shrink-0 bg-background/50 backdrop-blur">
                                            PKR {offer.price}
                                        </Badge>
                                    </div>
                                    <CardDescription className="mt-2 text-xs">
                                        Status: <span className="font-medium text-primary capitalize">{offer.status}</span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Link href={`/requests/${offer.requestId}`}>
                                        <Button size="sm" variant="secondary" className="w-full shadow-sm hover:shadow-md transition-all">
                                            Review Offer
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* 3. Main Content Grid (Requests + Chart) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Left Column: Recent Requests */}
                <div className="lg:col-span-2 space-y-4">
                    {requests.length === 0 ? (
                        <>
                            <h2 className="text-xl font-semibold">My Recent Requests</h2>
                            <EmptyState
                                icon={Plus}
                                title="No requests yet"
                                description="You haven't posted any requests. Create one to get started!"
                                action={
                                    <Link href="/requests/new">
                                        <Button className="shadow-lg hover:shadow-xl transition-all">Post a Request</Button>
                                    </Link>
                                }
                            />
                        </>
                    ) : (
                        <Card className="glass-card overflow-hidden h-full">
                            <CardHeader className="pb-2">
                                <CardTitle>My Recent Requests</CardTitle>
                            </CardHeader>
                            <div className="divide-y divide-white/20 dark:divide-white/5">
                                {requests.slice(0, 5).map((request) => (
                                    <Link
                                        key={request._id}
                                        href={`/requests/${request._id}`}
                                        className="block px-6 py-4 hover:bg-white/40 dark:hover:bg-white/5 transition-colors group"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="space-y-1 min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                                                        {request.title}
                                                    </h3>
                                                    <Badge variant={request.status === "open" ? "default" : "secondary"} className="h-5 px-2 text-[10px] uppercase tracking-wide">
                                                        {request.status.replace("_", " ")}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-1">
                                                    {request.description}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-6 shrink-0">
                                                <span className="font-bold text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                                    PKR {request.budget.toLocaleString()}
                                                </span>
                                                <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity -mr-2">
                                                    <span className="sr-only">View</span>
                                                    <Plus className="h-4 w-4 rotate-45" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>

                {/* Right Column: Spending Chart */}
                <div className="lg:col-span-1">
                    <SpendingChart />
                </div>
            </div>
        </div>
    );
}

