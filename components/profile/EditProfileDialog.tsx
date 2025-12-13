"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Pencil } from "lucide-react";

interface EditProfileDialogProps {
    user: Doc<"users">;
}

export default function EditProfileDialog({ user }: EditProfileDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const update = useMutation(api.users.update);

    const [name, setName] = useState(user.name || "");
    const [bio, setBio] = useState(user.bio || "");
    const [university, setUniversity] = useState(user.university || "");
    const [linkedin, setLinkedin] = useState(user.links?.linkedin || "");
    const [twitter, setTwitter] = useState(user.links?.twitter || "");
    const [portfolio, setPortfolio] = useState(user.links?.portfolio || "");

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await update({
                updates: {
                    name,
                    bio,
                    university,
                    links: {
                        linkedin,
                        twitter,
                        portfolio
                    }
                }
            });
            toast.success("Profile updated");
            setOpen(false);
        } catch (error) {
            toast.error("Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Pencil className="w-4 h-4" />
                    Edit Profile
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                        Make changes to your public profile here.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="university">University</Label>
                        <Input id="university" value={university} onChange={(e) => setUniversity(e.target.value)} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Social Links</Label>
                        <div className="grid gap-2">
                            <Input placeholder="LinkedIn URL" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
                            <Input placeholder="Twitter URL" value={twitter} onChange={(e) => setTwitter(e.target.value)} />
                            <Input placeholder="Portfolio URL" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
