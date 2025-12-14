"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useRole } from "@/context/RoleContext";
import { User, Bell, Shield, GraduationCap, BookOpen, X, ArrowLeft, Check } from "lucide-react";
import { CourseSelector } from "@/components/CourseSelector";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";

const HELP_TYPES = ["Debugging", "Concept Explanation", "Exam Prep", "Code Review", "Project Help", "Mentorship"];

const NAV_ITEMS = [
    { id: "general", label: "General", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "tutor", label: "Tutor Profile", icon: GraduationCap, tutorOnly: true },
    { id: "courses", label: "My Courses", icon: BookOpen, tutorOnly: true },
];

export default function SettingsPage() {
    const user = useQuery(api.users.currentUser);
    const tutorProfile = useQuery(api.tutor_profiles.getMyProfile);
    const myOfferings = useQuery(api.tutor_offerings.listMyOfferings);
    const update = useMutation(api.users.update);
    const updateTutorProfile = useMutation(api.tutor_profiles.updateProfile);
    const addOffering = useMutation(api.tutor_offerings.add);
    const removeOffering = useMutation(api.tutor_offerings.remove);
    const updateOffering = useMutation(api.tutor_offerings.update);
    const { role } = useRole();

    const [activeSection, setActiveSection] = useState("general");

    // General
    const [currency, setCurrency] = useState("PKR");
    const [language, setLanguage] = useState("en");
    const [theme, setTheme] = useState("system");

    // Tutor Profile
    const [tutorBio, setTutorBio] = useState("");
    const [minRate, setMinRate] = useState(500);
    const [acceptingRequests, setAcceptingRequests] = useState(true);
    const [selectedHelpTypes, setSelectedHelpTypes] = useState<string[]>([]);

    // Course offering
    const [selectedCourse, setSelectedCourse] = useState<Id<"university_courses"> | null>(null);
    const [offeringLevel, setOfferingLevel] = useState("Intermediate");
    const [editingOffering, setEditingOffering] = useState<string | null>(null);

    const isTutor = role === "tutor" || user?.role === "tutor";

    useEffect(() => {
        if (user) {
            setCurrency(user.currency || "PKR");
            setLanguage(user.language || "en");
            setTheme(user.theme || "system");
        }
    }, [user]);

    useEffect(() => {
        if (tutorProfile) {
            setTutorBio(tutorProfile.bio || "");
            setMinRate(tutorProfile.settings?.minRate || 500);
            setAcceptingRequests(tutorProfile.settings?.acceptingRequests ?? true);
            setSelectedHelpTypes(tutorProfile.settings?.allowedHelpTypes || []);
        }
    }, [tutorProfile]);

    // Auto-save for toggles
    const handleToggle = async (field: string, value: boolean) => {
        try {
            if (field === "emailMarketing" || field === "emailTransactional" || field === "pushMessages") {
                const currentPrefs = user?.notificationPreferences || {};
                await update({
                    updates: {
                        notificationPreferences: {
                            ...currentPrefs,
                            [field === "emailMarketing" ? "email_marketing" :
                                field === "emailTransactional" ? "email_transactional" :
                                    "push_messages"]: value
                        }
                    }
                });
            } else if (field === "marketingConsent") {
                await update({ updates: { marketingConsent: value } });
            } else if (field === "acceptingRequests") {
                setAcceptingRequests(value);
                await updateTutorProfile({ acceptingRequests: value });
            }
            toast.success("Saved");
        } catch (error) {
            toast.error("Failed to save");
        }
    };

    const handleSaveGeneral = async () => {
        try {
            await update({ updates: { currency, language, theme } });
            toast.success("Settings saved");
        } catch (error) {
            toast.error("Failed to save");
        }
    };

    const handleSaveTutor = async () => {
        try {
            await updateTutorProfile({
                bio: tutorBio,
                minRate,
                allowedHelpTypes: selectedHelpTypes,
            });
            toast.success("Profile saved");
        } catch (error) {
            toast.error("Failed to save");
        }
    };

    const toggleHelpType = (type: string) => {
        setSelectedHelpTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const handleAddOffering = async () => {
        if (!selectedCourse) {
            toast.error("Please select a course");
            return;
        }
        try {
            await addOffering({ courseId: selectedCourse, level: offeringLevel });
            toast.success("Course added");
            setSelectedCourse(null);
        } catch (error: any) {
            toast.error(error.message || "Failed to add");
        }
    };

    const handleUpdateOfferingLevel = async (offeringId: Id<"tutor_offerings">, newLevel: string) => {
        try {
            await updateOffering({ offeringId, level: newLevel });
            toast.success("Level updated");
            setEditingOffering(null);
        } catch (error) {
            toast.error("Failed to update");
        }
    };

    const handleRemoveOffering = async (offeringId: Id<"tutor_offerings">) => {
        try {
            await removeOffering({ offeringId });
            toast.success("Course removed");
        } catch (error) {
            toast.error("Failed to remove");
        }
    };

    if (!user) return <div className="p-10">Loading...</div>;

    return (
        <div className="container mx-auto py-10">
            {/* Back Link */}
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group">
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
            </Link>

            {/* Header */}
            <header className="mb-10">
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-3">
                    Settings
                </h1>
                <p className="text-lg text-muted-foreground">
                    Manage your account preferences and profile.
                </p>
            </header>

            {/* Sidebar + Content Layout */}
            <div className="grid grid-cols-12 gap-8">
                {/* Sidebar Navigation */}
                <aside className="col-span-12 lg:col-span-3">
                    <Card className="glass-card border-none sticky top-6">
                        <CardContent className="p-3">
                            <nav className="space-y-1">
                                {NAV_ITEMS.filter(item => !item.tutorOnly || isTutor).map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveSection(item.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeSection === item.id
                                            ? "bg-foreground text-background font-semibold"
                                            : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                                            }`}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        <span className="text-sm">{item.label}</span>
                                    </button>
                                ))}
                            </nav>
                        </CardContent>
                    </Card>
                </aside>

                {/* Content Area */}
                <main className="col-span-12 lg:col-span-9">
                    <div className="max-w-2xl space-y-6">

                        {/* General */}
                        {activeSection === "general" && (
                            <Card className="glass-card border-none">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold">General Preferences</CardTitle>
                                    <CardDescription>Customize your experience. Theme changes apply automatically.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Currency</Label>
                                        <Select value={currency} onValueChange={setCurrency}>
                                            <SelectTrigger className="h-12 rounded-xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PKR">PKR (₨)</SelectItem>
                                                <SelectItem value="USD">USD ($)</SelectItem>
                                                <SelectItem value="EUR">EUR (€)</SelectItem>
                                                <SelectItem value="GBP">GBP (£)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Language</Label>
                                        <Select value={language} onValueChange={setLanguage}>
                                            <SelectTrigger className="h-12 rounded-xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="en">English</SelectItem>
                                                <SelectItem value="ur">Urdu</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Theme</Label>
                                        <Select
                                            value={theme}
                                            onValueChange={async (value) => {
                                                setTheme(value);
                                                try {
                                                    await update({ updates: { theme: value } });
                                                    toast.success("Theme updated");
                                                } catch (error) {
                                                    toast.error("Failed to update theme");
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="h-12 rounded-xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="light">☀️ Light</SelectItem>
                                                <SelectItem value="dark">🌙 Dark</SelectItem>
                                                <SelectItem value="system">💻 System</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Button onClick={handleSaveGeneral} className="rounded-full h-11">
                                        Save Currency & Language
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {/* Notifications */}
                        {activeSection === "notifications" && (
                            <Card className="glass-card border-none">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold">Notifications</CardTitle>
                                    <CardDescription>Choose what you want to hear about. Changes save automatically.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between py-3">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Marketing Emails</Label>
                                            <p className="text-sm text-muted-foreground">Updates about new features.</p>
                                        </div>
                                        <Switch
                                            checked={user.notificationPreferences?.email_marketing ?? false}
                                            onCheckedChange={(v) => handleToggle("emailMarketing", v)}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between py-3">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Transactional Emails</Label>
                                            <p className="text-sm text-muted-foreground">Emails about tickets and offers.</p>
                                        </div>
                                        <Switch
                                            checked={user.notificationPreferences?.email_transactional ?? true}
                                            onCheckedChange={(v) => handleToggle("emailTransactional", v)}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between py-3">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Push Notifications</Label>
                                            <p className="text-sm text-muted-foreground">Real-time notifications.</p>
                                        </div>
                                        <Switch
                                            checked={user.notificationPreferences?.push_messages ?? true}
                                            onCheckedChange={(v) => handleToggle("pushMessages", v)}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Privacy */}
                        {activeSection === "privacy" && (
                            <Card className="glass-card border-none">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold">Privacy & Data</CardTitle>
                                    <CardDescription>Manage your data and consent. Changes save automatically.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between py-3">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Marketing Consent</Label>
                                            <p className="text-sm text-muted-foreground">I agree to receive marketing communications.</p>
                                        </div>
                                        <Switch
                                            checked={user.marketingConsent ?? false}
                                            onCheckedChange={(v) => handleToggle("marketingConsent", v)}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Tutor Profile */}
                        {activeSection === "tutor" && isTutor && (
                            <>
                                <Card className="glass-card border-none">
                                    <CardHeader>
                                        <CardTitle className="text-2xl font-bold">Tutor Profile</CardTitle>
                                        <CardDescription>Configure your tutoring preferences.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="flex items-center justify-between py-3">
                                            <div className="space-y-0.5">
                                                <Label className="text-base">Accepting Requests</Label>
                                                <p className="text-sm text-muted-foreground">Toggle to accept new requests.</p>
                                            </div>
                                            <Switch
                                                checked={acceptingRequests}
                                                onCheckedChange={(v) => handleToggle("acceptingRequests", v)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-base">Bio</Label>
                                            <Textarea
                                                value={tutorBio}
                                                onChange={(e) => setTutorBio(e.target.value)}
                                                placeholder="Tell students about your experience..."
                                                className="min-h-[120px] rounded-xl"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-base">Minimum Rate (PKR/hour)</Label>
                                            <Input
                                                type="number"
                                                value={minRate}
                                                onChange={(e) => setMinRate(Number(e.target.value))}
                                                min={0}
                                                className="h-12 rounded-xl"
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-base">Help Types I Offer</Label>
                                            <p className="text-sm text-muted-foreground">Select types of help you can provide.</p>
                                            <div className="flex flex-wrap gap-2">
                                                {HELP_TYPES.map((type) => (
                                                    <Badge
                                                        key={type}
                                                        variant={selectedHelpTypes.includes(type) ? "default" : "outline"}
                                                        className="cursor-pointer hover:opacity-80 px-3 py-1.5"
                                                        onClick={() => toggleHelpType(type)}
                                                    >
                                                        {type}
                                                        {selectedHelpTypes.includes(type) && <X className="ml-1 h-3 w-3" />}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        <Button onClick={handleSaveTutor} className="rounded-full h-11">
                                            Save Profile
                                        </Button>
                                    </CardContent>
                                </Card>

                                {/* Live Preview */}
                                <Card className="glass-card border-none bg-amber-500/5">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-semibold">Profile Preview</CardTitle>
                                        <CardDescription>How students will see your profile</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="p-6 rounded-xl bg-white/60 dark:bg-white/5 border border-foreground/10">
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <h3 className="text-lg font-bold text-foreground">{user.name || "Your Name"}</h3>
                                                    <p className="text-sm text-muted-foreground">PKR {minRate}/hour minimum</p>
                                                </div>
                                                {acceptingRequests ? (
                                                    <Badge className="bg-emerald-500/15 text-emerald-700 border-none">
                                                        <Check className="h-3 w-3 mr-1" />
                                                        Available
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline">Unavailable</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-foreground/80 mb-4">
                                                {tutorBio || "No bio yet. Add one above to see it here!"}
                                            </p>
                                            {selectedHelpTypes.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {selectedHelpTypes.map(type => (
                                                        <Badge key={type} variant="secondary" className="text-xs">
                                                            {type}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}

                        {/* My Courses */}
                        {activeSection === "courses" && isTutor && (
                            <Card className="glass-card border-none">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                        <BookOpen className="h-6 w-6" />
                                        My Course Offerings
                                    </CardTitle>
                                    <CardDescription>Manage courses you offer to tutor.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Add Course */}
                                    <div className="p-5 rounded-xl bg-foreground/5 space-y-4">
                                        <Label className="text-base">Add a Course</Label>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <CourseSelector onSelect={(courseId) => setSelectedCourse(courseId)} />
                                            </div>
                                            <Select value={offeringLevel} onValueChange={setOfferingLevel}>
                                                <SelectTrigger className="w-[140px] h-12 rounded-xl">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Beginner">Beginner</SelectItem>
                                                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                                                    <SelectItem value="Advanced">Advanced</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button onClick={handleAddOffering} className="h-12 rounded-xl">Add</Button>
                                        </div>
                                    </div>

                                    {/* Course List */}
                                    <div className="space-y-3">
                                        <Label className="text-base">Your Offerings</Label>
                                        {myOfferings === undefined ? (
                                            <p className="text-sm text-muted-foreground">Loading...</p>
                                        ) : myOfferings.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">No courses yet.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {myOfferings.map((offering: any) => (
                                                    <div key={offering._id} className="flex items-center justify-between p-4 rounded-xl bg-white/60 dark:bg-white/5 border border-foreground/10">
                                                        <div className="flex-1">
                                                            <span className="font-semibold text-foreground">{offering.courseCode}</span>
                                                            <span className="text-muted-foreground ml-2 text-sm">{offering.courseName}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {editingOffering === offering._id ? (
                                                                <>
                                                                    <Select
                                                                        defaultValue={offering.level}
                                                                        onValueChange={(v) => handleUpdateOfferingLevel(offering._id, v)}
                                                                    >
                                                                        <SelectTrigger className="w-[130px] h-9">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="Beginner">Beginner</SelectItem>
                                                                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                                                                            <SelectItem value="Advanced">Advanced</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => setEditingOffering(null)}
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="cursor-pointer"
                                                                        onClick={() => setEditingOffering(offering._id)}
                                                                    >
                                                                        {offering.level}
                                                                    </Badge>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleRemoveOffering(offering._id)}
                                                                        className="text-destructive hover:text-destructive"
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
