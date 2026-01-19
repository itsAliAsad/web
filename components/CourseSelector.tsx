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

    // Determine loading state: loading when query is typed but debounce hasn't caught up, or when courses is undefined
    const isLoading = searchQuery !== debouncedQuery || courses === undefined;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild className="w-full">
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
            <PopoverContent
                className="p-0 !animate-none"
                align="start"
                sideOffset={4}
                style={{
                    width: 'var(--radix-popover-trigger-width)',
                } as React.CSSProperties}
            >
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Search by code or title..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                    />
                    <CommandList className="min-h-[200px]">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Searching...
                            </div>
                        ) : courses?.length === 0 ? (
                            <CommandEmpty>No course found.</CommandEmpty>
                        ) : (
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
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
