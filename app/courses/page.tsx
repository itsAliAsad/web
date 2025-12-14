"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, BookOpen, GraduationCap } from "lucide-react";

const DEPARTMENTS = [
    "Computer Science",
    "Mathematics",
    "Physics",
    "Economics",
    "Humanities",
];

export default function CoursesPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState<string>("all");

    const courses = useQuery(api.university_courses.getAll);

    // Filter courses based on search and department
    const filteredCourses = courses?.filter((course) => {
        const matchesSearch =
            !searchQuery ||
            course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.name.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesDepartment =
            departmentFilter === "all" || course.department === departmentFilter;

        return matchesSearch && matchesDepartment;
    });

    // Group courses by department
    const coursesByDepartment = filteredCourses?.reduce(
        (acc, course) => {
            const dept = course.department || "Other";
            if (!acc[dept]) acc[dept] = [];
            acc[dept].push(course);
            return acc;
        },
        {} as Record<string, typeof courses>
    );

    return (
        <div className="container mx-auto py-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <GraduationCap className="h-8 w-8" />
                        Course Catalog
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Browse all available courses for tutoring
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search courses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Department" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            {DEPARTMENTS.map((dept) => (
                                <SelectItem key={dept} value={dept}>
                                    {dept}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {courses === undefined ? (
                <p>Loading courses...</p>
            ) : filteredCourses?.length === 0 ? (
                <div className="text-center py-16">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No courses found</h3>
                    <p className="text-muted-foreground">
                        Try adjusting your search or filter
                    </p>
                </div>
            ) : departmentFilter === "all" ? (
                // Show grouped by department
                <div className="space-y-8">
                    {Object.entries(coursesByDepartment || {}).map(([dept, deptCourses]) => (
                        <div key={dept}>
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                {dept}
                                <Badge variant="secondary" className="ml-2">
                                    {deptCourses?.length} courses
                                </Badge>
                            </h2>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {deptCourses?.map((course) => (
                                    <CourseCard key={course._id} course={course} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                // Show flat list when filtering
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredCourses?.map((course) => (
                        <CourseCard key={course._id} course={course} />
                    ))}
                </div>
            )}
        </div>
    );
}

function CourseCard({ course }: { course: any }) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-semibold">{course.code}</CardTitle>
                    <Badge variant="outline">{course.department}</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">{course.name}</p>
            </CardContent>
        </Card>
    );
}
