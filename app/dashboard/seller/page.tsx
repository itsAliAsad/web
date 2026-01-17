"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Search, TrendingUp, ArrowRight, Sparkles, Zap, Target, Briefcase, ChevronDown, Wallet, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EarningsChart } from "@/components/dashboard/EarningsChart";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function SellerDashboard() {
    const user = useQuery(api.users.currentUser);
    const tutorProfile = useQuery(api.tutor_profiles.getMyProfile);
    const requests = useQuery(api.tickets.listOpen, {});
    const myOffers = useQuery(api.offers.listMyOffers, {});
    const freshJobs = useQuery(api.tickets.matchingRecentJobs);
    const updateStatus = useMutation(api.tutor_profiles.updateOnlineStatus);

    const [statusLoading, setStatusLoading] = useState(false);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    const handleStatusChange = async (status: "online" | "away" | "offline") => {
        setStatusLoading(true);
        try {
            await updateStatus({ status });
            toast.success(`Status updated to ${status}`);
        } catch (error) {
            toast.error("Failed to update status");
        } finally {
            setStatusLoading(false);
        }
    };

    const getStatusDisplay = () => {
        if (!tutorProfile) return { label: "Offline", color: "bg-gray-400" };
        if (tutorProfile.isOnline && tutorProfile.settings?.acceptingRequests) {
            return { label: "Online", color: "bg-emerald-500" };
        }
        return { label: "Offline", color: "bg-gray-400" };
    };

    // Wait for authentication
    if (user === undefined) {
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

    // Require authentication
    if (!user) {
        return (
            <div className="container mx-auto py-20">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">Authentication Required</h1>
                    <p className="text-muted-foreground mb-6">Please sign in to access your dashboard.</p>
                    <Link href="/">
                        <Button>Go to Home</Button>
                    </Link>
                </div>
            </div>
        );
    }

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
    const statusDisplay = getStatusDisplay();

    return (
        <div className="container mx-auto py-10 text-foreground">
            {/* Welcome Header - Simplified */}
            <header className="mb-8">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-2">
                            {getGreeting()}, {user?.name?.split(" ")[0] || "there"}!
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            Ready to help students today?
                        </p>
                    </div>

                    {/* Status Toggle */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="h-11 rounded-full border-foreground/10 bg-white/60 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 backdrop-blur-sm font-semibold"
                                disabled={statusLoading}
                            >
                                <span className={`w-2.5 h-2.5 rounded-full ${statusDisplay.color} mr-2`} />
                                {statusDisplay.label}
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleStatusChange("online")}>
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2" />
                                Online
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange("offline")}>
                                <span className="w-2.5 h-2.5 rounded-full bg-gray-400 mr-2" />
                                Offline
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {/* Bento Grid: Fresh Opportunities (8 cols) + KPI Stack (4 cols) */}
            <section className="grid grid-cols-12 gap-6 mb-10">
                {/* Fresh Opportunities - Hero Card (8 cols) */}
                <Card className="col-span-12 lg:col-span-8 glass-card border-none relative overflow-hidden">
                    {/* Gradient accent border */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-500/20 via-transparent to-teal-500/20 p-[1px]">
                        <div className="absolute inset-[1px] bg-white/80 dark:bg-[oklch(0.18_0.018_280)] rounded-2xl" />
                    </div>

                    <CardHeader className="relative z-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-amber-600" />
                                    Fresh Opportunities
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    New jobs matching your expertise in the last hour
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        {!freshJobs ? (
                            <div className="space-y-3">
                                <Skeleton className="h-24 w-full rounded-xl" />
                                <Skeleton className="h-24 w-full rounded-xl" />
                            </div>
                        ) : freshJobs.length === 0 ? (
                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/5 via-transparent to-teal-500/5 p-12">
                                {/* Decorative blur orbs */}
                                <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-amber-400/10 blur-3xl" />
                                <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-teal-400/10 blur-3xl" />

                                <div className="relative flex flex-col items-center justify-center text-center">
                                    {/* Icon */}
                                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-amber-500/15 to-teal-500/15 flex items-center justify-center mb-6 shadow-lg">
                                        <Clock className="h-10 w-10 text-foreground/60" />
                                    </div>

                                    {/* Text */}
                                    <h3 className="text-2xl font-bold text-foreground mb-3">
                                        No new opportunities yet
                                    </h3>
                                    <p className="text-muted-foreground max-w-md mb-8 text-base leading-relaxed">
                                        Fresh jobs matching your expertise will appear here. Check back soon or browse all available requests.
                                    </p>

                                    {/* CTA */}
                                    <Link href="/search">
                                        <Button variant="outline" className="rounded-full px-8 h-11 font-semibold">
                                            <Search className="h-4 w-4 mr-2" />
                                            Browse All Jobs
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {freshJobs.map((job) => (
                                    <Link
                                        key={job._id}
                                        href={`/requests/${job._id}`}
                                        className="block group"
                                    >
                                        <div className="p-4 rounded-xl bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-transparent hover:border-foreground/10 transition-all duration-300 hover:shadow-md">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-lg">🔥</span>
                                                        <h4 className="font-semibold text-foreground group-hover:text-amber-700 transition-colors truncate">
                                                            {job.title}
                                                        </h4>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                        {job.department && (
                                                            <span>{job.department}</span>
                                                        )}
                                                        <span>•</span>
                                                        <span>Posted {formatDistanceToNow(new Date(job._creationTime))} ago</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    {job.budget && (
                                                        <span className="font-bold text-foreground">PKR {job.budget.toLocaleString()}</span>
                                                    )}
                                                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                                <Link href="/search" className="block">
                                    <Button variant="ghost" className="w-full rounded-xl h-11 font-semibold">
                                        Browse All Jobs <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* KPI Stack (4 cols) */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                    {/* Total Earnings - Tall Card */}
                    <Card className="glass-card shadow-glow-amber border-none overflow-hidden flex-1">
                        <CardContent className="p-8 relative h-full flex flex-col justify-between">
                            {/* Ambient gradient */}
                            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-amber-400/20 via-orange-300/10 to-transparent blur-3xl" />
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

                                <div className="flex items-baseline gap-4 mb-4">
                                    <span className="text-5xl lg:text-6xl font-bold tracking-tighter text-foreground">
                                        PKR {totalEarnings.toLocaleString()}
                                    </span>
                                </div>
                                <Badge className="bg-emerald-500/15 text-emerald-700 border-none font-semibold px-3 py-1.5 text-sm">
                                    <TrendingUp className="h-3.5 w-3.5 mr-1" />
                                    +12% this month
                                </Badge>

                                <p className="text-muted-foreground mt-4 text-base">
                                    {totalEarnings > 0 ? "Great work! Keep it up." : "You're just getting started."}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Active Jobs - Compact */}
                    <Card className="glass-card shadow-glow-coral border-none overflow-hidden">
                        <CardContent className="p-6 relative">
                            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-rose-400/15 to-transparent blur-2xl" />

                            <div className="flex items-center gap-2 mb-3 relative z-10">
                                <div className="h-7 w-7 rounded-lg bg-rose-500/15 flex items-center justify-center">
                                    <Zap className="h-3.5 w-3.5 text-rose-600" />
                                </div>
                                <span className="text-xs font-semibold uppercase tracking-wider text-rose-700/70">
                                    Active Jobs
                                </span>
                            </div>

                            <div className="flex items-baseline gap-3 relative z-10">
                                <span className="text-4xl font-bold tracking-tighter text-foreground">
                                    {activeJobsCount}
                                </span>
                                <span className="text-sm font-medium text-muted-foreground">
                                    in progress
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Success Rate - Compact */}
                    <Card className="glass-card shadow-glow-teal border-none overflow-hidden">
                        <CardContent className="p-6 relative">
                            <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-tl from-teal-400/15 to-transparent blur-2xl" />

                            <div className="flex items-center gap-2 mb-3 relative z-10">
                                <div className="h-7 w-7 rounded-lg bg-teal-500/15 flex items-center justify-center">
                                    <Target className="h-3.5 w-3.5 text-teal-600" />
                                </div>
                                <span className="text-xs font-semibold uppercase tracking-wider text-teal-700/70">
                                    Success Rate
                                </span>
                            </div>

                            <div className="flex items-baseline gap-3 relative z-10">
                                <span className="text-4xl font-bold tracking-tighter text-foreground">
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
                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/5 via-transparent to-teal-500/5 p-12">
                                {/* Decorative elements */}
                                <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-amber-400/10 blur-3xl" />
                                <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-teal-400/10 blur-3xl" />

                                <div className="relative flex flex-col items-center justify-center text-center">
                                    {/* Icon */}
                                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-amber-500/15 to-teal-500/15 flex items-center justify-center mb-6 shadow-lg">
                                        <Briefcase className="h-10 w-10 text-foreground/60" />
                                    </div>

                                    {/* Text */}
                                    <h3 className="text-2xl font-bold text-foreground mb-3">
                                        No active jobs yet
                                    </h3>
                                    <p className="text-muted-foreground max-w-md mb-8 text-base leading-relaxed">
                                        Start earning by browsing available requests and placing your bids. Students are waiting for your expertise.
                                    </p>

                                    {/* CTA */}
                                    <Link href="/search">
                                        <Button className="rounded-full px-8 h-12 bg-foreground text-background hover:bg-foreground/90 font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                                            <Sparkles className="h-4 w-4 mr-2" />
                                            Browse Available Jobs
                                        </Button>
                                    </Link>
                                </div>
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

            {/* Recommended Jobs Section */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Recommended for You</h2>
                        <p className="text-muted-foreground mt-1">Browse requests you might be interested in</p>
                    </div>
                    <Link href="/search">
                        <Button variant="outline" className="rounded-full">
                            View All
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {requests?.slice(0, 6).map((request) => (
                        <Link key={request._id} href={`/requests/${request._id}`} className="group">
                            <Card className="glass-card border-none h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden relative">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <Badge variant="outline" className="text-xs">
                                            {request.department || "General"}
                                        </Badge>
                                        {request.budget && (
                                            <span className="font-bold text-amber-700">
                                                PKR {request.budget.toLocaleString()}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-amber-700 transition-colors">
                                        {request.title}
                                    </h3>

                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                        {request.description}
                                    </p>

                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{request.urgency} priority</span>
                                        <span>•</span>
                                        <span>{request.helpType}</span>
                                    </div>

                                    {/* Minimalist Premium CTA - Icon Only */}
                                    <div className="absolute bottom-4 right-4 translate-y-16 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out">
                                        <button className="relative h-10 w-10 rounded-full bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 hover:scale-110 transition-all duration-200 flex items-center justify-center">
                                            <ArrowRight className="h-4 w-4 ml-0.5 group-hover:translate-x-0.5 transition-transform duration-200" />
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
