"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";

const REFERRAL_SOURCES = [
    { value: "friend", label: "Friend or Classmate" },
    { value: "twitter", label: "Twitter/X" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "instagram", label: "Instagram" },
    { value: "search", label: "Google Search" },
    { value: "university", label: "University Event" },
    { value: "other", label: "Other" },
];

export default function WaitlistForm() {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [university, setUniversity] = useState("");
    const [role, setRole] = useState<"student" | "tutor" | undefined>();
    const [referralSource, setReferralSource] = useState<string | undefined>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const joinWaitlist = useMutation(api.waitlist.joinWaitlist);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast.error("Please enter your email address");
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await joinWaitlist({
                email,
                name: name || undefined,
                university: university || undefined,
                role,
                referralSource,
            });

            if (result.success) {
                setIsSuccess(true);
                toast.success("🎉 You're on the list!", {
                    description: "We'll notify you when we launch!",
                });
            } else if (result.alreadyExists) {
                toast.info("You're already on the waitlist!", {
                    description: "We'll reach out soon.",
                });
                setIsSuccess(true);
            }
        } catch (error) {
            console.error("Error joining waitlist:", error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="glass-card p-8 text-center animate-fade-in">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">You&apos;re on the list! 🎉</h3>
                <p className="text-muted-foreground">
                    We&apos;ll send you an email when Path launches. <br />
                    Get ready to connect with fellow students!
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="glass-card p-6 md:p-8 space-y-5">
            <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-1 flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    Join the Waitlist
                </h3>
                <p className="text-muted-foreground text-sm">
                    Be the first to know when we launch
                </p>
            </div>

            {/* Email - Required */}
            <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="you@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12"
                />
            </div>

            {/* Name - Optional */}
            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12"
                />
            </div>

            {/* University - Optional */}
            <div className="space-y-2">
                <Label htmlFor="university">University</Label>
                <Input
                    id="university"
                    type="text"
                    placeholder="e.g., LUMS, NUST, FAST"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="h-12"
                />
            </div>

            {/* Role - Optional */}
            <div className="space-y-2">
                <Label>I want to...</Label>
                <div className="grid grid-cols-2 gap-3">
                    <Button
                        type="button"
                        variant={role === "student" ? "default" : "outline"}
                        className="h-12"
                        onClick={() => setRole("student")}
                    >
                        📚 Get Help
                    </Button>
                    <Button
                        type="button"
                        variant={role === "tutor" ? "default" : "outline"}
                        className="h-12"
                        onClick={() => setRole("tutor")}
                    >
                        🎓 Help Others
                    </Button>
                </div>
            </div>

            {/* Referral Source - Optional */}
            <div className="space-y-2">
                <Label>How did you hear about us?</Label>
                <Select
                    value={referralSource}
                    onValueChange={setReferralSource}
                >
                    <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                        {REFERRAL_SOURCES.map((source) => (
                            <SelectItem key={source.value} value={source.value}>
                                {source.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Submit Button */}
            <Button
                type="submit"
                className="w-full h-14 text-lg font-medium"
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Joining...
                    </>
                ) : (
                    <>
                        🚀 Join the Waitlist
                    </>
                )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
                We&apos;ll never spam you. Unsubscribe anytime.
            </p>
        </form>
    );
}
