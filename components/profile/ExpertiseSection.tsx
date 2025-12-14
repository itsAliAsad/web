"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CourseSelector } from "@/components/CourseSelector";
import { Plus, X, GraduationCap } from "lucide-react";
import { toast } from "sonner";

const LEVELS = [
    { value: "Beginner", label: "Beginner" },
    { value: "Intermediate", label: "Intermediate" },
    { value: "Advanced", label: "Advanced" },
];

interface ExpertiseSectionProps {
    userId: Id<"users">;
    isOwner: boolean;
}

export default function ExpertiseSection({ userId, isOwner }: ExpertiseSectionProps) {
    const offerings = useQuery(api.tutor_offerings.listByTutor, { tutorId: userId });
    const addOffering = useMutation(api.tutor_offerings.add);
    const removeOffering = useMutation(api.tutor_offerings.remove);

    const [open, setOpen] = useState(false);
    const [selectedCourseId, setSelectedCourseId] = useState<Id<"university_courses"> | undefined>();
    const [selectedCourseCode, setSelectedCourseCode] = useState("");
    const [level, setLevel] = useState("Intermediate");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAdd = async () => {
        if (!selectedCourseId) {
            toast.error("Please select a course");
            return;
        }

        setIsSubmitting(true);
        try {
            await addOffering({ courseId: selectedCourseId, level });
            toast.success("Course expertise added");
            setOpen(false);
            setSelectedCourseId(undefined);
            setSelectedCourseCode("");
        } catch (error: any) {
            toast.error(error.message || "Failed to add expertise");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemove = async (offeringId: Id<"tutor_offerings">) => {
        try {
            await removeOffering({ offeringId });
            toast.success("Removed");
        } catch (error) {
            toast.error("Failed to remove");
        }
    };

    if (offerings === undefined) return <div>Loading expertise...</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <GraduationCap className="h-6 w-6" />
                    Course Expertise
                </h2>
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
                                <DialogTitle>Add Course Expertise</DialogTitle>
                                <DialogDescription>
                                    Add a course you can tutor students in.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Select Course</label>
                                    <CourseSelector
                                        onSelect={(id, code) => {
                                            setSelectedCourseId(id);
                                            setSelectedCourseCode(code);
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Your Expertise Level</label>
                                    <Select value={level} onValueChange={setLevel}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {LEVELS.map((l) => (
                                                <SelectItem key={l.value} value={l.value}>
                                                    {l.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAdd} disabled={isSubmitting}>
                                    {isSubmitting ? "Adding..." : "Add Expertise"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                {offerings.length === 0 ? (
                    <p className="text-muted-foreground">No course expertise listed yet.</p>
                ) : (
                    offerings.map((offering) => (
                        <Badge
                            key={offering._id}
                            variant="secondary"
                            className="text-sm px-3 py-1.5 flex items-center gap-2"
                        >
                            <span className="font-semibold">{offering.courseCode}</span>
                            <span className="text-muted-foreground">•</span>
                            <span>{offering.level}</span>
                            {isOwner && (
                                <button
                                    onClick={() => handleRemove(offering._id)}
                                    className="ml-1 hover:text-destructive"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </Badge>
                    ))
                )}
            </div>
        </div>
    );
}
