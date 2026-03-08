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
import { Loader2, Pencil, Mail, Phone } from "lucide-react";

interface EditProfileDialogProps {
    user: Doc<"users">;
}

export default function EditProfileDialog({ user }: EditProfileDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const update = useMutation(api.users.update);

    const [name, setName] = useState(user.name || "");
    const [bio, setBio] = useState(user.bio || "");
    const [linkedin, setLinkedin] = useState(user.links?.linkedin || "");
    const [twitter, setTwitter] = useState(user.links?.twitter || "");
    const [portfolio, setPortfolio] = useState(user.links?.portfolio || "");
    const [personalEmail, setPersonalEmail] = useState((user as any).personalEmail || "");
    const [whatsappNumber, setWhatsappNumber] = useState((user as any).whatsappNumber || "");

    const isTutor = user.role === "tutor";

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await update({
                updates: {
                    name,
                    bio,
                    links: {
                        linkedin,
                        twitter,
                        portfolio
                    },
                    ...(isTutor && personalEmail ? { personalEmail } : {}),
                    ...(isTutor && whatsappNumber ? { whatsappNumber } : {}),
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
                        <Label>Social Links</Label>
                        <div className="grid gap-2">
                            <Input placeholder="LinkedIn URL" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
                            <Input placeholder="Twitter URL" value={twitter} onChange={(e) => setTwitter(e.target.value)} />
                            <Input placeholder="Portfolio URL" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} />
                        </div>
                    </div>

                    {isTutor && (
                        <div className="grid gap-2">
                            <Label>Contact Details (Private)</Label>
                            <p className="text-xs text-muted-foreground">Only visible to the Peer team.</p>
                            <div className="grid gap-2">
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="email"
                                        placeholder="Personal email"
                                        value={personalEmail}
                                        onChange={(e) => setPersonalEmail(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="tel"
                                        placeholder="WhatsApp number"
                                        value={whatsappNumber}
                                        onChange={(e) => setWhatsappNumber(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
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
