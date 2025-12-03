"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface PortfolioSectionProps {
    userId: Id<"users">;
    isOwner: boolean;
}

export default function PortfolioSection({ userId, isOwner }: PortfolioSectionProps) {
    const items = useQuery(api.portfolio.getPortfolioItems, { userId });
    const addItem = useMutation(api.portfolio.addPortfolioItem);
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [link, setLink] = useState("");

    const handleSubmit = async () => {
        if (!title || !description || !imageUrl) {
            toast.error("Please fill in all required fields");
            return;
        }

        try {
            await addItem({
                title,
                description,
                imageUrl,
                link: link || undefined,
            });
            toast.success("Portfolio item added");
            setOpen(false);
            setTitle("");
            setDescription("");
            setImageUrl("");
            setLink("");
        } catch (error) {
            toast.error("Failed to add item");
            console.error(error);
        }
    };

    if (items === undefined) return <div>Loading portfolio...</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Portfolio</h2>
                {isOwner && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Item
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Portfolio Item</DialogTitle>
                                <DialogDescription>
                                    Showcase your best work.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Title</label>
                                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Description</label>
                                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Image URL</label>
                                    <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Link (Optional)</label>
                                    <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSubmit}>Add Item</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.length === 0 ? (
                    <p className="text-muted-foreground col-span-full">No portfolio items yet.</p>
                ) : (
                    items.map((item) => (
                        <Card key={item._id} className="overflow-hidden">
                            <div className="aspect-video relative">
                                <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="object-cover w-full h-full"
                                />
                            </div>
                            <CardHeader>
                                <CardTitle className="text-lg flex justify-between items-start">
                                    {item.title}
                                    {item.link && (
                                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
