"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useRole } from "@/context/RoleContext";
import { useUser } from "@clerk/nextjs";
import { Id } from "@/convex/_generated/dataModel";
import {
    GraduationCap,
    BookOpen,
    Mail,
    Phone,
    X,
    Plus,
    Sparkles,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Upload,
    FileText,
    Search,
} from "lucide-react";

// ── Teaching scope options ────────────────────────────────────

type TeachingScope = "university" | "o_levels" | "a_levels" | "sat" | "ib" | "ap" | "general";

const SCOPE_OPTIONS: { value: TeachingScope; label: string }[] = [
    { value: "university", label: "University" },
    { value: "o_levels", label: "O-Level" },
    { value: "a_levels", label: "A-Level" },
    { value: "sat", label: "SAT" },
    { value: "ib", label: "IB" },
    { value: "ap", label: "AP" },
    { value: "general", label: "General" },
];

const HELP_TYPE_OPTIONS: { value: string; label: string }[] = [
    { value: "exam_prep",         label: "Exam Prep" },
    { value: "debugging",         label: "Debugging" },
    { value: "concept",           label: "Concept Explanation" },
    { value: "assignment",        label: "Assignment Help" },
    { value: "project",           label: "Project Help" },
    { value: "review",            label: "Essay / Code Review" },
    { value: "mentorship",        label: "Mentorship" },
    { value: "interview_prep",    label: "Interview Prep" },
    { value: "other",             label: "Other" },
];

type CredentialType =
    | "o_level"
    | "a_level"
    | "sat"
    | "ib"
    | "ap"
    | "university_transcript"
    | "university_degree"
    | "other_certificate";

const CREDENTIAL_OPTIONS: { value: CredentialType; label: string }[] = [
    { value: "o_level", label: "O-Level" },
    { value: "a_level", label: "A-Level" },
    { value: "sat", label: "SAT" },
    { value: "ib", label: "IB" },
    { value: "ap", label: "AP" },
    { value: "university_transcript", label: "University Transcript" },
    { value: "university_degree", label: "University Degree" },
    { value: "other_certificate", label: "Other Certificate" },
];

// ── Subject row (O/A-Level) ───────────────────────────────────
interface SubjectRow { name: string; grade: string; level?: string }

// ─────────────────────────────────────────────────────────────

export default function OnboardingWizard() {
    const { user: clerkUser } = useUser();
    const searchParams = useSearchParams();
    const preselectedRole = searchParams.get("role") === "tutor" ? "tutor" : null;

    // ── Wizard state ──────────────────────────────────────────
    const [step, setStep] = useState(preselectedRole === "tutor" ? 2 : 1);
    const [role, setRole] = useState<"student" | "tutor" | null>(preselectedRole);

    // Step 2 — Profile
    const [bio, setBio] = useState("");

    // Step 3 — Where do you teach?
    const [uniQuery, setUniQuery] = useState("");
    const [selectedUniversityId, setSelectedUniversityId] = useState<Id<"universities"> | null>(null);
    const [selectedUniversityName, setSelectedUniversityName] = useState("");
    const [uniDropdownOpen, setUniDropdownOpen] = useState(false);
    const [teachingScope, setTeachingScope] = useState<TeachingScope[]>([]);

    // Step 4 — What do you teach?
    const [courseQuery, setCourseQuery] = useState("");
    const [selectedCourseId, setSelectedCourseId] = useState<Id<"university_courses"> | null>(null);
    const [selectedCourseName, setSelectedCourseName] = useState("");
    const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
    const [nonUniSubjectInput, setNonUniSubjectInput] = useState("");
    const [nonUniSubjects, setNonUniSubjects] = useState<string[]>([]);

    // Step 5 — Contact & Rates
    const [personalEmail, setPersonalEmail] = useState("");
    const [whatsappNumber, setWhatsappNumber] = useState("");
    const [minRate, setMinRate] = useState("500");
    const [helpTypes, setHelpTypes] = useState<string[]>([]);

    // Step 6 — Credentials
    const [credType, setCredType] = useState<CredentialType | null>(null);
    // SAT
    const [satTotal, setSatTotal] = useState("");
    const [satEBRW, setSatEBRW] = useState("");
    const [satMath, setSatMath] = useState("");
    const [satDate, setSatDate] = useState("");
    // O/A-Level
    const [candidateNumber, setCandidateNumber] = useState("");
    const [examSession, setExamSession] = useState("");
    const [subjectRows, setSubjectRows] = useState<SubjectRow[]>([{ name: "", grade: "" }]);
    // University
    const [institutionName, setInstitutionName] = useState("");
    const [degreeTitle, setDegreeTitle] = useState("");
    const [gpa, setGpa] = useState("");
    const [gpaScale, setGpaScale] = useState("4.0");
    const [currentSemester, setCurrentSemester] = useState("");
    // File upload
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [uploadedStorageId, setUploadedStorageId] = useState<Id<"_storage"> | null>(null);
    const [isUploadingFile, setIsUploadingFile] = useState(false);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const router = useRouter();
    const completeOnboarding = useMutation(api.users.completeOnboarding);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- new modules; run `npx convex dev` to regenerate types
    const submitCredential = useMutation((api as any).credentials.submitCredential);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const generateUploadUrl = useMutation((api as any).credentials.generateUploadUrl);
    const { setRole: setContextRole } = useRole();

    // Queries
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const universities = useQuery((api as any).universities.search, { query: uniQuery }) as Array<{ _id: string; name: string; city: string; shortName: string }> | undefined;
    const courses = useQuery(api.university_courses.search, { query: courseQuery });

    const isTutor = role === "tutor";
    const totalSteps = isTutor ? 6 : 3;
    const progress = (step / totalSteps) * 100;

    // ── Toggle helpers ────────────────────────────────────────
    const toggleScope = (scope: TeachingScope) => {
        setTeachingScope((prev) =>
            prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
        );
    };

    const toggleHelpType = (ht: string) => {
        setHelpTypes((prev) =>
            prev.includes(ht) ? prev.filter((h) => h !== ht) : [...prev, ht]
        );
    };

    // ── Non-uni subject tag helpers ───────────────────────────
    const addNonUniSubject = () => {
        const trimmed = nonUniSubjectInput.trim();
        if (trimmed && !nonUniSubjects.includes(trimmed)) {
            setNonUniSubjects((p) => [...p, trimmed]);
            setNonUniSubjectInput("");
        }
    };

    // ── File upload helper ────────────────────────────────────
    const handleFileChange = useCallback(async (file: File) => {
        const MAX_MB = 10;
        if (file.size > MAX_MB * 1024 * 1024) {
            toast.error(`File too large (max ${MAX_MB} MB)`);
            return;
        }
        const allowed = ["application/pdf", "image/jpeg", "image/png", "image/heic"];
        if (!allowed.includes(file.type)) {
            toast.error("Unsupported file type. Use PDF, JPG, PNG, or HEIC.");
            return;
        }
        setUploadedFile(file);
        setIsUploadingFile(true);
        try {
            const uploadUrl = await generateUploadUrl();
            const result = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            if (!result.ok) throw new Error("Upload failed");
            const { storageId } = await result.json() as { storageId: Id<"_storage"> };
            setUploadedStorageId(storageId);
            toast.success("Document uploaded!");
        } catch {
            toast.error("Upload failed. You can skip this for now.");
            setUploadedFile(null);
            setUploadedStorageId(null);
        } finally {
            setIsUploadingFile(false);
        }
    }, [generateUploadUrl]);

    // ── Validation ────────────────────────────────────────────
    const validateStep = (s: number): boolean => {
        const newErrors: Record<string, string> = {};

        if (s === 1 && !role) {
            newErrors.role = "Please select how you plan to use Peer.";
        }

        if (s === 2 && isTutor && bio.trim().length < 10) {
            newErrors.bio = "Bio must be at least 10 characters for tutors.";
        }

        if (s === 3 && isTutor) {
            if (teachingScope.length === 0) {
                newErrors.scope = "Select at least one teaching scope.";
            }
        }

        if (s === 5 && isTutor) {
            if (!personalEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalEmail)) {
                newErrors.personalEmail = "Enter a valid email address.";
            }
            if (!whatsappNumber.trim() || !/^\+?\d{10,15}$/.test(whatsappNumber.replace(/[\s-]/g, ""))) {
                newErrors.whatsappNumber = "Enter a valid phone number (10–15 digits).";
            }
            const rate = Number(minRate);
            if (isNaN(rate) || rate < 0) {
                newErrors.minRate = "Enter a valid rate (0 or above).";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (!validateStep(step)) return;
        if (step < totalSteps) setStep(step + 1);
        else handleSubmit(false);
    };

    const handleBack = () => {
        if (step > 1) { setErrors({}); setStep(step - 1); }
    };

    // ── Submit (called from last step) ────────────────────────
    const handleSubmit = async (skipCredentials = false) => {
        if (isSubmitting || !role) return;
        setIsSubmitting(true);
        try {
            await completeOnboarding({
                role,
                bio: bio.trim(),
                universityId: selectedUniversityId ?? undefined,
                teachingScope: isTutor ? teachingScope : undefined,
                personalEmail: isTutor ? personalEmail.trim() : undefined,
                whatsappNumber: isTutor ? whatsappNumber.trim() : undefined,
                helpTypes: isTutor ? helpTypes as any : undefined,
                minRate: isTutor ? Number(minRate) : undefined,
            });

            // Submit credential if tutor has filled one in (and not skipping)
            if (isTutor && !skipCredentials && credType) {
                try {
                    await submitCredential({
                        credentialType: credType,
                        // SAT
                        satTotalScore: satTotal ? Number(satTotal) : undefined,
                        satReadingWritingScore: satEBRW ? Number(satEBRW) : undefined,
                        satMathScore: satMath ? Number(satMath) : undefined,
                        satTestDate: satDate || undefined,
                        // O/A-Level
                        candidateNumber: candidateNumber || undefined,
                        examSession: examSession || undefined,
                        subjects: credType === "o_level" || credType === "a_level"
                            ? subjectRows.filter((r) => r.name && r.grade)
                            : undefined,
                        // University
                        institutionName: institutionName || selectedUniversityName || undefined,
                        universityId: selectedUniversityId ?? undefined,
                        degreeTitle: degreeTitle || undefined,
                        gpa: gpa ? Number(gpa) : undefined,
                        gpaScale: gpaScale ? Number(gpaScale) : undefined,
                        currentSemester: currentSemester || undefined,
                        // Document
                        storageId: uploadedStorageId ?? undefined,
                        fileName: uploadedFile?.name,
                        mimeType: uploadedFile?.type,
                    });
                } catch {
                    // credential submission failure is non-fatal
                    toast.warning("Profile saved, but credential submission failed. Try again from your profile.");
                }
            }

            setContextRole(role);
            toast.success("Welcome to Peer! 🎉");
            router.push(role === "student" ? "/dashboard/buyer" : "/dashboard/seller");
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Step 1: Role Selection ────────────────────────────────
    const renderRoleStep = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">How do you plan to use Peer?</h3>
            <p className="text-sm text-muted-foreground">You can always switch roles later.</p>
            <RadioGroup
                value={role ?? ""}
                onValueChange={(v) => { setRole(v as "student" | "tutor"); setErrors({}); }}
            >
                <label
                    htmlFor="student"
                    className={`flex items-start gap-4 border p-4 rounded-xl cursor-pointer transition-all ${
                        role === "student" ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "hover:bg-muted/50"
                    }`}
                >
                    <RadioGroupItem value="student" id="student" className="mt-1" />
                    <div className="flex-1">
                        <div className="flex items-center gap-2 font-semibold">
                            <GraduationCap className="h-5 w-5 text-blue-500" />
                            I&apos;m a Student
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                            Post tickets, find tutors, and get help with your coursework.
                        </div>
                    </div>
                </label>
                <label
                    htmlFor="tutor"
                    className={`flex items-start gap-4 border p-4 rounded-xl cursor-pointer transition-all ${
                        role === "tutor" ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "hover:bg-muted/50"
                    }`}
                >
                    <RadioGroupItem value="tutor" id="tutor" className="mt-1" />
                    <div className="flex-1">
                        <div className="flex items-center gap-2 font-semibold">
                            <BookOpen className="h-5 w-5 text-emerald-500" />
                            I&apos;m a Tutor
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                            Offer tutoring, help students, and earn money doing what you love.
                        </div>
                    </div>
                </label>
            </RadioGroup>
            {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
        </div>
    );

    // ── Step 2: Your Profile ──────────────────────────────────
    const renderProfileStep = () => (
        <div className="space-y-5">
            <h3 className="text-lg font-semibold">Your Profile</h3>

            {/* Profile photo preview */}
            {clerkUser?.imageUrl && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={clerkUser.imageUrl} alt="Profile photo" className="h-12 w-12 rounded-full object-cover" />
                    <div>
                        <p className="text-sm font-medium">Profile photo</p>
                        <p className="text-xs text-muted-foreground">
                            Using your sign-up photo. Update it any time in Settings.
                        </p>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="bio">
                    Bio {isTutor && <span className="text-destructive">*</span>}
                </Label>
                <Textarea
                    id="bio"
                    placeholder={
                        isTutor
                            ? "Hi! I'm a CS senior at LUMS. I love teaching data structures and algorithms..."
                            : "A little about yourself (optional)"
                    }
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    maxLength={1000}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                    {errors.bio
                        ? <span className="text-destructive">{errors.bio}</span>
                        : <span>Visible on your profile.</span>
                    }
                    <span>{bio.length}/1000</span>
                </div>
            </div>

            {/* Students enter university here */}
            {!isTutor && (
                <div className="space-y-2">
                    <Label htmlFor="stuUni">University <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="stuUni"
                            className="pl-9"
                            placeholder="Search your university..."
                            value={uniQuery || selectedUniversityName}
                            onChange={(e) => {
                                setUniQuery(e.target.value);
                                setSelectedUniversityId(null);
                                setSelectedUniversityName("");
                                setUniDropdownOpen(true);
                            }}
                            onFocus={() => setUniDropdownOpen(true)}
                            onBlur={() => setTimeout(() => setUniDropdownOpen(false), 150)}
                        />
                    </div>
                    {uniDropdownOpen && universities && universities.length > 0 && (
                        <div className="border rounded-lg shadow-sm bg-background max-h-48 overflow-y-auto">
                            {universities.map((u) => (
                                <button
                                    key={u._id}
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex justify-between"
                                    onMouseDown={() => {
                                        setSelectedUniversityId(u._id as Id<"universities">);
                                        setSelectedUniversityName(u.name);
                                        setUniQuery("");
                                        setUniDropdownOpen(false);
                                    }}
                                >
                                    <span>{u.name}</span>
                                    <span className="text-xs text-muted-foreground">{u.city}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    {selectedUniversityName && (
                        <Badge variant="secondary" className="gap-1 pr-1">
                            {selectedUniversityName}
                            <button type="button" onClick={() => { setSelectedUniversityId(null); setSelectedUniversityName(""); }}>
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}
                </div>
            )}
        </div>
    );

    // ── Step 3: Where do you teach? (tutor only) ──────────────
    const renderWhereStep = () => (
        <div className="space-y-5">
            <h3 className="text-lg font-semibold">Where do you teach?</h3>
            <p className="text-sm text-muted-foreground">
                Select your university and the types of curricula you cover.
            </p>

            {/* University dropdown */}
            <div className="space-y-2">
                <Label>University <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-9"
                        placeholder="Search your university..."
                        value={uniQuery || (selectedUniversityId ? selectedUniversityName : uniQuery)}
                        onChange={(e) => {
                            setUniQuery(e.target.value);
                            setSelectedUniversityId(null);
                            setSelectedUniversityName("");
                            setUniDropdownOpen(true);
                        }}
                        onFocus={() => setUniDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setUniDropdownOpen(false), 150)}
                    />
                </div>
                {uniDropdownOpen && universities && universities.length > 0 && !selectedUniversityId && (
                    <div className="border rounded-lg shadow-sm bg-background max-h-48 overflow-y-auto">
                        {universities.map((u) => (
                            <button
                                key={u._id}
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex justify-between"
                                onMouseDown={() => {
                                    setSelectedUniversityId(u._id as Id<"universities">);
                                    setSelectedUniversityName(u.name);
                                    setUniQuery("");
                                    setUniDropdownOpen(false);
                                }}
                            >
                                <span>{u.name}</span>
                                <span className="text-xs text-muted-foreground">{u.city}</span>
                            </button>
                        ))}
                    </div>
                )}
                {selectedUniversityName && (
                    <Badge variant="secondary" className="gap-1 pr-1">
                        {selectedUniversityName}
                        <button type="button" onClick={() => { setSelectedUniversityId(null); setSelectedUniversityName(""); setUniQuery(""); }}>
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                )}
            </div>

            {/* Teaching scope chips */}
            <div className="space-y-2">
                <Label>Teaching scope <span className="text-destructive">*</span></Label>
                <div className="flex flex-wrap gap-2">
                    {SCOPE_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => toggleScope(opt.value)}
                            className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                                teachingScope.includes(opt.value)
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background hover:bg-muted/50"
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
                {errors.scope && <p className="text-xs text-destructive">{errors.scope}</p>}
            </div>
        </div>
    );

    // ── Step 4: What do you teach? (tutor only) ───────────────
    const renderWhatStep = () => (
        <div className="space-y-5">
            <h3 className="text-lg font-semibold">What do you teach?</h3>

            {/* University course search */}
            {teachingScope.includes("university") && (
                <div className="space-y-2">
                    <Label>University Course</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            className="pl-9"
                            placeholder="Search by course code e.g. CS 200"
                            value={courseQuery || (selectedCourseId ? selectedCourseName : courseQuery)}
                            onChange={(e) => {
                                setCourseQuery(e.target.value);
                                setSelectedCourseId(null);
                                setSelectedCourseName("");
                                setCourseDropdownOpen(true);
                            }}
                            onFocus={() => setCourseDropdownOpen(true)}
                            onBlur={() => setTimeout(() => setCourseDropdownOpen(false), 150)}
                        />
                    </div>
                    {courseDropdownOpen && courses && courses.length > 0 && !selectedCourseId && (
                        <div className="border rounded-lg shadow-sm bg-background max-h-48 overflow-y-auto">
                            {(courses as Array<{ _id: Id<"university_courses">; code: string; name: string; department?: string }>).map((c) => (
                                <button
                                    key={c._id}
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50"
                                    onMouseDown={() => {
                                        setSelectedCourseId(c._id);
                                        setSelectedCourseName(`${c.code} — ${c.name}`);
                                        setCourseQuery("");
                                        setCourseDropdownOpen(false);
                                    }}
                                >
                                    <span className="font-medium">{c.code}</span>
                                    <span className="text-muted-foreground ml-2">{c.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    {selectedCourseName && (
                        <Badge variant="secondary" className="gap-1 pr-1">
                            {selectedCourseName}
                            <button type="button" onClick={() => { setSelectedCourseId(null); setSelectedCourseName(""); setCourseQuery(""); }}>
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}
                    <p className="text-xs text-muted-foreground">You can add more courses from your profile after onboarding.</p>
                </div>
            )}

            {/* Non-university subjects */}
            {teachingScope.some((s) => s !== "university") && (
                <div className="space-y-2">
                    <Label>
                        Subjects for{" "}
                        {teachingScope
                            .filter((s) => s !== "university")
                            .map((s) => SCOPE_OPTIONS.find((o) => o.value === s)?.label)
                            .join(", ")}
                    </Label>
                    <div className="flex gap-2">
                        <Input
                            placeholder="e.g. Mathematics, Physics, Chemistry"
                            value={nonUniSubjectInput}
                            onChange={(e) => setNonUniSubjectInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addNonUniSubject(); } }}
                        />
                        <Button type="button" variant="outline" size="icon" onClick={addNonUniSubject}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    {nonUniSubjects.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {nonUniSubjects.map((s) => (
                                <Badge key={s} variant="secondary" className="gap-1 pr-1">
                                    {s}
                                    <button type="button" onClick={() => setNonUniSubjects((p) => p.filter((x) => x !== s))}>
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    // ── Step 5: Contact & Rates (tutor only) ──────────────────
    const renderContactStep = () => (
        <div className="space-y-5">
            <h3 className="text-lg font-semibold">Contact & Rates</h3>

            <div className="space-y-2">
                <Label htmlFor="personalEmail">Personal Email <span className="text-destructive">*</span></Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="personalEmail" type="email" placeholder="you@gmail.com"
                        value={personalEmail} onChange={(e) => setPersonalEmail(e.target.value)}
                        className="pl-10"
                    />
                </div>
                {errors.personalEmail
                    ? <p className="text-xs text-destructive">{errors.personalEmail}</p>
                    : <p className="text-xs text-muted-foreground">We&apos;ll contact you here for admin matters.</p>
                }
            </div>

            <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp Number <span className="text-destructive">*</span></Label>
                <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="whatsapp" type="tel" placeholder="+92 300 1234567"
                        value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)}
                        className="pl-10"
                    />
                </div>
                {errors.whatsappNumber
                    ? <p className="text-xs text-destructive">{errors.whatsappNumber}</p>
                    : <p className="text-xs text-muted-foreground">Our primary way of reaching you.</p>
                }
            </div>

            <div className="space-y-2">
                <Label htmlFor="minRate">Minimum Rate (PKR/hr)</Label>
                <Input
                    id="minRate" type="number" min={0} placeholder="500"
                    value={minRate} onChange={(e) => setMinRate(e.target.value)}
                />
                {errors.minRate && <p className="text-xs text-destructive">{errors.minRate}</p>}
            </div>

            <div className="space-y-2">
                <Label>Types of help you offer</Label>
                <div className="flex flex-wrap gap-2">
                    {HELP_TYPE_OPTIONS.map((ht) => (
                        <button
                            key={ht.value}
                            type="button"
                            onClick={() => toggleHelpType(ht.value)}
                            className={`px-3 py-1.5 rounded-full border text-sm transition-all ${
                                helpTypes.includes(ht.value)
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background hover:bg-muted/50"
                            }`}
                        >
                            {ht.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    // ── Step 6: Credentials (tutor only) ─────────────────────
    const renderCredentialsStep = () => (
        <div className="space-y-5">
            <h3 className="text-lg font-semibold">Your Credentials</h3>
            <p className="text-sm text-muted-foreground">
                Adding verified credentials builds trust with students and unlocks a
                <span className="font-medium text-foreground"> Verified badge</span>.
                You can always add more later from your profile.
            </p>

            {/* Credential type chips */}
            <div className="space-y-2">
                <Label>Credential type</Label>
                <div className="flex flex-wrap gap-2">
                    {CREDENTIAL_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setCredType(credType === opt.value ? null : opt.value)}
                            className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                                credType === opt.value
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background hover:bg-muted/50"
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* SAT fields */}
            {credType === "sat" && (
                <div className="space-y-3 p-3 border rounded-lg bg-muted/20">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Total Score</Label>
                            <Input type="number" placeholder="1520" value={satTotal} onChange={(e) => setSatTotal(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">EBRW Score</Label>
                            <Input type="number" placeholder="760" value={satEBRW} onChange={(e) => setSatEBRW(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Math Score</Label>
                            <Input type="number" placeholder="760" value={satMath} onChange={(e) => setSatMath(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Test Date</Label>
                            <Input placeholder="March 2023" value={satDate} onChange={(e) => setSatDate(e.target.value)} />
                        </div>
                    </div>
                </div>
            )}

            {/* O-Level / A-Level fields */}
            {(credType === "o_level" || credType === "a_level") && (
                <div className="space-y-3 p-3 border rounded-lg bg-muted/20">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Candidate Number</Label>
                            <Input placeholder="CN-12345" value={candidateNumber} onChange={(e) => setCandidateNumber(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Exam Session</Label>
                            <Input placeholder="May/June 2022" value={examSession} onChange={(e) => setExamSession(e.target.value)} />
                        </div>
                    </div>
                    <Label className="text-xs">Subjects</Label>
                    {subjectRows.map((row, i) => (
                        <div key={i} className="flex gap-2 items-center">
                            <Input
                                className="flex-1" placeholder="Subject name"
                                value={row.name}
                                onChange={(e) => setSubjectRows((p) => p.map((r, j) => j === i ? { ...r, name: e.target.value } : r))}
                            />
                            <Input
                                className="w-20" placeholder="Grade"
                                value={row.grade}
                                onChange={(e) => setSubjectRows((p) => p.map((r, j) => j === i ? { ...r, grade: e.target.value } : r))}
                            />
                            {credType === "a_level" && (
                                <Input
                                    className="w-20" placeholder="AS/A2"
                                    value={row.level ?? ""}
                                    onChange={(e) => setSubjectRows((p) => p.map((r, j) => j === i ? { ...r, level: e.target.value } : r))}
                                />
                            )}
                            {subjectRows.length > 1 && (
                                <button type="button" onClick={() => setSubjectRows((p) => p.filter((_, j) => j !== i))}>
                                    <X className="h-4 w-4 text-muted-foreground" />
                                </button>
                            )}
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => setSubjectRows((p) => [...p, { name: "", grade: "" }])}>
                        <Plus className="h-3 w-3 mr-1" /> Add subject
                    </Button>
                </div>
            )}

            {/* University transcript / degree */}
            {(credType === "university_transcript" || credType === "university_degree") && (
                <div className="space-y-3 p-3 border rounded-lg bg-muted/20">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1 col-span-2">
                            <Label className="text-xs">Institution Name</Label>
                            <Input placeholder="LUMS" value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} />
                        </div>
                        <div className="space-y-1 col-span-2">
                            <Label className="text-xs">Degree / Program</Label>
                            <Input placeholder="BS Computer Science" value={degreeTitle} onChange={(e) => setDegreeTitle(e.target.value)} />
                        </div>
                        {credType === "university_transcript" && (
                            <>
                                <div className="space-y-1">
                                    <Label className="text-xs">GPA</Label>
                                    <Input type="number" step="0.01" placeholder="3.7" value={gpa} onChange={(e) => setGpa(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Scale</Label>
                                    <Input placeholder="4.0" value={gpaScale} onChange={(e) => setGpaScale(e.target.value)} />
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <Label className="text-xs">Current Semester (if enrolled)</Label>
                                    <Input placeholder="Semester 6" value={currentSemester} onChange={(e) => setCurrentSemester(e.target.value)} />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* File upload zone */}
            {credType && (
                <div className="space-y-2">
                    <Label
                        htmlFor="credDoc"
                        className={`block border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
                            uploadedFile ? "border-primary/50 bg-primary/5" : "hover:bg-muted/30"
                        }`}
                    >
                        {uploadedFile ? (
                            <div className="flex items-center justify-center gap-2 text-sm">
                                <FileText className="h-5 w-5 text-primary" />
                                <span className="font-medium">{uploadedFile.name}</span>
                                <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); setUploadedFile(null); setUploadedStorageId(null); }}
                                    className="text-muted-foreground hover:text-destructive"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                    {isUploadingFile ? "Uploading…" : "Drag & drop or click to upload"}
                                </p>
                                <p className="text-xs text-muted-foreground">PDF, JPG, PNG, HEIC · max 10 MB</p>
                            </div>
                        )}
                        <input
                            id="credDoc"
                            type="file"
                            className="sr-only"
                            accept=".pdf,.jpg,.jpeg,.png,.heic"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileChange(f); }}
                        />
                    </Label>
                    {!uploadedFile && (
                        <p className="text-xs text-muted-foreground">
                            You can upload credentials later from your profile to earn a Verified badge and boost your win rate.
                        </p>
                    )}
                </div>
            )}
        </div>
    );

    // ── Confirmation step (last for students) ────────────────
    const renderConfirmationStep = () => (
        <div className="space-y-6 text-center py-4">
            <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-4">
                    <CheckCircle2 className="h-12 w-12 text-primary" />
                </div>
            </div>
            <div className="space-y-2">
                <h3 className="text-xl font-semibold">You&apos;re all set!</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                    {isTutor
                        ? "Your tutor profile is ready. Students will be able to find you and request help."
                        : "Your profile is ready. Start exploring tutors and posting tickets for help."}
                </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4 text-left space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Role</span>
                    <Badge variant={isTutor ? "success" : "info"}>
                        {isTutor ? "Tutor" : "Student"}
                    </Badge>
                </div>
                {bio && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Bio</span>
                        <span className="text-right max-w-[200px] truncate">{bio}</span>
                    </div>
                )}
                {selectedUniversityName && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">University</span>
                        <span>{selectedUniversityName}</span>
                    </div>
                )}
                {isTutor && teachingScope.length > 0 && (
                    <div className="flex justify-between items-start">
                        <span className="text-muted-foreground">Scope</span>
                        <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                            {teachingScope.map((s) => (
                                <Badge key={s} variant="outline" className="text-xs">
                                    {SCOPE_OPTIONS.find((o) => o.value === s)?.label}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    // ── Route to correct step renderer ───────────────────────
    const renderStep = () => {
        if (step === 1) return renderRoleStep();
        if (step === 2) return renderProfileStep();
        if (isTutor) {
            if (step === 3) return renderWhereStep();
            if (step === 4) return renderWhatStep();
            if (step === 5) return renderContactStep();
            if (step === 6) return renderCredentialsStep();
        }
        // Student step 3 or tutor fallback
        return renderConfirmationStep();
    };

    const stepLabel = () => {
        if (step === 1) return "Who are you?";
        if (step === 2) return "Your Profile";
        if (isTutor) {
            if (step === 3) return "Where do you teach?";
            if (step === 4) return "What do you teach?";
            if (step === 5) return "Contact & Rates";
            if (step === 6) return "Your Credentials";
        }
        return "Finish";
    };

    const isLastStep = step === totalSteps;

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/20 p-4">
            <Card className="w-full max-w-lg glass-card">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <CardTitle>Welcome to Peer</CardTitle>
                    </div>
                    <CardDescription>
                        Step {step} of {totalSteps} &mdash; {stepLabel()}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Progress value={progress} className="w-full" />
                    {renderStep()}
                </CardContent>
                <CardFooter className={`flex ${isTutor && step === 6 ? "flex-col gap-2" : "justify-between"}`}>
                    {/* Credentials "Skip" button */}
                    {isTutor && step === 6 && (
                        <div className="w-full space-y-1">
                            <Button
                                variant="ghost"
                                className="w-full text-muted-foreground"
                                onClick={() => handleSubmit(true)}
                                disabled={isSubmitting}
                            >
                                Skip for now — browse open jobs immediately
                            </Button>
                            <p className="text-center text-xs text-muted-foreground">
                                Upload credentials later from your profile to earn a Verified badge and win more bids.
                            </p>
                        </div>
                    )}

                    <div className="flex justify-between w-full">
                        <Button variant="outline" onClick={handleBack} disabled={step === 1}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <Button
                            onClick={handleNext}
                            className="neo-button"
                            disabled={isSubmitting || isUploadingFile}
                        >
                            {isLastStep ? (
                                isSubmitting ? "Setting up…" : "Finish"
                            ) : (
                                <>
                                    Next
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </>
                            )}
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
