"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function CreateRequestPage() {
    const createRequest = useMutation(api.requests.create);
    const user = useQuery(api.users.currentUser);
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (user?.isBanned) return;
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);

        try {
            await createRequest({
                title: formData.get("title") as string,
                description: formData.get("description") as string,
                budget: Number(formData.get("budget")),
                deadline: formData.get("deadline") as string,
                category: formData.get("category") as string,
            });
            toast.success("Request posted successfully!");
            router.push("/dashboard");
        } catch (error) {
            toast.error("Failed to post request");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto py-10 max-w-2xl">
            <h1 className="text-3xl font-bold mb-8">Post a Request</h1>
            {user?.isBanned && (
                <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-lg text-destructive">
                    Your account is banned. You cannot post new requests.
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium">
                        Subject / Title
                    </label>
                    <Input
                        id="title"
                        name="title"
                        placeholder="e.g., CS 100 Help, Essay Review"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="category" className="text-sm font-medium">
                        Category
                    </label>
                    <Select name="category" required>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="cs">Computer Science</SelectItem>
                            <SelectItem value="math">Mathematics</SelectItem>
                            <SelectItem value="economics">Economics</SelectItem>
                            <SelectItem value="humanities">Humanities</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium">
                        Description
                    </label>
                    <Textarea
                        id="description"
                        name="description"
                        placeholder="Describe what you need help with..."
                        required
                        className="min-h-[150px]"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label htmlFor="budget" className="text-sm font-medium">
                            Budget (PKR)
                        </label>
                        <Input
                            id="budget"
                            name="budget"
                            type="number"
                            placeholder="500"
                            required
                            min="0"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="deadline" className="text-sm font-medium">
                            Deadline
                        </label>
                        <Input id="deadline" name="deadline" type="date" required />
                    </div>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting || user?.isBanned}>
                    {isSubmitting ? "Posting..." : "Post Request"}
                </Button>
            </form>
        </div>
    );
}
