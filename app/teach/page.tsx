"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ArrowRight,
    BookOpen,
    DollarSign,
    Clock,
    Star,
    Shield,
    TrendingUp,
    Users,
    Zap,
    CheckCircle2,
    GraduationCap,
} from "lucide-react";

export default function TeachPage() {
    const stats = useQuery(api.tickets.getPublicStats);

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* ── Hero ─────────────────────────────────────────────── */}
            <section className="relative overflow-hidden border-b">
                {/* Ambient gradient background */}
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-emerald-400/10 blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl" />
                </div>

                <div className="container mx-auto px-4 py-24 lg:py-32 max-w-5xl">
                    <div className="flex flex-col items-center text-center gap-6">
                        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-semibold px-4 py-1.5 text-sm rounded-full">
                            <Zap className="h-3.5 w-3.5 mr-1.5" />
                            Tutors are earning on Peer right now
                        </Badge>

                        <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
                            Teach on your
                            <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                                {" "}own terms.
                            </span>
                        </h1>

                        <p className="text-xl lg:text-2xl text-muted-foreground max-w-2xl leading-relaxed">
                            Set your own rates, pick the jobs you want, and help students
                            at your university. No commute. No fixed hours. Just real work
                            that fits your schedule.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 mt-4">
                            <Link href="/onboarding?role=tutor">
                                <Button
                                    size="lg"
                                    className="h-14 px-8 text-base font-semibold rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                                >
                                    Start Earning
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <Link href="/search">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="h-14 px-8 text-base font-semibold rounded-full"
                                >
                                    Browse Open Jobs
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Live Stats ────────────────────────────────────────── */}
            <section className="border-b bg-muted/30">
                <div className="container mx-auto px-4 py-12 max-w-5xl">
                    <p className="text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-8">
                        Live platform activity
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <StatCard
                            icon={<BookOpen className="h-6 w-6 text-amber-600" />}
                            value={stats ? stats.openTickets.toLocaleString() : "—"}
                            label="Open student requests"
                            sublabel="Waiting for a tutor right now"
                            color="amber"
                        />
                        <StatCard
                            icon={<CheckCircle2 className="h-6 w-6 text-emerald-600" />}
                            value={stats ? stats.resolvedTickets.toLocaleString() : "—"}
                            label="Sessions completed"
                            sublabel="Tutors have already earned"
                            color="emerald"
                        />
                        <StatCard
                            icon={<Users className="h-6 w-6 text-teal-600" />}
                            value={stats ? stats.activeTutors.toLocaleString() : "—"}
                            label="Active tutors"
                            sublabel="Join a growing community"
                            color="teal"
                        />
                    </div>
                </div>
            </section>

            {/* ── Value Props ───────────────────────────────────────── */}
            <section className="container mx-auto px-4 py-20 max-w-5xl">
                <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-center mb-4">
                    Why tutors choose Peer
                </h2>
                <p className="text-muted-foreground text-center max-w-xl mx-auto mb-14 text-lg">
                    Built by students who understood what fair, flexible tutoring work should look like.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ValueCard
                        icon={<DollarSign className="h-6 w-6 text-emerald-600" />}
                        title="You set the price"
                        description="Post your minimum rate and only accept jobs that meet it. No platform-imposed caps. Charge what your expertise is worth."
                        color="emerald"
                    />
                    <ValueCard
                        icon={<Clock className="h-6 w-6 text-amber-600" />}
                        title="Work when you want"
                        description="Exam season? Post as available. Busy with finals? Go offline. You control your calendar — Peer never books you without your consent."
                        color="amber"
                    />
                    <ValueCard
                        icon={<GraduationCap className="h-6 w-6 text-blue-600" />}
                        title="Teach what you know"
                        description="List specific courses you've aced. Students with those exact tickets find you first. Your grades and experience become your marketing."
                        color="blue"
                    />
                    <ValueCard
                        icon={<TrendingUp className="h-6 w-6 text-teal-600" />}
                        title="Move up the rankings"
                        description="Great reviews earn you a higher match score. Verified tutors with top ratings see more job matches and higher response rates."
                        color="teal"
                    />
                    <ValueCard
                        icon={<Shield className="h-6 w-6 text-violet-600" />}
                        title="Verified badge"
                        description="Upload a transcript or degree. Our team reviews it within 48 hrs. Once verified, your profile stands out with a trust badge students look for."
                        color="violet"
                    />
                    <ValueCard
                        icon={<Star className="h-6 w-6 text-orange-500" />}
                        title="Build your reputation"
                        description="Every resolved session adds a review to your profile. Over time, you build a record that speaks for itself — on Peer and beyond."
                        color="orange"
                    />
                </div>
            </section>

            {/* ── How it works ──────────────────────────────────────── */}
            <section className="border-t bg-muted/20">
                <div className="container mx-auto px-4 py-20 max-w-4xl">
                    <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-center mb-14">
                        Up and running in 5 minutes
                    </h2>

                    <div className="relative">
                        {/* Connecting line */}
                        <div className="hidden md:block absolute left-[calc(50%-1px)] top-8 bottom-8 w-0.5 bg-border -z-0" />

                        <div className="space-y-8">
                            {[
                                {
                                    step: "1",
                                    title: "Create your account",
                                    desc: "Sign up in seconds using your existing Google or email. Your profile photo is pulled in automatically.",
                                },
                                {
                                    step: "2",
                                    title: "Set up your tutor profile",
                                    desc: "Tell us what you teach, your university, and your minimum rate. Takes under 3 minutes.",
                                },
                                {
                                    step: "3",
                                    title: "Browse open student requests",
                                    desc: "See a live feed of tickets matched to your courses and expertise — filtered to your university first.",
                                },
                                {
                                    step: "4",
                                    title: "Place your bid and get hired",
                                    desc: "Send a price and availability. Student accepts, session happens, payment follows.",
                                },
                            ].map(({ step, title, desc }) => (
                                <div
                                    key={step}
                                    className={`relative flex gap-6 items-start ${
                                        parseInt(step) % 2 === 0 ? "md:flex-row-reverse" : "md:flex-row"
                                    } md:w-[calc(50%-2rem)] ${
                                        parseInt(step) % 2 === 0 ? "md:ml-auto md:pl-10" : "md:pr-10"
                                    }`}
                                >
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-600 text-white font-bold text-lg flex items-center justify-center shadow-md">
                                        {step}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg mb-1">{title}</h3>
                                        <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Final CTA ─────────────────────────────────────────── */}
            <section className="border-t">
                <div className="container mx-auto px-4 py-24 max-w-3xl text-center">
                    <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-6">
                        Students are posting right now.
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-10">
                        {stats && stats.openTickets > 0
                            ? `There are ${stats.openTickets} open requests waiting for a tutor. Apply in minutes and start bidding today.`
                            : "Join the platform and be first in line when students post new requests."}
                    </p>
                    <Link href="/onboarding?role=tutor">
                        <Button
                            size="lg"
                            className="h-14 px-10 text-base font-semibold rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                        >
                            Apply as a Tutor — it&apos;s free
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                    <p className="text-xs text-muted-foreground mt-4">
                        No subscription. No upfront fees. Peer takes a small commission only when you earn.
                    </p>
                </div>
            </section>
        </div>
    );
}

// ── Sub-components ────────────────────────────────────────────

function StatCard({
    icon,
    value,
    label,
    sublabel,
    color,
}: {
    icon: React.ReactNode;
    value: string;
    label: string;
    sublabel: string;
    color: string;
}) {
    const colorMap: Record<string, string> = {
        amber: "bg-amber-500/10 ring-amber-500/20",
        emerald: "bg-emerald-500/10 ring-emerald-500/20",
        teal: "bg-teal-500/10 ring-teal-500/20",
    };
    return (
        <div className={`rounded-2xl p-6 ring-1 ${colorMap[color] ?? "bg-muted/40 ring-border"} text-center`}>
            <div className="flex justify-center mb-3">{icon}</div>
            <div className="text-4xl font-bold tracking-tight mb-1">
                {value === "—" ? (
                    <span className="inline-block w-16 h-9 bg-muted rounded animate-pulse" />
                ) : (
                    value
                )}
            </div>
            <div className="font-semibold text-sm mb-0.5">{label}</div>
            <div className="text-xs text-muted-foreground">{sublabel}</div>
        </div>
    );
}

function ValueCard({
    icon,
    title,
    description,
    color,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;
}) {
    const borderMap: Record<string, string> = {
        emerald: "hover:border-emerald-500/30",
        amber: "hover:border-amber-500/30",
        blue: "hover:border-blue-500/30",
        teal: "hover:border-teal-500/30",
        violet: "hover:border-violet-500/30",
        orange: "hover:border-orange-500/30",
    };
    return (
        <div className={`rounded-2xl border p-6 bg-card transition-all duration-200 hover:shadow-md ${borderMap[color] ?? ""}`}>
            <div className="mb-4">{icon}</div>
            <h3 className="font-bold text-base mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
    );
}
