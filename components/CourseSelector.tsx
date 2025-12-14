"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useDebounce } from "use-debounce";
import { Id } from "@/convex/_generated/dataModel";

interface CourseSelectorProps {
    onSelect: (courseId: Id<"university_courses">, code: string) => void;
    defaultValue?: string;
}

export function CourseSelector({ onSelect, defaultValue }: CourseSelectorProps) {
    const [open, setOpen] = React.useState(false);
    const [value, setValue] = React.useState(defaultValue || "");
    const [searchQuery, setSearchQuery] = React.useState("");
    const [debouncedQuery] = useDebounce(searchQuery, 300);

    const courses = useQuery(api.university_courses.search, { query: debouncedQuery });

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {value
                        ? value
                        : "Select course..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Search course code..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                    />
                    <CommandList>
                        <CommandEmpty>No course found.</CommandEmpty>
                        <CommandGroup>
                            {courses?.map((course: any) => (
                                <CommandItem
                                    key={course._id}
                                    value={course.code}
                                    onSelect={(currentValue) => {
                                        setValue(currentValue === value ? "" : currentValue);
                                        onSelect(course._id, course.code);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === course.code ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {course.code} - {course.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
