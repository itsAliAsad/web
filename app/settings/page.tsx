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
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function SettingsPage() {
    const user = useQuery(api.users.currentUser);
    const update = useMutation(api.users.update);

    const [currency, setCurrency] = useState("USD");
    const [language, setLanguage] = useState("en");
    const [theme, setTheme] = useState("system");

    // Notifications
    const [emailMarketing, setEmailMarketing] = useState(false);
    const [emailTransactional, setEmailTransactional] = useState(true);
    const [pushMessages, setPushMessages] = useState(true);

    // Privacy
    const [marketingConsent, setMarketingConsent] = useState(false);

    useEffect(() => {
        if (user) {
            setCurrency(user.currency || "USD");
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

    const handleSaveGeneral = async () => {
        try {
            await update({
                updates: {
                    currency,
                    language,
                    theme
                }
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
                updates: {
                    marketingConsent: marketingConsent
                }
            });
            toast.success("Privacy settings saved");
        } catch (error) {
            toast.error("Failed to save privacy settings");
        }
    };

    if (!user) return <div className="p-10">Loading...</div>;

    return (
        <div className="container max-w-4xl py-10">
            <h1 className="text-3xl font-bold mb-8">Settings</h1>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="mb-8">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="privacy">Privacy</TabsTrigger>
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
                                        <SelectItem value="USD">USD ($)</SelectItem>
                                        <SelectItem value="EUR">EUR (€)</SelectItem>
                                        <SelectItem value="GBP">GBP (£)</SelectItem>
                                        <SelectItem value="JPY">JPY (¥)</SelectItem>
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
                                        <SelectItem value="es">Spanish</SelectItem>
                                        <SelectItem value="fr">French</SelectItem>
                                        <SelectItem value="de">German</SelectItem>
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
                                    <p className="text-sm text-muted-foreground">Receive updates about new features and promotions.</p>
                                </div>
                                <Switch checked={emailMarketing} onCheckedChange={setEmailMarketing} />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Transactional Emails</Label>
                                    <p className="text-sm text-muted-foreground">Receive emails about your orders, requests, and offers.</p>
                                </div>
                                <Switch checked={emailTransactional} onCheckedChange={setEmailTransactional} />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Push Notifications</Label>
                                    <p className="text-sm text-muted-foreground">Receive real-time notifications in the app.</p>
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
            </Tabs>
        </div>
    );
}
