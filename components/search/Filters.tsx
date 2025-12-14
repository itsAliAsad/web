"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const DEPARTMENTS = [
    { value: "CS", label: "Computer Science" },
    { value: "MATH", label: "Mathematics" },
    { value: "PHY", label: "Physics" },
    { value: "ECON", label: "Economics" },
    { value: "EE", label: "Electrical Engineering" },
    { value: "MGMT", label: "Management" },
];

const HELP_TYPES = [
    { value: "concept", label: "Concept Explanation" },
    { value: "debugging", label: "Code Debugging" },
    { value: "exam_prep", label: "Exam Prep" },
    { value: "review", label: "Review / Feedback" },
    { value: "other", label: "Other" },
];

interface FiltersProps {
    category?: string;
    setCategory?: (category: string | undefined) => void;
    department?: string;
    setDepartment?: (department: string | undefined) => void;
    helpType?: string;
    setHelpType?: (helpType: string | undefined) => void;
}

export default function Filters({
    category,
    setCategory,
    department,
    setDepartment,
    helpType,
    setHelpType,
}: FiltersProps) {
    return (
        <div className="flex flex-wrap gap-2">
            {/* Department Filter */}
            {setDepartment && (
                <Select
                    value={department || "all"}
                    onValueChange={(val) => setDepartment(val === "all" ? undefined : val)}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {DEPARTMENTS.map((dept) => (
                            <SelectItem key={dept.value} value={dept.value}>
                                {dept.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            {/* Help Type Filter */}
            {setHelpType && (
                <Select
                    value={helpType || "all"}
                    onValueChange={(val) => setHelpType(val === "all" ? undefined : val)}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Help Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {HELP_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                                {type.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            {/* Legacy Category Filter */}
            {setCategory && (
                <Select
                    value={category || "all"}
                    onValueChange={(val) => setCategory(val === "all" ? undefined : val)}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="mentorship">Mentorship</SelectItem>
                        <SelectItem value="career_advice">Career Advice</SelectItem>
                        <SelectItem value="project_help">Project Help</SelectItem>
                    </SelectContent>
                </Select>
            )}
        </div>
    );
}
