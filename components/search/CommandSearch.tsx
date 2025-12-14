"use client";

import * as React from "react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

export function CommandSearch() {
    const [open, setOpen] = React.useState(false);
    const router = useRouter();

    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false);
        command();
    }, []);

    if (!mounted) {
        return (
            <Button
                variant="outline"
                className="relative h-10 w-full justify-start text-sm text-muted-foreground sm:w-64 lg:w-80 neo-button bg-background"
                onClick={() => setOpen(true)}
            >
                <Search className="mr-2 h-4 w-4" />
                <span>Search...</span>
                <kbd className="pointer-events-none absolute right-2 top-2.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex text-foreground">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>
        );
    }

    return (
        <>
            <Button
                variant="outline"
                className="relative h-10 w-full justify-start text-sm text-muted-foreground sm:w-64 lg:w-80 neo-button bg-background"
                onClick={() => setOpen(true)}
            >
                <Search className="mr-2 h-4 w-4" />
                <span>Search...</span>
                <kbd className="pointer-events-none absolute right-2 top-2.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex text-foreground">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Type a command or search..." />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup heading="Suggestions">
                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/seller"))}>
                            <span>Dashboard</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/messages"))}>
                            <span>Messages</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/profile/me"))}>
                            <span>My Profile</span>
                        </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Search">
                        <CommandItem onSelect={() => runCommand(() => router.push("/search?q=design"))}>
                            <span>Design Services</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/search?q=development"))}>
                            <span>Development</span>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    );
}
