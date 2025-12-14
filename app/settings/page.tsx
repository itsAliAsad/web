"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { X, Trash2, BookOpen } from "lucide-react";
import { CourseSelector } from "@/components/CourseSelector";
import { Id } from "@/convex/_generated/dataModel";

const HELP_TYPES = ["Debugging", "Concept Explanation", "Exam Prep", "Code Review", "Project Help", "Mentorship"];

export default function SettingsPage() {
    const user = useQuery(api.users.currentUser);
    const tutorProfile = useQuery(api.tutor_profiles.getMyProfile);
    const myOfferings = useQuery(api.tutor_offerings.listMyOfferings);
    const update = useMutation(api.users.update);
    const updateTutorProfile = useMutation(api.tutor_profiles.updateProfile);
    const addOffering = useMutation(api.tutor_offerings.add);
    const removeOffering = useMutation(api.tutor_offerings.remove);
    const { role } = useRole();

    const [currency, setCurrency] = useState("PKR");
    const [language, setLanguage] = useState("en");
    const [theme, setTheme] = useState("system");

    // Notifications
    const [emailMarketing, setEmailMarketing] = useState(false);
    const [emailTransactional, setEmailTransactional] = useState(true);
    const [pushMessages, setPushMessages] = useState(true);

    // Privacy
    const [marketingConsent, setMarketingConsent] = useState(false);

    // Tutor Profile
    const [tutorBio, setTutorBio] = useState("");
    const [minRate, setMinRate] = useState(500);
    const [acceptingRequests, setAcceptingRequests] = useState(true);
    const [selectedHelpTypes, setSelectedHelpTypes] = useState<string[]>([]);

    // New course offering
    const [selectedCourse, setSelectedCourse] = useState<Id<"university_courses"> | null>(null);
    const [offeringLevel, setOfferingLevel] = useState("Intermediate");

    useEffect(() => {
        if (user) {
            setCurrency(user.currency || "PKR");
            setLanguage(user.language || "en");
            setTheme(user.theme || "system");

            if (user.notificationPreferences) {
                setEmailMarketing(user.notificationPreferences.email_marketing);
                setEmailTransactional(user.notificationPreferences.email_transactional);
                setPushMessages(user.notificationPreferences.push_messages);
            }

            setMarketingConsent(user.marketingConsent || false);
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

    const handleSaveGeneral = async () => {
        try {
            await update({
                updates: { currency, language, theme }
            });
            toast.success("General settings saved");
        } catch (error) {
            toast.error("Failed to save settings");
        }
    };

    const handleSaveNotifications = async () => {
        try {
            await update({
                updates: {
                    notificationPreferences: {
                        email_marketing: emailMarketing,
                        email_transactional: emailTransactional,
                        push_messages: pushMessages
                    }
                }
            });
            toast.success("Notification preferences saved");
        } catch (error) {
            toast.error("Failed to save preferences");
        }
    };

    const handleSavePrivacy = async () => {
        try {
            await update({
                updates: { marketingConsent: marketingConsent }
            });
            toast.success("Privacy settings saved");
        } catch (error) {
            toast.error("Failed to save privacy settings");
        }
    };

    const handleSaveTutor = async () => {
        try {
            await updateTutorProfile({
                bio: tutorBio,
                minRate,
                allowedHelpTypes: selectedHelpTypes,
                acceptingRequests
            });
            toast.success("Tutor profile saved");
        } catch (error) {
            toast.error("Failed to save tutor profile");
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
            toast.success("Course added to offerings");
            setSelectedCourse(null);
        } catch (error: any) {
            toast.error(error.message || "Failed to add course");
        }
    };

    const handleRemoveOffering = async (offeringId: Id<"tutor_offerings">) => {
        try {
            await removeOffering({ offeringId });
            toast.success("Course removed from offerings");
        } catch (error) {
            toast.error("Failed to remove course");
        }
    };

    if (!user) return <div className="p-10">Loading...</div>;

    const isTutor = role === "tutor" || user.role === "tutor";

    return (
        <div className="container max-w-4xl py-10">
            <h1 className="text-3xl font-bold mb-8">Settings</h1>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="mb-8">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="privacy">Privacy</TabsTrigger>
                    {isTutor && (
                        <>
                            <TabsTrigger value="tutor">Tutor Profile</TabsTrigger>
                            <TabsTrigger value="courses">My Courses</TabsTrigger>
                        </>
                    )}
                </TabsList>

                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>General Preferences</CardTitle>
                            <CardDescription>Customize your experience.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Currency</Label>
                                <Select value={currency} onValueChange={setCurrency}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select currency" />
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
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select language" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="en">English</SelectItem>
                                        <SelectItem value="ur">Urdu</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Theme</Label>
                                <Select value={theme} onValueChange={setTheme}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select theme" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="light">Light</SelectItem>
                                        <SelectItem value="dark">Dark</SelectItem>
                                        <SelectItem value="system">System</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button onClick={handleSaveGeneral}>Save Changes</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notification Preferences</CardTitle>
                            <CardDescription>Choose what you want to hear about.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Marketing Emails</Label>
                                    <p className="text-sm text-muted-foreground">Receive updates about new features.</p>
                                </div>
                                <Switch checked={emailMarketing} onCheckedChange={setEmailMarketing} />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Transactional Emails</Label>
                                    <p className="text-sm text-muted-foreground">Receive emails about your tickets and offers.</p>
                                </div>
                                <Switch checked={emailTransactional} onCheckedChange={setEmailTransactional} />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Push Notifications</Label>
                                    <p className="text-sm text-muted-foreground">Receive real-time notifications.</p>
                                </div>
                                <Switch checked={pushMessages} onCheckedChange={setPushMessages} />
                            </div>

                            <Button onClick={handleSaveNotifications}>Save Preferences</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="privacy">
                    <Card>
                        <CardHeader>
                            <CardTitle>Privacy & Data</CardTitle>
                            <CardDescription>Manage your data and consent.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Marketing Consent</Label>
                                    <p className="text-sm text-muted-foreground">I agree to receive marketing communications.</p>
                                </div>
                                <Switch checked={marketingConsent} onCheckedChange={setMarketingConsent} />
                            </div>

                            <Button onClick={handleSavePrivacy}>Save Privacy Settings</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {(role === "tutor" || user.role === "tutor") && (
                    <TabsContent value="tutor">
                        <Card>
                            <CardHeader>
                                <CardTitle>Tutor Profile</CardTitle>
                                <CardDescription>Configure your tutoring preferences and availability.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Accepting Requests</Label>
                                        <p className="text-sm text-muted-foreground">Toggle to accept new tutoring requests.</p>
                                    </div>
                                    <Switch checked={acceptingRequests} onCheckedChange={setAcceptingRequests} />
                                </div>

                                <div className="space-y-2">
                                    <Label>Tutor Bio</Label>
                                    <Textarea
                                        value={tutorBio}
                                        onChange={(e) => setTutorBio(e.target.value)}
                                        placeholder="Tell students about your experience and teaching style..."
                                        className="min-h-[100px]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Minimum Rate (PKR/hour)</Label>
                                    <Input
                                        type="number"
                                        value={minRate}
                                        onChange={(e) => setMinRate(Number(e.target.value))}
                                        min={0}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Help Types I Offer</Label>
                                    <p className="text-sm text-muted-foreground mb-2">Select the types of help you can provide.</p>
                                    <div className="flex flex-wrap gap-2">
                                        {HELP_TYPES.map((type) => (
                                            <Badge
                                                key={type}
                                                variant={selectedHelpTypes.includes(type) ? "default" : "outline"}
                                                className="cursor-pointer hover:opacity-80"
                                                onClick={() => toggleHelpType(type)}
                                            >
                                                {type}
                                                {selectedHelpTypes.includes(type) && (
                                                    <X className="ml-1 h-3 w-3" />
                                                )}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>


                                <Button onClick={handleSaveTutor}>Save Tutor Profile</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {isTutor && (
                    <TabsContent value="courses">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5" />
                                    My Course Offerings
                                </CardTitle>
                                <CardDescription>Manage the courses you offer to tutor.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Add new course */}
                                <div className="space-y-4 p-4 border rounded-lg">
                                    <Label>Add a Course</Label>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <CourseSelector
                                                onSelect={(courseId) => setSelectedCourse(courseId)}
                                            />
                                        </div>
                                        <Select value={offeringLevel} onValueChange={setOfferingLevel}>
                                            <SelectTrigger className="w-[140px]">
                                                <SelectValue placeholder="Level" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Beginner">Beginner</SelectItem>
                                                <SelectItem value="Intermediate">Intermediate</SelectItem>
                                                <SelectItem value="Advanced">Advanced</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button onClick={handleAddOffering}>Add</Button>
                                    </div>
                                </div>

                                {/* Current offerings */}
                                <div className="space-y-2">
                                    <Label>Your Current Offerings</Label>
                                    {myOfferings === undefined ? (
                                        <p className="text-sm text-muted-foreground">Loading...</p>
                                    ) : myOfferings.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No courses added yet.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {myOfferings.map((offering: any) => (
                                                <div
                                                    key={offering._id}
                                                    className="flex items-center justify-between p-3 border rounded-lg"
                                                >
                                                    <div>
                                                        <span className="font-medium">{offering.courseCode}</span>
                                                        <span className="text-muted-foreground ml-2">
                                                            {offering.courseName}
                                                        </span>
                                                        <Badge variant="outline" className="ml-2">
                                                            {offering.level}
                                                        </Badge>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleRemoveOffering(offering._id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}

