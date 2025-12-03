"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface FiltersProps {
    category: string | undefined;
    setCategory: (category: string | undefined) => void;
    // Add more filters as needed
}

export default function Filters({ category, setCategory }: FiltersProps) {
    return (
        <div className="flex gap-2">
            <Select
                value={category || "all"}
                onValueChange={(val) => setCategory(val === "all" ? undefined : val)}
            >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Development">Development</SelectItem>
                    <SelectItem value="Writing">Writing</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
