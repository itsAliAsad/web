"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

interface SearchBarProps {
    onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
    const [value, setValue] = useState("");
    // Simple debounce implementation inside if hook doesn't exist, but better to check or create hook.
    // For now, I'll implement a simple timeout here to avoid dependency issues if the hook isn't there.

    useEffect(() => {
        const timer = setTimeout(() => {
            onSearch(value);
        }, 500);

        return () => clearTimeout(timer);
    }, [value, onSearch]);

    return (
        <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search requests..."
                className="pl-8"
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
        </div>
    );
}
