"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PortfolioSection from "@/components/portfolio/PortfolioSection";
import CoursesSection from "@/components/portfolio/CoursesSection";
import {
    Mail, Phone, Settings, Trash2, FileText, Upload,
    CheckCircle2, Clock, AlertTriangle, XCircle,
} from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
    const user = useQuery(api.users.currentUser);
    const updateUser = useMutation(api.users.update);
    const [bio, setBio] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const myOfferings = useQuery(api.tutor_offerings.listMyOfferings);
    const removeOffering = useMutation(api.tutor_offerings.remove);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const myCredentials = useQuery((api as any).credentials.listMyCredentials) as
        | Array<{ _id: string; credentialType: string; status: string; rejectionReason?: string; fileName?: string; examSession?: string; satTotalScore?: number; ibTotalPoints?: number; gpa?: number; gpaScale?: number; institutionName?: string }>
        | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const generateUploadUrl = useMutation((api as any).credentials.generateUploadUrl);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uploadDocumentForCredential = useMutation((api as any).credentials.uploadDocumentForCredential);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deleteCredential = useMutation((api as any).credentials.deleteCredential);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeUploadCredId, setActiveUploadCredId] = useState<string | null>(null);
    const [isUploadingDoc, setIsUploadingDoc] = useState(false);

    const CRED_LABEL: Record<string, string> = {
        o_level: "O-Level", a_level: "A-Level", sat: "SAT", ib: "IB", ap: "AP",
        university_transcript: "University Transcript", university_degree: "University Degree",
        other_certificate: "Certificate",
    };

    // Helper to mask email: jo***@gmail.com
    const maskEmail = (email: string) => {
        const [local, domain] = email.split("@");
        if (!domain) return "***";
        return local.slice(0, 2) + "***@" + domain;
    };

    // Helper to mask phone: +92 3** ****567
    const maskPhone = (phone: string) => {
        const digits = phone.replace(/\D/g, "");
        if (digits.length < 6) return "***";
        return phone.slice(0, 4) + " ***" + phone.slice(-3);
    };

    useEffect(() => {
        if (user) {
            setBio(user.bio || "");
        }
    }, [user]);

    const handleFileUpload = useCallback(async (file: File, credentialId: string) => {
        const MAX_MB = 10;
        if (file.size > MAX_MB * 1024 * 1024) { toast.error(`File too large (max ${MAX_MB} MB)`); return; }
        const allowed = ["application/pdf", "image/jpeg", "image/png", "image/heic"];
        if (!allowed.includes(file.type)) { toast.error("Unsupported file type. Use PDF, JPG, PNG, or HEIC."); return; }
        setIsUploadingDoc(true);
        try {
            const uploadUrl = await generateUploadUrl();
            const result = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
            if (!result.ok) throw new Error("Upload failed");
            const { storageId } = await result.json() as { storageId: Id<"_storage"> };
            await uploadDocumentForCredential({ credentialId: credentialId as Id<"tutor_credentials">, storageId, fileName: file.name, mimeType: file.type });
            toast.success("Document uploaded — credential queued for review!");
        } catch {
            toast.error("Upload failed. Please try again.");
        } finally {
            setIsUploadingDoc(false);
            setActiveUploadCredId(null);
        }
    }, [generateUploadUrl, uploadDocumentForCredential]);

    const handleDeleteCredential = async (credentialId: string) => {
        try {
            await deleteCredential({ credentialId: credentialId as Id<"tutor_credentials"> });
            toast.success("Credential removed.");
        } catch {
            toast.error("Could not remove credential.");
        }
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            await updateUser({
                updates: {
                    bio
                }
            });
            toast.success("Profile updated successfully!");
        } catch (error) {
            toast.error("Failed to update profile");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (user === undefined) return <div className="p-10">Loading...</div>;
    if (user === null) return <div className="p-10">Not authenticated</div>;

    return (
        <div className="container mx-auto py-10 max-w-2xl">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">My Profile</h1>
                <Link
                    href="/settings"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <Settings className="h-4 w-4" />
                    Settings
                </Link>
            </div>

            <div className="flex items-center gap-6 mb-8">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={user.image} />
                    <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <h2 className="text-2xl font-semibold">{user.name}</h2>
                    <p className="text-gray-500">{user.email}</p>
                    <div className="mt-2 text-xs">
                        <Badge variant="info">Reputation: {user.reputation}</Badge>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="bio">
                        Bio / Pitch
                    </Label>
                    <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell others about your skills and courses you've aced..."
                        className="min-h-[150px]"
                    />
                </div>

                <Button onClick={handleSave} disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Profile"}
                </Button>
            </div>

            {/* Tutor Contact Info Card */}
            {user.role === "tutor" && (
                <div className="my-8 border-t pt-8">
                    <Card className="border-dashed">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Mail className="h-5 w-5 text-muted-foreground" />
                                Contact Info (Private)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Email:</span>
                                    <span>{(user as any).personalEmail
                                        ? maskEmail((user as any).personalEmail)
                                        : <span className="text-amber-600">Not set</span>}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">WhatsApp:</span>
                                    <span>{(user as any).whatsappNumber
                                        ? maskPhone((user as any).whatsappNumber)
                                        : <span className="text-amber-600">Not set</span>}
                                    </span>
                                </div>
                            </div>
                            <Link
                                href="/settings"
                                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-2"
                            >
                                <Settings className="h-3.5 w-3.5" />
                                Edit in Settings
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="my-8 border-t pt-8">
                <PortfolioSection userId={user._id} isOwner={true} />
            </div>

            <div className="my-8 border-t pt-8">
                <CoursesSection userId={user._id} isOwner={true} />
            </div>

            {/* My Teaching Subjects (tutors only) */}
            {user.role === "tutor" && myOfferings !== undefined && (
                <div className="my-8 border-t pt-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">My Teaching Subjects</h2>
                    </div>
                    {myOfferings.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No subjects added yet. You can add them during onboarding or contact support.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {myOfferings.map((offering) => (
                                <div
                                    key={offering._id}
                                    className="flex items-center justify-between gap-3 rounded-lg border px-4 py-2.5 bg-muted/30"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Badge variant="secondary" className="text-xs capitalize shrink-0">
                                            {offering.category.replace("_", "-")}
                                        </Badge>
                                        <span className="text-sm font-medium truncate">
                                            {(offering as Record<string, unknown>).courseName as string
                                                ?? (offering as Record<string, unknown>).courseCode as string
                                                ?? offering.customSubject
                                                ?? "—"}
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                                        onClick={() => removeOffering({ offeringId: offering._id })}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* My Documents / Credentials (tutors only) */}
            {user.role === "tutor" && (
                <div className="my-8 border-t pt-8">
                    <h2 className="text-xl font-semibold mb-4">My Credentials &amp; Documents</h2>

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,image/jpeg,image/png,image/heic"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && activeUploadCredId) handleFileUpload(file, activeUploadCredId);
                            e.target.value = "";
                        }}
                    />

                    {!myCredentials || myCredentials.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No credentials added yet. Add them in Settings or during onboarding.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {myCredentials.map((cred) => {
                                const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
                                    unsubmitted: { label: "No document", icon: <FileText className="h-3.5 w-3.5" />, color: "text-muted-foreground" },
                                    pending: { label: "Under review", icon: <Clock className="h-3.5 w-3.5" />, color: "text-blue-500" },
                                    in_review: { label: "In review", icon: <Clock className="h-3.5 w-3.5" />, color: "text-blue-500" },
                                    approved: { label: "Approved", icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "text-emerald-500" },
                                    rejected: { label: "Rejected", icon: <XCircle className="h-3.5 w-3.5" />, color: "text-destructive" },
                                    needs_resubmit: { label: "Needs resubmit", icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "text-amber-500" },
                                };
                                const sc = statusConfig[cred.status] ?? statusConfig.unsubmitted;

                                return (
                                    <div
                                        key={cred._id}
                                        className="rounded-xl border bg-muted/20 px-4 py-3 space-y-2"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-sm font-medium">
                                                {CRED_LABEL[cred.credentialType] ?? cred.credentialType}
                                            </span>
                                            <span className={`flex items-center gap-1.5 text-xs font-medium ${sc.color}`}>
                                                {sc.icon}
                                                {sc.label}
                                            </span>
                                        </div>

                                        {cred.rejectionReason && (
                                            <p className="text-xs text-muted-foreground">
                                                Reason: {cred.rejectionReason}
                                            </p>
                                        )}

                                        {cred.fileName && (
                                            <p className="text-xs text-muted-foreground truncate">
                                                📎 {cred.fileName}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-2 pt-1">
                                            {(cred.status === "unsubmitted" || cred.status === "needs_resubmit") && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 text-xs gap-1.5"
                                                    disabled={isUploadingDoc}
                                                    onClick={() => {
                                                        setActiveUploadCredId(cred._id);
                                                        fileInputRef.current?.click();
                                                    }}
                                                >
                                                    <Upload className="h-3 w-3" />
                                                    {cred.status === "needs_resubmit" ? "Resubmit Document" : "Upload Document"}
                                                </Button>
                                            )}
                                            {(cred.status === "unsubmitted" || cred.status === "pending") && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 text-xs text-destructive hover:text-destructive"
                                                    onClick={() => handleDeleteCredential(cred._id)}
                                                >
                                                    <Trash2 className="h-3 w-3 mr-1" />
                                                    Remove
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
