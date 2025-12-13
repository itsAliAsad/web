"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search, DollarSign, Briefcase, TrendingUp, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { EarningsChart } from "@/components/dashboard/EarningsChart";
import { GradientCard } from "@/components/ui/gradient-card";

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

    // Mock completion rate
    const completionRate = 98;

    return (
        <div className="container mx-auto py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
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

            {/* 1. Top KPI Strip (Compact Row) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* Total Earnings */}
                <Card className="glass-card relative overflow-hidden border-none bg-gradient-to-br from-blue-500/10 to-blue-600/10 dark:from-blue-500/20 dark:to-blue-600/20">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
                    <CardContent className="p-6 relative z-10">
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">Total Earnings</span>
                            <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-foreground">PKR {totalEarnings.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Active Jobs */}
                <Card className="glass-card relative overflow-hidden border-none bg-gradient-to-br from-indigo-500/10 to-purple-600/10 dark:from-indigo-500/20 dark:to-purple-600/20">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
                    <CardContent className="p-6 relative z-10">
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">Active Jobs</span>
                            <Briefcase className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-foreground">{activeJobsCount}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Completion Rate (Mock) */}
                <Card className="glass-card relative overflow-hidden border-none bg-gradient-to-br from-emerald-500/10 to-teal-600/10 dark:from-emerald-500/20 dark:to-teal-600/20">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                    <CardContent className="p-6 relative z-10">
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Completion Rate</span>
                            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-foreground">{completionRate}%</span>
                            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">Top Rated</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 2. Main Content Grid (2/3 Left, 1/3 Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Left Column: Active Jobs (Action Table) */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Active Jobs</CardTitle>
                    </CardHeader>
                    <CardContent>
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
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm">
                                    <thead className="[&_tr]:border-b">
                                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Job Title</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Status</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Due Date</th>
                                            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="[&_tr:last-child]:border-0">
                                        {myOffers.filter(o => o.status === "accepted").map((offer) => (
                                            <tr key={offer._id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                <td className="p-4 align-middle font-medium">
                                                    <Link href={`/requests/${offer.requestId}`} className="hover:underline">
                                                        {offer.requestTitle}
                                                    </Link>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <Badge variant="outline" className="capitalize bg-primary/10 text-primary border-primary/20">
                                                        {offer.status}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 align-middle text-muted-foreground">
                                                    {/* Mock Due Date */}
                                                    Oct 24, 2025
                                                </td>
                                                <td className="p-4 align-middle text-right">
                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                                                        <Link href={`/requests/${offer.requestId}`}>
                                                            <span className="sr-only">Open menu</span>
                                                            <ArrowRight className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right Column: Earnings Chart */}
                <div className="lg:col-span-1 space-y-4">

                    <div className="h-full">
                        <EarningsChart />
                    </div>
                </div>
            </div>

            {/* 3. Bottom Section: Recommended Jobs */}
            <div className="mb-8">
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
                    <div className="grid gap-3">
                        {requests.slice(0, 5).map((request) => (
                            <Card key={request._id} className="hover:bg-muted/40 transition-all group">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-base truncate">
                                                    {request.title}
                                                </h3>
                                                {/* Mock Category Tag */}
                                                <Badge variant="secondary" className="text-xs font-normal text-muted-foreground">
                                                    General
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-1">
                                                {request.description}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-6 shrink-0 border-l pl-6 h-10">
                                            <span className="font-bold text-base whitespace-nowrap">
                                                PKR {request.budget}
                                            </span>
                                            <Button size="sm" className="w-[80px]" asChild>
                                                <Link href={`/requests/${request._id}`}>View</Link>
                                            </Button>
                                        </div>
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
