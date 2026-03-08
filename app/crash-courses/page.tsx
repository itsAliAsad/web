"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Flame, BookOpen, User, GraduationCap } from "lucide-react";
import Link from "next/link";
import CrashCourseCard from "@/components/crash-courses/CrashCourseCard";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = [
    { value: "all", label: "All" },
    { value: "university", label: "University" },
    { value: "o_levels", label: "O-Level" },
    { value: "a_levels", label: "A-Level" },
    { value: "sat", label: "SAT" },
    { value: "ib", label: "IB" },
    { value: "ap", label: "AP" },
    { value: "general", label: "General" },
];

export default function CrashCoursesPage() {
    const [tab, setTab] = useState("all");
    const [examType, setExamType] = useState<string>("all");
    const [department, setDepartment] = useState<string>("all");
    const [category, setCategory] = useState<string>("all");

    // Main listing
    const allCourses = useQuery(api.crash_courses.list, {
        origin: tab === "requested" ? "demand" : tab === "offered" ? "supply" : undefined,
        examType: examType !== "all" ? (examType as any) : undefined,
        department: department !== "all" ? department : undefined,
        category: category !== "all" ? category as any : undefined,
    });

    // My courses
    const myCourses = useQuery(api.crash_courses.listMy, tab === "mine" ? {} : "skip");

    const isLoading = tab === "mine" ? myCourses === undefined : allCourses === undefined;
    const courses = tab === "mine" ? myCourses : allCourses;

    // Extract unique departments from results for filter (only relevant for university category)
    const departments = Array.from(
        new Set(
            (allCourses ?? [])
                .map((c) => c.department)
                .filter(Boolean) as string[]
        )
    ).sort();

    return (
        <div className="container mx-auto py-10">
            {/* Header */}
            <header className="mb-8">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
                            Crash Courses
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            Intensive exam prep sessions — request one or browse offerings
                        </p>
                    </div>
                    <Link href="/crash-courses/new">
                        <Button className="h-12 px-6 rounded-full bg-foreground text-background hover:bg-foreground/90 font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                            <Plus className="mr-2 h-4 w-4" />
                            Create
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap gap-2 mb-6">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.value}
                        onClick={() => setCategory(cat.value)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                            category === cat.value
                                ? "bg-foreground text-background border-foreground"
                                : "bg-background/50 text-muted-foreground border-foreground/10 hover:border-foreground/30 hover:text-foreground"
                        }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Tabs + Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
                <Tabs value={tab} onValueChange={setTab} className="flex-1">
                    <TabsList className="bg-background/50 border rounded-full p-1">
                        <TabsTrigger value="all" className="rounded-full text-sm font-semibold">
                            All
                        </TabsTrigger>
                        <TabsTrigger value="requested" className="rounded-full text-sm font-semibold">
                            <Flame className="h-3.5 w-3.5 mr-1.5" />
                            Requested
                        </TabsTrigger>
                        <TabsTrigger value="offered" className="rounded-full text-sm font-semibold">
                            <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                            Offered
                        </TabsTrigger>
                        <TabsTrigger value="mine" className="rounded-full text-sm font-semibold">
                            <User className="h-3.5 w-3.5 mr-1.5" />
                            My Courses
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {tab !== "mine" && (category === "all" || category === "university") && (
                    <div className="flex items-center gap-3">
                        <Select value={examType} onValueChange={setExamType}>
                            <SelectTrigger className="w-[140px] rounded-full">
                                <SelectValue placeholder="Exam Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="quiz">Quiz</SelectItem>
                                <SelectItem value="midterm">Midterm</SelectItem>
                                <SelectItem value="final">Final</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>

                        {departments.length > 0 && (
                            <Select value={department} onValueChange={setDepartment}>
                                <SelectTrigger className="w-[160px] rounded-full">
                                    <SelectValue placeholder="Department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    {departments.map((dept) => (
                                        <SelectItem key={dept} value={dept}>
                                            {dept}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                )}
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-52 w-full rounded-xl" />
                    ))}
                </div>
            ) : courses && courses.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {courses.map((cc: any) => (
                        <CrashCourseCard key={cc._id} crashCourse={cc} />
                    ))}
                </div>
            ) : (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/5 via-transparent to-teal-500/5 p-12">
                    <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-amber-400/10 blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-teal-400/10 blur-3xl" />

                    <div className="relative flex flex-col items-center justify-center text-center">
                        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-amber-500/15 to-teal-500/15 flex items-center justify-center mb-6 shadow-lg">
                            <GraduationCap className="h-10 w-10 text-foreground/60" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-3">
                            {tab === "mine" ? "No crash courses yet" : "No crash courses found"}
                        </h3>
                        <p className="text-muted-foreground max-w-md mb-8 text-base leading-relaxed">
                            {tab === "mine"
                                ? "You haven't created or enrolled in any crash courses yet."
                                : "Be the first to create one! Request help before your exam or offer your expertise."}
                        </p>
                        <Link href="/crash-courses/new">
                            <Button className="rounded-full px-8 h-12 bg-foreground text-background hover:bg-foreground/90 font-semibold">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Crash Course
                            </Button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
