"use client";

import { useState, useMemo } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRole } from "@/context/RoleContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CourseSelector } from "@/components/CourseSelector";
import {
    ArrowLeft,
    ArrowRight,
    X,
    Plus,
    Info,
    BookOpen,
    Tag,
    CalendarClock,
    CheckCircle,
    GraduationCap,
    Users,
} from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";

/* ────────────────────────────── constants ────────────────────────────── */

const SUPPLY_STEPS = [
    { id: 1, label: "Type", icon: GraduationCap },
    { id: 2, label: "Basics", icon: BookOpen },
    { id: 3, label: "Topics", icon: Tag },
    { id: 4, label: "Schedule", icon: CalendarClock },
    { id: 5, label: "Review", icon: CheckCircle },
] as const;

const DEMAND_STEPS = [
    { id: 1, label: "Type", icon: GraduationCap },
    { id: 2, label: "Basics", icon: BookOpen },
    { id: 3, label: "Topics", icon: Tag },
    { id: 4, label: "Preferences", icon: CalendarClock },
    { id: 5, label: "Review", icon: CheckCircle },
] as const;

/* ──────────────────────────── component ──────────────────────────── */

export default function NewCrashCoursePage() {
    const { role } = useRole();
    const router = useRouter();
    const createCrashCourse = useMutation(api.crash_courses.create);

    /* ── step ── */
    const [step, setStep] = useState(1);
    const totalSteps = 5;

    /* ── origin ── */
    const [origin, setOrigin] = useState<"demand" | "supply">(
        role === "tutor" ? "supply" : "demand"
    );

    /* ── common fields ── */
    const [courseId, setCourseId] = useState<Id<"university_courses"> | null>(null);
    const [courseCode, setCourseCode] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [examType, setExamType] = useState<"quiz" | "midterm" | "final" | "other">("midterm");
    const [maxEnrollment, setMaxEnrollment] = useState("30");
    const [minEnrollment, setMinEnrollment] = useState("");
    const [topicInput, setTopicInput] = useState("");
    const [topics, setTopics] = useState<string[]>([]);

    /* ── supply-only ── */
    const [pricePerStudent, setPricePerStudent] = useState("");
    const [scheduledDate, setScheduledDate] = useState("");
    const [scheduledTime, setScheduledTime] = useState("");
    const [duration, setDuration] = useState("120");
    const [location, setLocation] = useState("");

    /* ── demand-only ── */
    const [preferredDateRange, setPreferredDateRange] = useState("");
    const [preferredDuration, setPreferredDuration] = useState("");
    const [budgetPerStudent, setBudgetPerStudent] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);

    const steps = origin === "supply" ? SUPPLY_STEPS : DEMAND_STEPS;
    const progress = (step / totalSteps) * 100;

    /* ── topic helpers ── */
    const addTopic = () => {
        const trimmed = topicInput.trim();
        if (trimmed && !topics.includes(trimmed) && topics.length < 20) {
            setTopics([...topics, trimmed]);
            setTopicInput("");
        }
    };

    const removeTopic = (topic: string) => {
        setTopics(topics.filter((t) => t !== topic));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addTopic();
        }
    };

    /* ── per-step validation ── */
    const canProceed = useMemo(() => {
        switch (step) {
            case 1:
                return true; // origin is always set
            case 2:
                return !!courseId && title.trim().length > 0 && description.trim().length > 0;
            case 3:
                return topics.length > 0;
            case 4:
                if (origin === "supply") {
                    return (
                        !!scheduledDate &&
                        !!scheduledTime &&
                        parseInt(duration) > 0 &&
                        parseFloat(pricePerStudent) > 0
                    );
                }
                return true; // demand preferences are all optional
            case 5:
                return true; // review step
            default:
                return false;
        }
    }, [step, origin, courseId, title, description, topics, scheduledDate, scheduledTime, duration, pricePerStudent]);

    /* ── navigation ── */
    const goNext = () => {
        if (step < totalSteps) setStep(step + 1);
    };
    const goBack = () => {
        if (step > 1) setStep(step - 1);
    };

    /* ── submit ── */
    const handleSubmit = async () => {
        if (!courseId) {
            toast.error("Please select a course");
            return;
        }

        setIsSubmitting(true);
        try {
            let scheduledAt: number | undefined;
            if (origin === "supply" && scheduledDate && scheduledTime) {
                scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).getTime();
            }

            const crashCourseId = await createCrashCourse({
                origin,
                courseId,
                title,
                description,
                topics,
                examType,
                maxEnrollment: origin === "supply" ? (parseInt(maxEnrollment) || 30) : undefined,
                minEnrollment: origin === "supply" && minEnrollment ? parseInt(minEnrollment) : undefined,
                pricePerStudent: origin === "supply" ? parseFloat(pricePerStudent) || undefined : undefined,
                scheduledAt: origin === "supply" ? scheduledAt : undefined,
                duration: origin === "supply" ? parseInt(duration) || undefined : undefined,
                location: origin === "supply" ? location || undefined : undefined,
                preferredDateRange: origin === "demand" ? preferredDateRange || undefined : undefined,
                preferredDuration: origin === "demand" ? (parseInt(preferredDuration) || undefined) : undefined,
                budgetPerStudent: origin === "demand" ? (parseFloat(budgetPerStudent) || undefined) : undefined,
            });

            toast.success(
                origin === "supply"
                    ? "Crash course created! Students can now enroll."
                    : "Crash course request posted! Tutors can now apply."
            );
            router.push(`/crash-courses/${crashCourseId}`);
        } catch (error: any) {
            toast.error(error.message ?? "Failed to create crash course");
        } finally {
            setIsSubmitting(false);
        }
    };

    /* ──────────────── render helpers ──────────────── */

    const renderStepIndicator = () => (
        <div className="space-y-4">
            <Progress value={progress} className="w-full h-2" />
            <div className="flex justify-between">
                {steps.map((s) => {
                    const Icon = s.icon;
                    const isActive = step === s.id;
                    const isDone = step > s.id;
                    return (
                        <button
                            key={s.id}
                            type="button"
                            onClick={() => s.id < step && setStep(s.id)}
                            disabled={s.id > step}
                            className={`flex flex-col items-center gap-1 text-xs transition-colors ${
                                isActive
                                    ? "text-foreground font-semibold"
                                    : isDone
                                        ? "text-foreground/70 cursor-pointer hover:text-foreground"
                                        : "text-muted-foreground/50"
                            }`}
                        >
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                    isActive
                                        ? "bg-foreground text-background scale-110"
                                        : isDone
                                            ? "bg-foreground/15 text-foreground"
                                            : "bg-muted text-muted-foreground"
                                }`}
                            >
                                {isDone ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                            </div>
                            <span className="hidden sm:block">{s.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    /* ── Step 1: Origin ── */
    const renderStep1 = () => (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">What would you like to do?</h2>
                <p className="text-sm text-muted-foreground">Choose how you want to start your crash course</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                    type="button"
                    onClick={() => setOrigin("demand")}
                    className={`relative p-6 rounded-2xl border-2 text-left transition-all hover:shadow-md ${
                        origin === "demand"
                            ? "border-amber-500 bg-amber-500/5 shadow-sm"
                            : "border-border hover:border-amber-300"
                    }`}
                >
                    <div className="text-3xl mb-3">🔥</div>
                    <p className="font-bold text-lg">Request a Crash Course</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        I need help — tutors will apply with quotes, and students vote for the best one.
                    </p>
                    {origin === "demand" && (
                        <div className="absolute top-3 right-3">
                            <CheckCircle className="h-5 w-5 text-amber-500" />
                        </div>
                    )}
                </button>
                <button
                    type="button"
                    onClick={() => setOrigin("supply")}
                    className={`relative p-6 rounded-2xl border-2 text-left transition-all hover:shadow-md ${
                        origin === "supply"
                            ? "border-blue-500 bg-blue-500/5 shadow-sm"
                            : "border-border hover:border-blue-300"
                    }`}
                >
                    <div className="text-3xl mb-3">📚</div>
                    <p className="font-bold text-lg">Offer a Crash Course</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        I want to teach — set your price, schedule, and let students enroll directly.
                    </p>
                    {origin === "supply" && (
                        <div className="absolute top-3 right-3">
                            <CheckCircle className="h-5 w-5 text-blue-500" />
                        </div>
                    )}
                </button>
            </div>
        </div>
    );

    /* ── Step 2: Course & Basics ── */
    const renderStep2 = () => (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">Course & Basic Info</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    {origin === "supply"
                        ? "Tell students what this crash course covers"
                        : "Describe what you need help with"}
                </p>
            </div>

            <div className="space-y-2">
                <Label>Course *</Label>
                <CourseSelector
                    onSelect={(id, code) => {
                        setCourseId(id);
                        setCourseCode(code);
                    }}
                    defaultValue={courseCode}
                />
            </div>

            <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={
                        origin === "supply"
                            ? "e.g. CS-200 Midterm Crash Course"
                            : "e.g. Need midterm prep for CS-200 ASAP"
                    }
                    maxLength={200}
                />
            </div>

            <div className="space-y-2">
                <Label>Exam Type *</Label>
                <Select value={examType} onValueChange={(v: any) => setExamType(v)}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="midterm">Midterm</SelectItem>
                        <SelectItem value="final">Final Exam</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={
                        origin === "supply"
                            ? "What will you cover? Include your approach and what students should expect."
                            : "What do you need help with? Describe what you're struggling with."
                    }
                    rows={4}
                    maxLength={5000}
                />
            </div>
        </div>
    );

    /* ── Step 3: Topics ── */
    const renderStep3 = () => (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">Topics to Cover</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Add at least one topic. This helps tutors understand the scope
                    {origin === "demand" && " and tailor their proposals"}.
                </p>
            </div>

            <div className="space-y-2">
                <Label>Add Topics *</Label>
                <div className="flex gap-2">
                    <Input
                        value={topicInput}
                        onChange={(e) => setTopicInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a topic and press Enter"
                        maxLength={100}
                    />
                    <Button type="button" variant="outline" size="icon" onClick={addTopic}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                {topics.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {topics.map((topic) => (
                            <Badge
                                key={topic}
                                variant="secondary"
                                className="pl-3 pr-1 py-1.5 gap-1 text-sm"
                            >
                                {topic}
                                <button
                                    type="button"
                                    onClick={() => removeTopic(topic)}
                                    className="ml-1 rounded-full hover:bg-foreground/10 p-0.5"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}
                {topics.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                        e.g. &quot;Linked Lists&quot;, &quot;Tree Traversals&quot;, &quot;Dynamic Programming&quot;
                    </p>
                )}
            </div>

            {/* Max enrollment — supply only (scope of their offer) */}
            {origin === "supply" && (
                <div className="space-y-2 pt-2 border-t">
                    <Label className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        Max Students *
                    </Label>
                    <Input
                        type="number"
                        value={maxEnrollment}
                        onChange={(e) => setMaxEnrollment(e.target.value)}
                        placeholder="30"
                        min={2}
                        max={200}
                    />
                </div>
            )}
        </div>
    );

    /* ── Step 4: Supply → Schedule & Pricing ── */
    const renderStep4Supply = () => (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">Schedule & Pricing</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Set when, where, and how much — this is what students will see.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Date *</Label>
                    <Input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Time *</Label>
                    <Input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Duration (minutes) *</Label>
                    <Input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder="120"
                        min={15}
                        max={480}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Online (Zoom) or room name"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Price per Student (PKR) *</Label>
                    <Input
                        type="number"
                        value={pricePerStudent}
                        onChange={(e) => setPricePerStudent(e.target.value)}
                        placeholder="500"
                        min={1}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Min Students to Run</Label>
                    <Input
                        type="number"
                        value={minEnrollment}
                        onChange={(e) => setMinEnrollment(e.target.value)}
                        placeholder="5 (optional)"
                        min={1}
                    />
                </div>
            </div>
        </div>
    );

    /* ── Step 4: Demand → Preferences ── */
    const renderStep4Demand = () => (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">Your Preferences</h2>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    These help tutors craft better proposals. All fields are optional.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Preferred Dates</Label>
                    <Input
                        value={preferredDateRange}
                        onChange={(e) => setPreferredDateRange(e.target.value)}
                        placeholder="e.g. Before Dec 16"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Preferred Duration (min)</Label>
                    <Input
                        type="number"
                        value={preferredDuration}
                        onChange={(e) => setPreferredDuration(e.target.value)}
                        placeholder="120"
                        min={15}
                        max={480}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Budget per Student (PKR)</Label>
                    <Input
                        type="number"
                        value={budgetPerStudent}
                        onChange={(e) => setBudgetPerStudent(e.target.value)}
                        placeholder="400 (optional)"
                        min={0}
                    />
                </div>
            </div>
        </div>
    );

    /* ── Step 5: Review ── */
    const renderStep5 = () => (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">Review & Submit</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Double-check everything before {origin === "supply" ? "creating" : "posting"} your crash course.
                </p>
            </div>

            <div className="space-y-4">
                {/* Origin */}
                <ReviewRow
                    label="Type"
                    value={origin === "supply" ? "📚 Offering a Crash Course" : "🔥 Requesting a Crash Course"}
                    onEdit={() => setStep(1)}
                />

                {/* Course & Basics */}
                <ReviewRow label="Course" value={courseCode || "—"} onEdit={() => setStep(2)} />
                <ReviewRow label="Title" value={title || "—"} onEdit={() => setStep(2)} />
                <ReviewRow label="Exam Type" value={examType.charAt(0).toUpperCase() + examType.slice(1)} onEdit={() => setStep(2)} />
                <ReviewRow
                    label="Description"
                    value={description ? (description.length > 120 ? description.slice(0, 120) + "…" : description) : "—"}
                    onEdit={() => setStep(2)}
                />

                {/* Topics */}
                <div className="flex items-start justify-between py-3 border-b gap-4">
                    <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Topics</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {topics.length > 0
                                ? topics.map((t) => (
                                    <Badge key={t} variant="secondary" className="text-xs">
                                        {t}
                                    </Badge>
                                ))
                                : <span className="text-sm text-muted-foreground">—</span>}
                        </div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" className="text-xs shrink-0" onClick={() => setStep(3)}>
                        Edit
                    </Button>
                </div>

                {origin === "supply" && (
                    <ReviewRow label="Max Students" value={maxEnrollment} onEdit={() => setStep(3)} />
                )}

                {/* Origin-specific */}
                {origin === "supply" ? (
                    <>
                        <ReviewRow
                            label="Date & Time"
                            value={
                                scheduledDate && scheduledTime
                                    ? `${scheduledDate} at ${scheduledTime}`
                                    : "—"
                            }
                            onEdit={() => setStep(4)}
                        />
                        <ReviewRow label="Duration" value={duration ? `${duration} min` : "—"} onEdit={() => setStep(4)} />
                        <ReviewRow label="Location" value={location || "Not set"} onEdit={() => setStep(4)} />
                        <ReviewRow label="Price / Student" value={pricePerStudent ? `PKR ${parseFloat(pricePerStudent).toLocaleString()}` : "—"} onEdit={() => setStep(4)} />
                        <ReviewRow label="Min Enrollment" value={minEnrollment || "None"} onEdit={() => setStep(4)} />
                    </>
                ) : (
                    <>
                        <ReviewRow label="Preferred Dates" value={preferredDateRange || "Flexible"} onEdit={() => setStep(4)} />
                        <ReviewRow label="Preferred Duration" value={preferredDuration ? `${preferredDuration} min` : "Flexible"} onEdit={() => setStep(4)} />
                        <ReviewRow label="Budget / Student" value={budgetPerStudent ? `PKR ${parseFloat(budgetPerStudent).toLocaleString()}` : "Open"} onEdit={() => setStep(4)} />
                    </>
                )}
            </div>
        </div>
    );

    /* ──────────────── main render ──────────────── */

    return (
        <div className="container mx-auto py-10 max-w-2xl">
            <Link
                href="/crash-courses"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Crash Courses
            </Link>

            <Card className="glass-card border-none">
                <CardHeader className="pb-2">
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        {origin === "supply" ? "Create a Crash Course" : "Request a Crash Course"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                    {renderStepIndicator()}

                    {/* Step content */}
                    <div className="min-h-[320px]">
                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {step === 3 && renderStep3()}
                        {step === 4 && (origin === "supply" ? renderStep4Supply() : renderStep4Demand())}
                        {step === 5 && renderStep5()}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between pt-4 border-t">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={goBack}
                            disabled={step === 1}
                            className="rounded-full gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>

                        {step < totalSteps ? (
                            <Button
                                type="button"
                                onClick={goNext}
                                disabled={!canProceed}
                                className="rounded-full gap-2 px-6 h-11 font-semibold"
                            >
                                Next
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting || !canProceed}
                                className="rounded-full gap-2 px-6 h-11 bg-foreground text-background hover:bg-foreground/90 font-semibold"
                            >
                                {isSubmitting
                                    ? "Creating…"
                                    : origin === "supply"
                                        ? "Create Crash Course →"
                                        : "Post Request →"}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

/* ────────────── small review row helper ────────────── */

function ReviewRow({
    label,
    value,
    onEdit,
}: {
    label: string;
    value: string;
    onEdit: () => void;
}) {
    return (
        <div className="flex items-start justify-between py-3 border-b gap-4">
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
                <p className="text-sm mt-0.5 break-words">{value}</p>
            </div>
            <Button type="button" variant="ghost" size="sm" className="text-xs shrink-0" onClick={onEdit}>
                Edit
            </Button>
        </div>
    );
}
