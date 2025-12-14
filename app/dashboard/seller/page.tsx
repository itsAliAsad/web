"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search, TrendingUp, ArrowRight, Sparkles, Zap, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { EarningsChart } from "@/components/dashboard/EarningsChart";
import { LottieAnimation } from "@/components/ui/lottie-animation";
import { rocketAnimation } from "@/lib/animations";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function SellerDashboard() {
    const requests = useQuery(api.tickets.listOpen, {});
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

    const completionRate = 98;

    return (
        <div className="container mx-auto py-10 text-foreground">
            {/* Header - Bold, Editorial */}
            <header className="mb-10">
                <div className="flex justify-between items-start">
                    <div className="space-y-2">
                        <h1 className="text-5xl font-bold tracking-tight text-foreground">
                            Dashboard
                        </h1>
                        <p className="text-lg text-muted-foreground font-medium">
                            Your earnings & active work at a glance.
                        </p>
                    </div>
                    <Link href="/search">
                        <Button className="h-12 px-6 rounded-full bg-foreground text-background hover:bg-foreground/90 font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                            <Search className="mr-2 h-4 w-4" />
                            Find Jobs
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Hero KPI Section - Asymmetric Bento Grid */}
            <section className="grid grid-cols-12 gap-4 mb-10">
                {/* HERO: Total Earnings - Takes 2/3 width */}
                <Card className="col-span-12 lg:col-span-8 glass-card shadow-glow-amber border-none overflow-hidden group">
                    <CardContent className="p-8 relative">
                        {/* Abstract decorative element */}
                        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-amber-400/20 via-orange-300/10 to-transparent blur-3xl group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-gradient-to-tr from-teal-400/10 to-transparent blur-2xl" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="h-8 w-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                    <Sparkles className="h-4 w-4 text-amber-600" />
                                </div>
                                <span className="text-sm font-semibold uppercase tracking-wider text-amber-700/80">
                                    Total Earnings
                                </span>
                            </div>

                            <div className="flex items-baseline gap-4">
                                <span className="text-6xl lg:text-7xl font-bold tracking-tighter text-foreground animate-count">
                                    PKR {totalEarnings.toLocaleString()}
                                </span>
                                <Badge className="bg-emerald-500/15 text-emerald-700 border-none font-semibold px-3 py-1.5 text-sm">
                                    <TrendingUp className="h-3.5 w-3.5 mr-1" />
                                    +12% this month
                                </Badge>
                            </div>

                            <p className="text-muted-foreground mt-4 text-base">
                                You're {totalEarnings > 0 ? "doing great!" : "just getting started."} Keep landing those gigs.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Supporting KPIs - Stacked on right */}
                <div className="col-span-12 lg:col-span-4 grid grid-rows-2 gap-4">
                    {/* Active Jobs */}
                    <Card className="glass-card shadow-glow-coral border-none overflow-hidden group">
                        <CardContent className="p-6 h-full flex flex-col justify-between relative">
                            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-rose-400/15 to-transparent blur-2xl group-hover:scale-125 transition-transform duration-500" />

                            <div className="flex items-center gap-2 relative z-10">
                                <div className="h-7 w-7 rounded-lg bg-rose-500/15 flex items-center justify-center">
                                    <Zap className="h-3.5 w-3.5 text-rose-600" />
                                </div>
                                <span className="text-xs font-semibold uppercase tracking-wider text-rose-700/70">
                                    Active Jobs
                                </span>
                            </div>

                            <div className="flex items-baseline gap-3 relative z-10">
                                <span className="text-5xl font-bold tracking-tighter text-foreground">
                                    {activeJobsCount}
                                </span>
                                <span className="text-sm font-medium text-muted-foreground">
                                    in progress
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Completion Rate */}
                    <Card className="glass-card shadow-glow-teal border-none overflow-hidden group">
                        <CardContent className="p-6 h-full flex flex-col justify-between relative">
                            <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-tl from-teal-400/15 to-transparent blur-2xl group-hover:scale-125 transition-transform duration-500" />

                            <div className="flex items-center gap-2 relative z-10">
                                <div className="h-7 w-7 rounded-lg bg-teal-500/15 flex items-center justify-center">
                                    <Target className="h-3.5 w-3.5 text-teal-600" />
                                </div>
                                <span className="text-xs font-semibold uppercase tracking-wider text-teal-700/70">
                                    Success Rate
                                </span>
                            </div>

                            <div className="flex items-baseline gap-3 relative z-10">
                                <span className="text-5xl font-bold tracking-tighter text-foreground">
                                    {completionRate}%
                                </span>
                                <Badge className="bg-teal-500/15 text-teal-700 border-none font-medium text-xs">
                                    Top Rated
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Main Content: Active Jobs + Chart */}
            <section className="grid grid-cols-12 gap-6 mb-10">
                {/* Active Jobs Table */}
                <Card className="col-span-12 lg:col-span-7 glass-card border-none">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-2xl font-bold tracking-tight">Active Jobs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {myOffers.filter(o => o.status === "accepted").length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <LottieAnimation animationData={rocketAnimation} className="h-40 w-40 mb-4 opacity-80" />
                                <h3 className="text-xl font-semibold text-foreground mb-2">No active jobs yet</h3>
                                <p className="text-muted-foreground max-w-sm mb-6 text-base">
                                    You don't have any jobs in progress. Browse available requests to get started.
                                </p>
                                <Link href="/search">
                                    <Button className="rounded-full px-8 h-11 bg-foreground text-background hover:bg-foreground/90 font-semibold">
                                        Find Your First Job
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {myOffers.filter(o => o.status === "accepted").map((offer, index) => (
                                    <Link
                                        key={offer._id}
                                        href={`/requests/${offer.ticketId || offer.requestId}`}
                                        className="block group"
                                    >
                                        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-transparent hover:border-border/50 transition-all duration-300 hover:shadow-md">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-foreground group-hover:text-amber-700 transition-colors truncate">
                                                    {offer.requestTitle}
                                                </h4>
                                                <p className="text-sm text-muted-foreground">Due: Oct 24, 2025</p>
                                            </div>
                                            <Badge className="bg-amber-500/15 text-amber-700 border-none font-medium">
                                                {offer.status}
                                            </Badge>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Earnings Chart */}
                <div className="col-span-12 lg:col-span-5">
                    <EarningsChart />
                </div>
            </section>

            {/* Recommended Jobs - Magazine Style */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold tracking-tight">Recommended for You</h2>
                    <Link href="/search">
                        <Button variant="ghost" className="text-muted-foreground hover:text-foreground font-medium">
                            View all <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                {requests.length === 0 ? (
                    <EmptyState
                        icon={Search}
                        title="No jobs available"
                        description="There are no open requests at the moment. Check back later!"
                        action={
                            <Link href="/search">
                                <Button variant="outline" className="rounded-full">Browse All Jobs</Button>
                            </Link>
                        }
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {requests.slice(0, 6).map((request, index) => (
                            <Link key={request._id} href={`/requests/${request._id}`} className="block group">
                                <Card className="glass-card border-none h-full transition-all duration-300 hover:shadow-lg overflow-hidden relative">
                                    {/* Hover CTA - slides in from right */}
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out">
                                        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium shadow-lg">
                                            View Details
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </span>
                                    </div>

                                    <CardContent className="p-5 flex items-start gap-4 transition-all duration-300 group-hover:pr-32">
                                        {/* Subtle monochromatic avatar */}
                                        <div className="h-11 w-11 rounded-xl bg-foreground/5 border border-foreground/5 flex items-center justify-center shrink-0 group-hover:bg-foreground/10 transition-colors">
                                            <span className="text-lg font-semibold text-foreground/60 group-hover:text-foreground/80 transition-colors">
                                                {request.title.charAt(0).toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <h3 className="font-semibold text-base text-foreground group-hover:text-foreground/80 transition-colors line-clamp-1">
                                                        {request.title}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                                                        {request.description}
                                                    </p>
                                                </div>
                                                {/* Price - fades out on hover */}
                                                <div className="text-right shrink-0 transition-opacity duration-300 group-hover:opacity-0">
                                                    <span className="block text-lg font-bold text-foreground">
                                                        PKR {(request.budget || 0).toLocaleString()}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">Fixed</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 mt-2.5">
                                                <Badge variant="secondary" className="text-xs bg-foreground/5 text-muted-foreground font-normal border-none">
                                                    General
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
