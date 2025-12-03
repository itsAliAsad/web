"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PortfolioSection from "@/components/portfolio/PortfolioSection";
import CoursesSection from "@/components/portfolio/CoursesSection";

export default function ProfilePage() {
    const user = useQuery(api.users.currentUser);
    const updateUser = useMutation(api.users.update);
    const [bio, setBio] = useState("");
    const [university, setUniversity] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            setBio(user.bio || "");
            setUniversity(user.university || "");
        }
    }, [user]);

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            await updateUser({ bio, university });
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
            <h1 className="text-3xl font-bold mb-8">My Profile</h1>

            <div className="flex items-center gap-6 mb-8">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={user.image} />
                    <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <h2 className="text-2xl font-semibold">{user.name}</h2>
                    <p className="text-gray-500">{user.email}</p>
                    <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Reputation: {user.reputation}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <label htmlFor="university" className="text-sm font-medium">
                        University
                    </label>
                    <Input
                        id="university"
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                        placeholder="LUMS"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="bio" className="text-sm font-medium">
                        Bio / Pitch
                    </label>
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

            <div className="my-8 border-t pt-8">
                <PortfolioSection userId={user._id} isOwner={true} />
            </div>

            <div className="my-8 border-t pt-8">
                <CoursesSection userId={user._id} isOwner={true} />
            </div>
        </div>
    );
}
