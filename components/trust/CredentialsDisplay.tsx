"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { CheckCircle2, GraduationCap, BookOpen, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

interface CredentialsDisplayProps {
    userId: Id<"users">;
    className?: string;
}

type CredentialType =
    | "o_level"
    | "a_level"
    | "sat"
    | "ib"
    | "ap"
    | "university_transcript"
    | "university_degree"
    | "other_certificate";

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

function CredentialIcon({ type }: { type: CredentialType }) {
    if (type === "sat" || type === "ib" || type === "ap")
        return <FlaskConical className="h-4 w-4 text-violet-500 shrink-0" />;
    if (type === "university_transcript" || type === "university_degree")
        return <GraduationCap className="h-4 w-4 text-blue-500 shrink-0" />;
    return <BookOpen className="h-4 w-4 text-emerald-500 shrink-0" />;
}

function CredentialSummary({ cred }: { cred: Record<string, unknown> }) {
    const type = cred.credentialType as CredentialType;
    const s = (v: unknown) => String(v ?? "");

    if (type === "sat") {
        return (
            <span className="text-sm text-muted-foreground">
                Score: <span className="font-medium text-foreground">{s(cred.satTotalScore)} / 1600</span>
                {cred.satTestDate ? (
                    <span className="ml-2">&bull; {s(cred.satTestDate)}</span>
                ) : null}
            </span>
        );
    }

    if (type === "ib") {
        return (
            <span className="text-sm text-muted-foreground">
                Total: <span className="font-medium text-foreground">{s(cred.ibTotalPoints)} / 45</span>
            </span>
        );
    }

    if (type === "o_level" || type === "a_level") {
        const subjects = (cred.subjects as Array<{ name: string; grade: string; level?: string }>) ?? [];
        if (subjects.length === 0) return null;
        return (
            <span className="text-sm text-muted-foreground">
                {subjects.slice(0, 4).map((sub) => `${sub.name} ${sub.grade}`).join(" \u00b7 ")}
                {subjects.length > 4 ? ` \u00b7 +${subjects.length - 4} more` : null}
            </span>
        );
    }

    if (type === "university_transcript" || type === "university_degree") {
        return (
            <span className="text-sm text-muted-foreground">
                {s(cred.institutionName)}
                {cred.degreeTitle ? <span> &middot; {s(cred.degreeTitle)}</span> : null}
                {cred.gpa ? (
                    <span> &middot; GPA {s(cred.gpa)}/{cred.gpaScale != null ? s(cred.gpaScale) : "4"}</span>
                ) : null}
                {cred.currentSemester ? <span> (current)</span> : null}
            </span>
        );
    }

    if (type === "ap") {
        const ap = (cred.apSubjects as Array<{ name: string; score: number }>) ?? [];
        if (ap.length === 0) return null;
        return (
            <span className="text-sm text-muted-foreground">
                {ap.slice(0, 3).map((sub) => `${sub.name} ${sub.score}`).join(" \u00b7 ")}
                {ap.length > 3 ? ` \u00b7 +${ap.length - 3} more` : null}
            </span>
        );
    }

    return null;
}

export default function CredentialsDisplay({ userId, className }: CredentialsDisplayProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const credentials = useQuery((api as any).credentials.getPublicCredentials, { userId }) as
        | Record<string, unknown>[]
        | undefined;

    if (!credentials || credentials.length === 0) return null;

    return (
        <div className={cn("space-y-2", className)}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Verified Credentials
            </h3>
            <div className="space-y-2">
                {credentials.map((cred) => (
                    <div
                        key={cred._id as string}
                        className="flex items-start gap-3 rounded-lg border bg-muted/30 px-3 py-2.5"
                    >
                        <CredentialIcon type={cred.credentialType as CredentialType} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                    {TYPE_LABEL[cred.credentialType as CredentialType]}
                                </span>
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            </div>
                            <CredentialSummary cred={cred} />
                        </div>
                        {cred.examSession ? (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {String(cred.examSession)}
                            </span>
                        ) : null}
                    </div>
                ))}
            </div>
        </div>
    );
}
