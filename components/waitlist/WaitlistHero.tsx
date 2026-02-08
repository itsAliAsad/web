"use client";

import { GraduationCap, Sparkles } from "lucide-react";

export default function WaitlistHero() {
    return (
        <div className="text-center space-y-6 animate-fade-in">
            {/* Logo / Icon + Tagline Badge - stacked and centered */}
            <div className="flex flex-col items-center gap-4">
                <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-glow-amber">
                    <GraduationCap className="w-10 h-10 text-white" />
                </div>

                {/* Tagline Badge */}
                <div className="inline-flex items-center gap-2 py-2 px-4 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
                    <Sparkles className="w-4 h-4" />
                    Coming Soon
                </div>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Academic Help,{" "}
                <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">
                    Peer-to-Peer
                </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Connect with fellow students for tutoring, study groups, and academic support.
                Get help from peers who&apos;ve been there — or share your expertise with others.
            </p>
        </div>
    );
}
