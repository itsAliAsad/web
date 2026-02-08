"use client";

import { Search, Users, MessageCircle, ShieldCheck } from "lucide-react";

const FEATURES = [
    {
        icon: Search,
        title: "Find Tutors",
        description: "Search by course, skill, or topic",
    },
    {
        icon: Users,
        title: "Study Groups",
        description: "Join or create collaborative sessions",
    },
    {
        icon: MessageCircle,
        title: "1-on-1 Chat",
        description: "Direct messaging with tutors",
    },
    {
        icon: ShieldCheck,
        title: "Verified Profiles",
        description: "Trust badges for proven helpers",
    },
];

export default function FeaturesPreview() {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-center text-muted-foreground">
                What&apos;s Coming
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {FEATURES.map((feature, index) => (
                    <div
                        key={feature.title}
                        className="glass-card p-5 text-center space-y-3 animate-fade-in"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="w-12 h-12 mx-auto rounded-xl bg-secondary flex items-center justify-center">
                            <feature.icon className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-semibold text-sm">{feature.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {feature.description}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
