"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, RotateCcw, ChevronDown, ExternalLink, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type CredentialType =
    | "o_level" | "a_level" | "sat" | "ib" | "ap"
    | "university_transcript" | "university_degree" | "other_certificate";

const TYPE_LABEL: Record<CredentialType, string> = {
    o_level: "O-Level",
    a_level: "A-Level",
    sat: "SAT",
    ib: "IB",
    ap: "AP",
    university_transcript: "University Transcript",
    university_degree: "University Degree",
    other_certificate: "Certificate",
};

const REJECTION_REASONS = [
    "Document doesn't match declared data",
    "Image too blurry / unreadable",
    "Suspicious or edited document",
    "Wrong document type",
    "Incomplete document",
];

function CredentialDetails({ cred }: { cred: Record<string, unknown> }) {
    const type = cred.credentialType as CredentialType;
    const s = (v: unknown) => String(v ?? "");

    if (type === "sat") {
        return (
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                <div><span className="text-muted-foreground">Total:</span> <strong>{s(cred.satTotalScore)} / 1600</strong></div>
                <div><span className="text-muted-foreground">EBRW:</span> {s(cred.satReadingWritingScore)}</div>
                <div><span className="text-muted-foreground">Math:</span> {s(cred.satMathScore)}</div>
                {cred.satTestDate ? <div><span className="text-muted-foreground">Date:</span> {s(cred.satTestDate)}</div> : null}
            </div>
        );
    }

    if (type === "ib") {
        const subjects = (cred.ibSubjects as Array<{ name: string; level: string; grade: number }>) ?? [];
        return (
            <div className="text-sm space-y-1">
                <div><span className="text-muted-foreground">Total Points:</span> <strong>{s(cred.ibTotalPoints)} / 45</strong></div>
                {subjects.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                        {subjects.map((sub, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                                {sub.name} ({sub.level}) — {sub.grade}
                            </Badge>
                        ))}
                    </div>
                ) : null}
            </div>
        );
    }

    if (type === "o_level" || type === "a_level") {
        const subjects = (cred.subjects as Array<{ name: string; grade: string; level?: string }>) ?? [];
        return (
            <div className="text-sm space-y-1">
                {cred.candidateNumber ? <div><span className="text-muted-foreground">Candidate:</span> {s(cred.candidateNumber)}</div> : null}
                {cred.examSession ? <div><span className="text-muted-foreground">Session:</span> {s(cred.examSession)}</div> : null}
                {subjects.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                        {subjects.map((sub, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                                {sub.name} — {sub.grade}{sub.level ? ` (${sub.level})` : ""}
                            </Badge>
                        ))}
                    </div>
                ) : null}
            </div>
        );
    }

    if (type === "university_transcript" || type === "university_degree") {
        return (
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                {cred.institutionName ? <div><span className="text-muted-foreground">Institution:</span> {s(cred.institutionName)}</div> : null}
                {cred.degreeTitle ? <div><span className="text-muted-foreground">Degree:</span> {s(cred.degreeTitle)}</div> : null}
                {cred.gpa ? <div><span className="text-muted-foreground">GPA:</span> {s(cred.gpa)}/{cred.gpaScale != null ? s(cred.gpaScale) : "4"}</div> : null}
                {cred.currentSemester ? <div><span className="text-muted-foreground">Semester:</span> {s(cred.currentSemester)}</div> : null}
                {cred.graduationYear ? <div><span className="text-muted-foreground">Graduation:</span> {s(cred.graduationYear)}</div> : null}
            </div>
        );
    }

    if (type === "ap") {
        const ap = (cred.apSubjects as Array<{ name: string; score: number; year: string }>) ?? [];
        return (
            <div className="flex flex-wrap gap-1">
                {ap.map((sub, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                        {sub.name} — {sub.score} ({sub.year})
                    </Badge>
                ))}
            </div>
        );
    }

    return <p className="text-sm text-muted-foreground">No structured data.</p>;
}

interface VerificationItemProps {
    cred: Record<string, unknown>;
    onReviewed: () => void;
}

function VerificationItem({ cred, onReviewed }: VerificationItemProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reviewCredential = useMutation((api as any).credentials.reviewCredential);
    const [rejectReason, setRejectReason] = useState("");
    const [adminNotes, setAdminNotes] = useState("");
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [showResubmitForm, setShowResubmitForm] = useState(false);
    const [isActing, setIsActing] = useState(false);

    const act = async (
        decision: "approved" | "rejected" | "needs_resubmit",
        reason?: string,
    ) => {
        setIsActing(true);
        try {
            await reviewCredential({
                credentialId: cred._id as Id<"tutor_credentials">,
                decision,
                rejectionReason: reason,
                adminNotes: adminNotes || undefined,
            });
            toast.success(
                decision === "approved"
                    ? "Credential approved ✓"
                    : decision === "rejected"
                    ? "Credential rejected"
                    : "Resubmission requested",
            );
            onReviewed();
        } catch {
            toast.error("Action failed");
        } finally {
            setIsActing(false);
        }
    };

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-3 border-b bg-muted/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={String(cred.tutorImage ?? "")} />
                            <AvatarFallback>{String(cred.tutorName ?? "?").charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-sm">{String(cred.tutorName ?? "Unknown")}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="secondary" className="text-xs">
                                    {TYPE_LABEL[cred.credentialType as CredentialType]}
                                </Badge>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDistanceToNow(new Date(cred.uploadedAt as number), { addSuffix: true })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-4 pb-4">
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Declared data */}
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                            Declared Data
                        </p>
                        <CredentialDetails cred={cred} />
                    </div>

                    {/* Document */}
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                            Document
                        </p>
                        {cred.fileUrl ? (
                            <div className="space-y-2">
                                <p className="text-xs text-muted-foreground truncate">{String(cred.fileName ?? "")}</p>
                                <a
                                    href={String(cred.fileUrl)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Open document
                                </a>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">No document uploaded</p>
                        )}
                    </div>
                </div>

                {/* Admin notes */}
                <div className="mt-4">
                    <Textarea
                        placeholder="Internal admin notes (not shown to tutor)…"
                        className="text-xs h-16"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                    />
                </div>

                {/* Reject form */}
                {showRejectForm && (
                    <div className="mt-3 space-y-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                        <p className="text-xs font-medium text-destructive">Select rejection reason:</p>
                        <div className="space-y-1">
                            {REJECTION_REASONS.map((r) => (
                                <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                        type="radio"
                                        name={`reject-${cred._id as string}`}
                                        value={r}
                                        checked={rejectReason === r}
                                        onChange={() => setRejectReason(r)}
                                        className="accent-destructive"
                                    />
                                    {r}
                                </label>
                            ))}
                        </div>
                        <div className="flex gap-2 mt-2">
                            <Button
                                size="sm"
                                variant="destructive"
                                disabled={!rejectReason || isActing}
                                onClick={() => act("rejected", rejectReason)}
                            >
                                Confirm Rejection
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setShowRejectForm(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}

                {/* Resubmit form */}
                {showResubmitForm && (
                    <div className="mt-3 space-y-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200">
                        <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                            Message to tutor (required):
                        </p>
                        <Textarea
                            placeholder="e.g. 'Image is too blurry to read the grades.'"
                            className="text-xs h-16"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-amber-400 text-amber-700 hover:bg-amber-50"
                                disabled={!rejectReason.trim() || isActing}
                                onClick={() => act("needs_resubmit", rejectReason)}
                            >
                                Send Request
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setShowResubmitForm(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}

                {/* Action buttons */}
                {!showRejectForm && !showResubmitForm && (
                    <div className="flex items-center gap-2 mt-4">
                        <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                            disabled={isActing}
                            onClick={() => act("approved")}
                        >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Approve
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline" className="gap-1" disabled={isActing}>
                                    <XCircle className="h-3.5 w-3.5 text-destructive" />
                                    Reject
                                    <ChevronDown className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuItem onClick={() => setShowRejectForm(true)}>
                                    Reject with reason
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            disabled={isActing}
                            onClick={() => setShowResubmitForm(true)}
                        >
                            <RotateCcw className="h-3.5 w-3.5 text-amber-500" />
                            Ask to Resubmit
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function VerificationsQueue() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pending = useQuery((api as any).credentials.listPendingForReview) as
        | Record<string, unknown>[]
        | undefined;

    const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

    const displayItems = pending?.filter((c) => !reviewedIds.has(c._id as string));

    if (pending === undefined) {
        return <div className="py-8 text-center text-muted-foreground">Loading…</div>;
    }

    if (!displayItems || displayItems.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                    <p className="font-semibold">Queue is empty</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        No credentials pending review — great job!
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                    Pending Verifications
                    <Badge className="ml-2" variant="secondary">
                        {displayItems.length}
                    </Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">Oldest first · approve or reject each credential</p>
            </div>
            {displayItems.map((cred) => (
                <VerificationItem
                    key={cred._id as string}
                    cred={cred}
                    onReviewed={() =>
                        setReviewedIds((prev) => new Set([...prev, cred._id as string]))
                    }
                />
            ))}
        </div>
    );
}
