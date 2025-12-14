"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function TutorStatusToggle() {
    const tutorProfile = useQuery(api.tutor_profiles.getMyProfile);
    const updatePresence = useMutation(api.users.updateTutorPresence);
    const updateSettings = useMutation(api.users.updateTutorSettings);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Don't render if no tutor profile exists
    if (tutorProfile === undefined) return null; // Loading
    if (tutorProfile === null) return null; // No tutor profile

    const isOnline = tutorProfile.isOnline ?? false;
    const settings = tutorProfile.settings;

    const handleToggle = async (checked: boolean) => {
        try {
            await updatePresence({ isOnline: checked });
            toast.success(checked ? "You are now online" : "You are now offline");
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleSettingsUpdate = async (key: string, value: boolean) => {
        if (!settings) return;

        try {
            await updateSettings({
                settings: {
                    acceptingRequests: settings.acceptingRequests,
                    acceptingPaid: settings.acceptingPaid,
                    acceptingFree: settings.acceptingFree,
                    minRate: settings.minRate,
                    allowedHelpTypes: settings.allowedHelpTypes || [],
                    [key]: value,
                }
            });
            toast.success("Settings updated");
        } catch (error) {
            toast.error("Failed to update settings");
        }
    };

    return (
        <div className="flex items-center gap-4 bg-background/50 p-2 rounded-lg border backdrop-blur-sm">
            <div className="flex items-center gap-2">
                <div className={cn(
                    "h-2 w-2 rounded-full",
                    isOnline ? "bg-green-500 animate-pulse" : "bg-gray-400"
                )} />
                <span className="text-sm font-medium">
                    {isOnline ? "Online" : "Offline"}
                </span>
                <Switch
                    checked={isOnline}
                    onCheckedChange={handleToggle}
                />
            </div>

            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Settings className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tutor Availability Settings</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="acceptingRequests"
                                checked={settings?.acceptingRequests ?? false}
                                onCheckedChange={(c: boolean) => handleSettingsUpdate("acceptingRequests", c)}
                            />
                            <Label htmlFor="acceptingRequests">Accepting New Requests</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="acceptingPaid"
                                checked={settings?.acceptingPaid ?? false}
                                onCheckedChange={(c: boolean) => handleSettingsUpdate("acceptingPaid", c)}
                            />
                            <Label htmlFor="acceptingPaid">Accepting Paid Sessions</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="acceptingFree"
                                checked={settings?.acceptingFree ?? false}
                                onCheckedChange={(c: boolean) => handleSettingsUpdate("acceptingFree", c)}
                            />
                            <Label htmlFor="acceptingFree">Accepting Free Help</Label>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
