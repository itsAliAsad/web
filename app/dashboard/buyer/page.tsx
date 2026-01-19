"use client";

import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Wallet, FileText, MessageSquare, ArrowRight, Sparkles, TrendingUp, TrendingDown } from "lucide-react";
import MessageButton from "@/components/chat/MessageButton";
import { Badge } from "@/components/ui/badge";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { formatStatus } from "@/lib/utils";

export default function BuyerDashboard() {
    const { isAuthenticated } = useConvexAuth();
    const requests = useQuery(api.tickets.listMyRequests, isAuthenticated ? {} : "skip");
    const offers = useQuery(api.offers.listOffersForBuyer, isAuthenticated ? {} : "skip");

    if (requests === undefined || offers === undefined) {
        return (
            <div className="container mx-auto py-10">
                <div className="animate-pulse space-y-8">
                    <div className="flex justify-between items-center">
                        <div className="space-y-2">
                            <div className="h-12 bg-foreground/5 rounded-lg w-64" />
                            <div className="h-5 bg-foreground/5 rounded w-48" />
                        </div>
                        <div className="h-12 bg-foreground/5 rounded-full w-40" />
                    </div>
                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-8 h-40 bg-foreground/5 rounded-2xl" />
                        <div className="col-span-4 space-y-4">
                            <div className="h-[72px] bg-foreground/5 rounded-2xl" />
                            <div className="h-[72px] bg-foreground/5 rounded-2xl" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const activeRequestsCount = requests.filter(r => r.status === "open" || r.status === "in_progress").length;
    // Calculate total spent from accepted offers (actual spending)
    const totalSpent = offers
        .filter(o => o.status === "accepted")
        .reduce((acc, curr) => acc + curr.price, 0);

    // Calculate chart data for the last 6 months (Spending)
    const now = new Date();
    const chartData = Array.from({ length: 6 }, (_, i) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const monthName = date.toLocaleString('default', { month: 'short' });

        // Filter offers for this month
        const monthlyTotal = offers
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

    let spendingTrend = 0;
    if (prevMonthData === 0) {
        spendingTrend = currentMonthData > 0 ? 100 : 0;
    } else {
        spendingTrend = ((currentMonthData - prevMonthData) / prevMonthData) * 100;
    }



    const getSpendingMessage = (trend: number, current: number) => {
        if (current === 0) return "You haven't spent anything yet. Post a request to get started.";
        if (trend < 0) return "Optimizing your budget nicely.";
        if (trend === 0) return "Consistent investment in your education.";
        if (trend < 20) return "Investing more in your success.";
        return "Accelerating your learning journey! 🚀";
    };

    const motivationalMessage = getSpendingMessage(spendingTrend, currentMonthData);

    const pendingOffers = offers.filter(o => o.status === "pending");

    return (
        <div className="container mx-auto py-10 text-foreground">
            {/* Header - Premium Editorial */}
            <header className="mb-10">
                <div className="flex justify-between items-start">
                    <div className="space-y-2">
                        <h1 className="text-5xl font-bold tracking-tight text-foreground">
                            Dashboard
                        </h1>
                        <p className="text-lg text-muted-foreground font-medium">
                            Your requests & spending at a glance.
                        </p>
                    </div>
                    <Link href="/requests/new">
                        <Button className="h-12 px-6 rounded-full bg-foreground text-background hover:bg-foreground/90 font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                            <Plus className="mr-2 h-4 w-4" />
                            Post a Request
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Hero KPI Section - Asymmetric Bento Grid */}
            <section className="grid grid-cols-12 gap-4 mb-10">
                {/* HERO: Total Spent - Takes 2/3 width */}
                <Card className="col-span-12 lg:col-span-8 glass-card shadow-glow-coral border-none overflow-hidden group">
                    <CardContent className="p-8 relative">
                        {/* Abstract decorative element */}
                        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-rose-400/20 via-orange-300/10 to-transparent blur-3xl group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-gradient-to-tr from-amber-400/10 to-transparent blur-2xl" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="h-8 w-8 rounded-xl bg-rose-500/20 flex items-center justify-center">
                                    <Wallet className="h-4 w-4 text-rose-600" />
                                </div>
                                <span className="text-sm font-semibold uppercase tracking-wider text-rose-700/80">
                                    Total Spent
                                </span>
                            </div>

                            <div className="flex items-baseline gap-4">
                                <span className="text-6xl lg:text-7xl font-bold tracking-tighter text-foreground animate-count">
                                    PKR {totalSpent.toLocaleString()}
                                </span>
                            </div>
                            <Badge className={`mt-2 ${spendingTrend > 0 ? "bg-emerald-500/15 text-emerald-700" : "bg-rose-500/15 text-rose-700"} border-none font-semibold px-3 py-1.5 text-sm w-fit`}>
                                {spendingTrend > 0 ? <TrendingUp className="h-3.5 w-3.5 mr-1" /> : <TrendingDown className="h-3.5 w-3.5 mr-1" />}
                                {spendingTrend > 0 ? '+' : ''}{spendingTrend.toFixed(1)}% this month
                            </Badge>

                            <p className="text-muted-foreground mt-4 text-base">
                                {motivationalMessage}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Supporting KPIs - Stacked on right */}
                <div className="col-span-12 lg:col-span-4 grid grid-rows-2 gap-4">
                    {/* Active Requests */}
                    <Card className="glass-card shadow-glow-teal border-none overflow-hidden group">
                        <CardContent className="p-6 h-full flex flex-col justify-between relative">
                            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-teal-400/15 to-transparent blur-2xl group-hover:scale-125 transition-transform duration-500" />

                            <div className="flex items-center gap-2 relative z-10">
                                <div className="h-7 w-7 rounded-lg bg-teal-500/15 flex items-center justify-center">
                                    <FileText className="h-3.5 w-3.5 text-teal-600" />
                                </div>
                                <span className="text-xs font-semibold uppercase tracking-wider text-teal-700/70">
                                    Active Requests
                                </span>
                            </div>

                            <div className="flex items-baseline gap-3 relative z-10">
                                <span className="text-5xl font-bold tracking-tighter text-foreground">
                                    {activeRequestsCount}
                                </span>
                                <span className="text-sm font-medium text-muted-foreground">
                                    of {requests.length} posted
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Offers Received */}
                    <Card className="glass-card shadow-glow-amber border-none overflow-hidden group">
                        <CardContent className="p-6 h-full flex flex-col justify-between relative">
                            <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-tl from-amber-400/15 to-transparent blur-2xl group-hover:scale-125 transition-transform duration-500" />

                            <div className="flex items-center gap-2 relative z-10">
                                <div className="h-7 w-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
                                    <MessageSquare className="h-3.5 w-3.5 text-amber-600" />
                                </div>
                                <span className="text-xs font-semibold uppercase tracking-wider text-amber-700/70">
                                    Offers Received
                                </span>
                            </div>

                            <div className="flex items-baseline gap-3 relative z-10">
                                <span className="text-5xl font-bold tracking-tighter text-foreground">
                                    {offers.length}
                                </span>
                                {pendingOffers.length > 0 && (
                                    <Badge className="bg-amber-500/15 text-amber-700 border-none font-medium text-xs">
                                        {pendingOffers.length} pending
                                    </Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Offers Waiting for Action */}
            {pendingOffers.length > 0 && (
                <section className="mb-10">
                    <div className="flex items-center gap-2 mb-6">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        <h2 className="text-2xl font-bold tracking-tight">Offers Waiting for You</h2>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {pendingOffers.map((offer) => (
                            <Link key={offer._id} href={`/requests/${offer.ticketId || offer.requestId}`} className="block group">
                                <Card className="glass-card border-none h-full transition-all duration-300 hover:shadow-lg overflow-hidden relative">
                                    {/* Hover CTA */}
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out">
                                        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium shadow-lg">
                                            Review
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </span>
                                    </div>

                                    <CardContent className="p-5 transition-all duration-300 group-hover:pr-28">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-2xl font-bold text-foreground">
                                                PKR {(offer.price || 0).toLocaleString()}
                                            </span>
                                            <Badge className="bg-amber-500/15 text-amber-700 border-none text-xs group-hover:opacity-0 transition-opacity">
                                                Pending
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-1">
                                            For: {offer.requestTitle}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Main Content: Recent Requests + Chart */}
            <section className="grid grid-cols-12 gap-6 mb-10">
                {/* Recent Requests */}
                <Card className="col-span-12 lg:col-span-7 glass-card border-none">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-2xl font-bold tracking-tight">My Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {requests.length === 0 ? (
                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500/5 via-transparent to-violet-500/5 p-12">
                                {/* Decorative elements */}
                                <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-rose-400/10 blur-3xl" />
                                <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-violet-400/10 blur-3xl" />

                                <div className="relative flex flex-col items-center justify-center text-center">
                                    {/* Icon */}
                                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-rose-500/15 to-violet-500/15 flex items-center justify-center mb-6 shadow-lg">
                                        <FileText className="h-10 w-10 text-foreground/60" />
                                    </div>

                                    {/* Text */}
                                    <h3 className="text-2xl font-bold text-foreground mb-3">
                                        No requests yet
                                    </h3>
                                    <p className="text-muted-foreground max-w-md mb-8 text-base leading-relaxed">
                                        Get help from expert tutors by posting your first request. Describe what you need and receive offers within minutes.
                                    </p>

                                    {/* CTA */}
                                    <Link href="/requests/new">
                                        <Button className="rounded-full px-8 h-12 bg-foreground text-background hover:bg-foreground/90 font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Post Your First Request
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {requests.slice(0, 5).map((request) => (
                                    <div
                                        key={request._id}
                                        className="relative flex items-center gap-4 p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-transparent hover:border-border/50 transition-all duration-300 hover:shadow-md group"
                                    >
                                        <Link
                                            href={`/requests/${request._id}`}
                                            className="absolute inset-0 z-0"
                                        >
                                            <span className="sr-only">View Details</span>
                                        </Link>
                                        <div className="flex-1 min-w-0 pointer-events-none">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold text-foreground group-hover:text-foreground/80 transition-colors truncate">
                                                    {request.title}
                                                </h4>
                                                <Badge className={`text-xs ${request.status === 'open'
                                                    ? 'bg-emerald-500/15 text-emerald-700 border-none'
                                                    : request.status === 'in_progress' || request.status === 'in_session'
                                                        ? 'bg-amber-500/15 text-amber-700 border-none'
                                                        : 'bg-foreground/10 text-foreground border-none'
                                                    }`}>
                                                    {formatStatus(request.status)}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-1">{request.description}</p>
                                        </div>
                                        <div className="flex items-center gap-3 relative z-10">
                                            {request.assignedTutorId && (
                                                <MessageButton
                                                    otherUserId={request.assignedTutorId}
                                                    size="sm"
                                                    variant="ghost"
                                                    className="rounded-full hover:bg-background/80"
                                                />
                                            )}
                                            <span className="text-lg font-bold text-foreground shrink-0 pointer-events-none">
                                                PKR {(request.budget ?? 0).toLocaleString()}
                                            </span>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all shrink-0 pointer-events-none" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Spending Chart */}
                <div className="col-span-12 lg:col-span-5">
                    <SpendingChart data={chartData} trend={spendingTrend} />
                </div>
            </section>
        </div>
    );
}
