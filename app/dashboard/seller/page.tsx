"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Search, TrendingUp, TrendingDown, ArrowRight, Sparkles, Zap, Target, Briefcase, ChevronDown, Clock, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EarningsChart } from "@/components/dashboard/EarningsChart";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import BidCard from "@/components/dashboard/BidCard";
import { formatStatus } from "@/lib/utils";
import { OnlinePresence } from "@/app/components/OnlinePresence";

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
        } catch {
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

    if (requests === undefined || myOffers === undefined || freshJobs === undefined) {
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
    const pendingBids = myOffers.filter(o => o.status === "pending" || o.status === "rejected");
    const totalEarnings = myOffers
        .filter(o => o.status === "accepted")
        .reduce((acc, curr) => acc + curr.price, 0);

    // Calculate chart data for the last 6 months
    const now = new Date();
    const chartData = Array.from({ length: 6 }, (_, i) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const monthName = date.toLocaleString('default', { month: 'short' });

        // Filter offers for this month
        const monthlyTotal = myOffers
            .filter(o => {
                if (o.status !== "accepted") return false;
                const offerDate = new Date(o._creationTime);
                return offerDate.getMonth() === date.getMonth() &&
                    offerDate.getFullYear() === date.getFullYear();
            })
            .reduce((acc, curr) => acc + curr.price, 0);

        return { name: monthName, total: monthlyTotal };
    });

    // Calculate Trend (Current Month vs Previous Month)
    // Note: chartData indexes: 5 = Current Month, 4 = Previous Month
    const currentMonthData = chartData[5]?.total || 0;
    const prevMonthData = chartData[4]?.total || 0;

    let earningsTrend = 0;
    if (prevMonthData === 0) {
        earningsTrend = currentMonthData > 0 ? 100 : 0;
    } else {
        earningsTrend = ((currentMonthData - prevMonthData) / prevMonthData) * 100;
        earningsTrend = ((currentMonthData - prevMonthData) / prevMonthData) * 100;
    }

    const getTrendMessage = (trend: number, current: number) => {
        if (current === 0) return "Start bidding to earn your first rupee!";
        if (trend < 0) return "Earnings are down. Time to pick up more tasks?";
        if (trend === 0) return "Steady as she goes. Consistent effort pays off.";
        if (trend < 20) return "Good progress! You're moving in the right direction.";
        if (trend < 50) return "Great work! Your earnings are growing nicely.";
        return "Incredible growth! You're absolutely crushing it! 🚀";
    };

    const motivationalMessage = getTrendMessage(earningsTrend, currentMonthData);
    const completionRate = 98;
    const statusDisplay = getStatusDisplay();

    return (
        <div className="container mx-auto py-10 text-foreground">
            <OnlinePresence />
            {/* Welcome Header */}
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

            {/* Top Section: Fresh Opportunities (Left) + KPIs (Right) */}
            <section className="grid grid-cols-12 gap-6 mb-10 items-start">
                {/* Fresh Opportunities - Hero Card (8 cols) */}
                <Card className="col-span-12 lg:col-span-8 glass-card border-none relative overflow-hidden flex flex-col" style={{ height: '536px' }}>
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
                                    Jobs recommended based on your expertise
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10 flex-1 overflow-hidden flex flex-col">
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
                            <div className="space-y-3 overflow-y-auto flex-1 pr-2">
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
                                <Link href="/search" className="block pt-2">
                                    <Button variant="ghost" className="w-full rounded-xl h-11 font-semibold">
                                        Browse All Jobs <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* KPI Stack (4 cols) */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6" style={{ height: '536px' }}>
                    {/* Total Earnings - Tall Card */}
                    <Card className="glass-card shadow-glow-amber border-none overflow-hidden hover:scale-[1.01] transition-transform flex-1">
                        <CardContent className="p-8 relative flex flex-col justify-between">
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
                                <Badge className={`${earningsTrend >= 0 ? "bg-emerald-500/15 text-emerald-700" : "bg-rose-500/15 text-rose-700"} border-none font-semibold px-3 py-1.5 text-sm`}>
                                    {earningsTrend >= 0 ? <TrendingUp className="h-3.5 w-3.5 mr-1" /> : <TrendingDown className="h-3.5 w-3.5 mr-1" />}
                                    {earningsTrend >= 0 ? '+' : ''}{earningsTrend.toFixed(1)}% this month
                                </Badge>

                                <p className="text-muted-foreground mt-4 text-base">
                                    {motivationalMessage}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Active Jobs - Compact */}
                    <Card className="glass-card shadow-glow-coral border-none overflow-hidden hover:scale-[1.01] transition-transform">
                        <CardContent className="p-6 relative flex flex-col justify-center">
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
                    <Card className="glass-card shadow-glow-teal border-none overflow-hidden hover:scale-[1.01] transition-transform">
                        <CardContent className="p-6 relative flex flex-col justify-center">
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
            </section >

            {/* Main Content Grid: Tabs (Left) + Chart (Right) */}
            < section className="grid grid-cols-12 gap-6" >
                <div className="col-span-12 lg:col-span-8">
                    <Card className="glass-card border-none h-full">
                        <Tabs defaultValue="active" className="h-full flex flex-col">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-2xl font-bold tracking-tight">
                                    My Activity
                                </CardTitle>
                                <TabsList className="grid w-[300px] grid-cols-2 bg-background/50 p-1 rounded-full border">
                                    <TabsTrigger value="active" className="rounded-full text-xs font-semibold">Active Jobs</TabsTrigger>
                                    <TabsTrigger value="bids" className="rounded-full text-xs font-semibold">My Bids ({pendingBids.length})</TabsTrigger>
                                </TabsList>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <TabsContent value="active" className="mt-0 space-y-4">
                                    {myOffers.filter(o => o.status === "accepted").length === 0 ? (
                                        <EmptyState
                                            icon={Briefcase}
                                            title="No active jobs yet"
                                            description="Start earning by browsing available requests and placing your bids. Students are waiting for your expertise."
                                            action={
                                                <Link href="/search">
                                                    <Button className="rounded-full">
                                                        <Sparkles className="h-4 w-4 mr-2" />
                                                        Browse Available Jobs
                                                    </Button>
                                                </Link>
                                            }
                                        />
                                    ) : (
                                        <div className="space-y-3">
                                            {myOffers.filter(o => o.status === "accepted").map((offer) => (
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
                                                            {formatStatus(offer.status)}
                                                        </Badge>
                                                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="bids" className="mt-0 space-y-4">
                                    {pendingBids.length === 0 ? (
                                        <EmptyState
                                            icon={Send}
                                            title="No pending bids"
                                            description="You haven't sent any offers recently. Browse jobs to find new opportunities."
                                            action={
                                                <Link href="/search">
                                                    <Button variant="outline">Browse Jobs</Button>
                                                </Link>
                                            }
                                        />
                                    ) : (
                                        <div className="grid gap-4 md:grid-cols-2">
                                            {pendingBids.map((offer) => (
                                                <BidCard key={offer._id} offer={offer} />
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>
                            </CardContent>
                        </Tabs>
                    </Card>
                </div>

                <div className="col-span-12 lg:col-span-4">
                    <EarningsChart data={chartData} trend={earningsTrend} />
                </div>
            </section >
        </div >
    );
}
