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
import { Plus, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface CoursesSectionProps {
    userId: Id<"users">;
    isOwner: boolean;
}

export default function CoursesSection({ userId, isOwner }: CoursesSectionProps) {
    const courses = useQuery(api.portfolio.getCourses, { userId });
    const addCourse = useMutation(api.portfolio.addCourse);
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [imageUrl, setImageUrl] = useState("");

    const handleSubmit = async () => {
        if (!title || !description || !price) {
            toast.error("Please fill in all required fields");
            return;
        }

        try {
            await addCourse({
                title,
                description,
                price: parseFloat(price),
                imageUrl: imageUrl || undefined,
            });
            toast.success("Course added");
            setOpen(false);
            setTitle("");
            setDescription("");
            setPrice("");
            setImageUrl("");
        } catch (error) {
            toast.error("Failed to add course");
            console.error(error);
        }
    };

    if (courses === undefined) return <div>Loading courses...</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Courses</h2>
                {isOwner && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Course
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Course</DialogTitle>
                                <DialogDescription>
                                    List a course you are teaching.
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
                                    <label className="text-sm font-medium">Price (PKR)</label>
                                    <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Image URL (Optional)</label>
                                    <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSubmit}>Add Course</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.length === 0 ? (
                    <p className="text-muted-foreground col-span-full">No courses listed yet.</p>
                ) : (
                    courses.map((course) => (
                        <Card key={course._id} className="overflow-hidden">
                            {course.imageUrl ? (
                                <div className="aspect-video relative">
                                    <img
                                        src={course.imageUrl}
                                        alt={course.title}
                                        className="object-cover w-full h-full"
                                    />
                                </div>
                            ) : (
                                <div className="aspect-video bg-muted flex items-center justify-center">
                                    <BookOpen className="h-10 w-10 text-muted-foreground" />
                                </div>
                            )}
                            <CardHeader>
                                <CardTitle className="text-lg">{course.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-3 mb-2">{course.description}</p>
                                <p className="font-semibold">PKR {course.price}</p>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
