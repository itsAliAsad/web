"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CourseSelector } from "@/components/CourseSelector";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { BookOpen, Briefcase, Zap, Clock, Calendar, Wallet, FileText, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const CUSTOM_CATEGORIES = [
    { value: "mentorship", label: "General Mentorship" },
    { value: "career_advice", label: "Career Advice" },
    { value: "project_help", label: "Project Help" },
    { value: "essay_review", label: "Essay Review" },
    { value: "other", label: "Other" },
];

const HELP_TYPES = [
    { value: "concept", label: "Concept Explanation", icon: BookOpen },
    { value: "debugging", label: "Code Debugging", icon: FileText },
    { value: "exam_prep", label: "Exam Prep", icon: Clock },
    { value: "review", label: "Review / Feedback", icon: CheckCircle2 },
    { value: "other", label: "Other", icon: Briefcase },
];

export default function CreateRequestPage() {
    const createTicket = useMutation(api.tickets.create);
    const user = useQuery(api.users.currentUser);
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCourseId, setSelectedCourseId] = useState<Id<"university_courses"> | undefined>();
    const [selectedCourseCode, setSelectedCourseCode] = useState<string>("");
    const [ticketType, setTicketType] = useState<"course" | "general">("course");
    const [customCategory, setCustomCategory] = useState<string>("");
    const [helpType, setHelpType] = useState<string>("concept");
    const [urgency, setUrgency] = useState<string>("1440");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (user?.isBanned) return;

        if (ticketType === "course" && !selectedCourseId) {
            toast.error("Please select a course");
            return;
        }
        if (ticketType === "general" && !customCategory) {
            toast.error("Please select a category");
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);

        const urgencyMinutes = Number(urgency);
        const urgencyLevel: "low" | "medium" | "high" =
            urgencyMinutes <= 60 ? "high" :
                urgencyMinutes <= 360 ? "medium" : "low";

        try {
            await createTicket({
                title: formData.get("title") as string,
                description: formData.get("description") as string,
                courseId: ticketType === "course" ? selectedCourseId : undefined,
                customCategory: ticketType === "general" ? customCategory : undefined,
                urgency: urgencyLevel,
                helpType,
                budget: Number(formData.get("budget")) || undefined,
                deadline: (formData.get("deadline") as string) || undefined,
            });
            toast.success("Request posted successfully!");
            router.push("/dashboard");
        } catch (error) {
            toast.error("Failed to post request");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto py-10 max-w-3xl">
            {/* Back Link */}
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group">
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
            </Link>

            {/* Header */}
            <header className="mb-10">
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-3">
                    Post a Request
                </h1>
                <p className="text-lg text-muted-foreground">
                    Describe what you need help with and tutors will send you offers.
                </p>
            </header>

            {user?.isBanned && (
                <Card className="mb-6 border-destructive/50 bg-destructive/5">
                    <CardContent className="p-4 text-destructive font-medium">
                        Your account is banned. You cannot post new requests.
                    </CardContent>
                </Card>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Title */}
                <Card className="glass-card border-none">
                    <CardContent className="p-6">
                        <Label htmlFor="title" className="text-base font-semibold mb-3 block">
                            What do you need help with?
                        </Label>
                        <Input
                            id="title"
                            name="title"
                            placeholder="e.g., Data Structures Assignment Help, Essay Review, Career Guidance"
                            required
                            className="h-14 text-lg rounded-xl border-foreground/10"
                        />
                    </CardContent>
                </Card>

                {/* Request Type Toggle */}
                <Card className="glass-card border-none">
                    <CardContent className="p-6">
                        <Label className="text-base font-semibold mb-4 block">Request Type</Label>
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <button
                                type="button"
                                onClick={() => setTicketType("course")}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${ticketType === "course"
                                        ? "border-foreground bg-foreground/5"
                                        : "border-foreground/10 hover:border-foreground/20"
                                    }`}
                            >
                                <BookOpen className={`h-5 w-5 mb-2 ${ticketType === "course" ? "text-foreground" : "text-muted-foreground"}`} />
                                <div className="font-semibold text-foreground">Course-Specific</div>
                                <p className="text-sm text-muted-foreground mt-1">Help with a specific course</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setTicketType("general")}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${ticketType === "general"
                                        ? "border-foreground bg-foreground/5"
                                        : "border-foreground/10 hover:border-foreground/20"
                                    }`}
                            >
                                <Briefcase className={`h-5 w-5 mb-2 ${ticketType === "general" ? "text-foreground" : "text-muted-foreground"}`} />
                                <div className="font-semibold text-foreground">General Request</div>
                                <p className="text-sm text-muted-foreground mt-1">Mentorship, career advice, etc.</p>
                            </button>
                        </div>

                        {ticketType === "course" ? (
                            <div>
                                <CourseSelector
                                    onSelect={(id, code) => {
                                        setSelectedCourseId(id);
                                        setSelectedCourseCode(code);
                                    }}
                                />
                            </div>
                        ) : (
                            <Select value={customCategory} onValueChange={setCustomCategory}>
                                <SelectTrigger className="h-12 rounded-xl">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CUSTOM_CATEGORIES.map((cat) => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </CardContent>
                </Card>

                {/* Help Type */}
                <Card className="glass-card border-none">
                    <CardContent className="p-6">
                        <Label className="text-base font-semibold mb-4 block">What kind of help?</Label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                            {HELP_TYPES.map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setHelpType(type.value)}
                                    className={`p-3 rounded-xl border-2 text-center transition-all ${helpType === type.value
                                            ? "border-foreground bg-foreground text-background"
                                            : "border-foreground/10 hover:border-foreground/20"
                                        }`}
                                >
                                    <type.icon className={`h-5 w-5 mx-auto mb-1.5 ${helpType === type.value ? "text-background" : "text-muted-foreground"}`} />
                                    <div className={`text-xs font-medium ${helpType === type.value ? "text-background" : "text-foreground"}`}>
                                        {type.label}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Description */}
                <Card className="glass-card border-none">
                    <CardContent className="p-6">
                        <Label htmlFor="description" className="text-base font-semibold mb-3 block">
                            Description
                        </Label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="Provide more details about what you need help with. The more specific you are, the better offers you'll receive..."
                            required
                            className="min-h-[140px] rounded-xl border-foreground/10 resize-none"
                        />
                    </CardContent>
                </Card>

                {/* Budget, Deadline, Urgency */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="glass-card border-none">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Wallet className="h-4 w-4 text-muted-foreground" />
                                <Label htmlFor="budget" className="font-semibold">Budget (PKR)</Label>
                            </div>
                            <Input
                                id="budget"
                                name="budget"
                                type="number"
                                placeholder="500"
                                min="0"
                                className="h-12 rounded-xl border-foreground/10"
                            />
                            <p className="text-xs text-muted-foreground mt-2">Optional</p>
                        </CardContent>
                    </Card>

                    <Card className="glass-card border-none">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <Label htmlFor="deadline" className="font-semibold">Deadline</Label>
                            </div>
                            <Input
                                id="deadline"
                                name="deadline"
                                type="date"
                                className="h-12 rounded-xl border-foreground/10"
                            />
                            <p className="text-xs text-muted-foreground mt-2">Optional</p>
                        </CardContent>
                    </Card>

                    <Card className="glass-card border-none">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Zap className="h-4 w-4 text-muted-foreground" />
                                <Label className="font-semibold">Urgency</Label>
                            </div>
                            <Select value={urgency} onValueChange={setUrgency}>
                                <SelectTrigger className="h-12 rounded-xl border-foreground/10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="60">🔴 High (1 hour)</SelectItem>
                                    <SelectItem value="360">🟡 Medium (6 hours)</SelectItem>
                                    <SelectItem value="1440">🟢 Low (24 hours)</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>
                </div>

                {/* Submit */}
                <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting || user?.isBanned}
                    className="w-full h-14 rounded-full text-lg font-semibold bg-foreground text-background hover:bg-foreground/90 shadow-lg hover:shadow-xl transition-all"
                >
                    {isSubmitting ? "Posting..." : "Post Request"}
                </Button>
            </form>
        </div>
    );
}
