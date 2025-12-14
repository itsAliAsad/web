"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { StudyGroupCard } from "@/components/study-groups/StudyGroupCard";
import { CourseSelector } from "@/components/CourseSelector";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { Plus, GraduationCap, Users, BadgeCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function StudyGroupsPage() {
    const [selectedCourseId, setSelectedCourseId] = useState<Id<"university_courses"> | undefined>();
    const [selectedCourseCode, setSelectedCourseCode] = useState<string>("");

    // Query study groups for selected course
    const groups = useQuery(api.study_groups.listByCourse, {
        courseId: selectedCourseId
    });

    // Query tutors for selected course
    const tutors = useQuery(
        api.tutor_offerings.listByCourse,
        selectedCourseId ? { courseId: selectedCourseId } : "skip"
    );

    const createGroup = useMutation(api.study_groups.create);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        if (!selectedCourseId) {
            toast.error("Please select a course first");
            return;
        }

        try {
            await createGroup({
                title: formData.get("title") as string,
                description: formData.get("description") as string,
                maxMembers: Number(formData.get("maxMembers")),
                courseId: selectedCourseId,
            });
            toast.success("Study Group Created!");
            setIsCreateOpen(false);
        } catch (error) {
            toast.error("Failed to create group");
        }
    };

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Study Groups</h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Left Sidebar */}
                <div className="space-y-6">
                    <div className="p-4 border rounded-lg bg-card">
                        <Label className="mb-2 block">Filter by Course</Label>
                        <CourseSelector
                            onSelect={(id, code) => {
                                setSelectedCourseId(id);
                                setSelectedCourseCode(code);
                            }}
                        />
                        {!selectedCourseId && (
                            <p className="text-xs text-muted-foreground mt-2">Select a course to see study groups and tutors.</p>
                        )}
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full">
                                <Plus className="mr-2 h-4 w-4" /> Create Group
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Study Group</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Group Title</Label>
                                    <Input id="title" name="title" required placeholder="e.g. Midterm Prep" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="course">Course</Label>
                                    <div className="text-sm font-medium p-2 border rounded bg-muted/50">
                                        {selectedCourseCode || "No Course Selected (General Group)"}
                                    </div>
                                    {!selectedCourseId && <p className="text-xs text-destructive">Please select a course in the sidebar first.</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="maxMembers">Max Members</Label>
                                    <Input id="maxMembers" name="maxMembers" type="number" min="2" max="20" defaultValue="5" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea id="description" name="description" placeholder="What will you study?" />
                                </div>
                                <Button type="submit" className="w-full" disabled={!selectedCourseId}>Create Group</Button>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* Find Tutors Section */}
                    {selectedCourseId && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4" />
                                    Tutors for {selectedCourseCode}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {tutors === undefined ? (
                                    <p className="text-sm text-muted-foreground">Loading tutors...</p>
                                ) : tutors.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No tutors available for this course yet.</p>
                                ) : (
                                    tutors.map((tutor) => (
                                        <Link
                                            key={tutor._id}
                                            href={`/profile/${tutor.tutorId}`}
                                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                                        >
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={tutor.tutorImage} />
                                                <AvatarFallback>{tutor.tutorName?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-sm font-medium truncate">{tutor.tutorName}</span>
                                                    {tutor.tutorIsVerified && (
                                                        <BadgeCheck className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                                                    )}
                                                </div>
                                                <Badge variant="outline" className="text-xs">
                                                    {tutor.level}
                                                </Badge>
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Grid */}
                <div className="md:col-span-3">
                    {groups === undefined ? (
                        <div className="text-center py-12">Loading...</div>
                    ) : groups.length === 0 ? (
                        <div className="text-center py-12 border border-dashed rounded-lg">
                            <Users className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                            <h3 className="text-lg font-medium">No Study Groups Found</h3>
                            <p className="text-muted-foreground">Select a course or be the first to create one!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {groups.map((group) => (
                                <StudyGroupCard
                                    key={group._id}
                                    group={group}
                                    courseCode={selectedCourseCode}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

