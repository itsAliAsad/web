"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Search, Briefcase, ArrowRight, Sparkles, ChevronDown, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Available departments  
const DEPARTMENTS = [
    { value: "all", label: "All Departments" },
    { value: "Computer Science", label: "Computer Science" },
    { value: "Mathematics", label: "Mathematics" },
    { value: "Physics", label: "Physics" },
    { value: "Economics", label: "Economics" },
    { value: "Humanities", label: "Humanities" },
];

// Help types
const HELP_TYPES = [
    { value: "all", label: "All Types" },
    { value: "debugging", label: "Debugging" },
    { value: "concept", label: "Concept" },
    { value: "review", label: "Review" },
    { value: "tutoring", label: "Tutoring" },
    { value: "other", label: "Other" },
];

export default function SearchPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [department, setDepartment] = useState<string>("all");
    const [helpType, setHelpType] = useState<string>("all");

    const searchResults = useQuery(api.tickets.search, {
        query: searchQuery,
        department: department === "all" ? undefined : department,
        helpType: helpType === "all" ? undefined : helpType
    });
    const openRequests = useQuery(api.tickets.listOpen, {
        department: department === "all" ? undefined : department,
        helpType: helpType === "all" ? undefined : helpType
    });

    const requests = searchQuery ? searchResults : openRequests;

    const activeFiltersCount = (department !== "all" ? 1 : 0) + (helpType !== "all" ? 1 : 0);

    const getDepartmentLabel = () => DEPARTMENTS.find(d => d.value === department)?.label || "Department";
    const getHelpTypeLabel = () => HELP_TYPES.find(t => t.value === helpType)?.label || "Type";

    return (
        <div className="container mx-auto py-10">
            {/* Header - Premium Editorial Style */}
            <header className="mb-8">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-6">
                    <div className="space-y-2">
                        <h1 className="text-5xl font-bold tracking-tight text-foreground">
                            Find Jobs
                        </h1>
                        <p className="text-lg text-muted-foreground font-medium">
                            Browse open requests and submit your offers.
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full lg:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by title..."
                            className="pl-11 pr-4 h-12 w-full rounded-full bg-white/80 border-foreground/10 focus:border-foreground/20 shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Filters Row - Clean Dropdowns */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Department Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className={`h-10 rounded-full border-foreground/10 bg-white/60 hover:bg-white/80 ${department !== "all" ? "border-foreground/30 bg-foreground/5" : ""}`}
                            >
                                {getDepartmentLabel()}
                                <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                            {DEPARTMENTS.map((dept) => (
                                <DropdownMenuItem
                                    key={dept.value}
                                    onClick={() => setDepartment(dept.value)}
                                    className={department === dept.value ? "bg-foreground/5" : ""}
                                >
                                    {dept.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Help Type Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className={`h-10 rounded-full border-foreground/10 bg-white/60 hover:bg-white/80 ${helpType !== "all" ? "border-foreground/30 bg-foreground/5" : ""}`}
                            >
                                {getHelpTypeLabel()}
                                <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-40">
                            {HELP_TYPES.map((type) => (
                                <DropdownMenuItem
                                    key={type.value}
                                    onClick={() => setHelpType(type.value)}
                                    className={helpType === type.value ? "bg-foreground/5" : ""}
                                >
                                    {type.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Active Filter Clear */}
                    {activeFiltersCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setDepartment("all"); setHelpType("all"); }}
                            className="h-10 text-muted-foreground hover:text-foreground rounded-full"
                        >
                            Clear filters
                            <X className="ml-1 h-3.5 w-3.5" />
                        </Button>
                    )}

                    {/* Results Count */}
                    {requests && requests.length > 0 && (
                        <div className="flex items-center gap-2 ml-auto">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            <span className="text-sm text-muted-foreground">
                                <span className="font-semibold text-foreground">{requests.length}</span> jobs
                            </span>
                        </div>
                    )}
                </div>
            </header>

            {/* Job Cards Grid */}
            {requests === undefined ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="glass-card border-none h-48 animate-pulse">
                            <CardContent className="p-6">
                                <div className="h-5 bg-foreground/5 rounded w-3/4 mb-3" />
                                <div className="h-4 bg-foreground/5 rounded w-1/2 mb-4" />
                                <div className="h-4 bg-foreground/5 rounded w-full mb-2" />
                                <div className="h-4 bg-foreground/5 rounded w-2/3" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : requests.length === 0 ? (
                <EmptyState
                    icon={Briefcase}
                    title="No jobs found"
                    description={
                        searchQuery
                            ? `No jobs matching "${searchQuery}"`
                            : activeFiltersCount > 0
                                ? "No jobs match your filters. Try adjusting them."
                                : "No jobs available right now. Check back later!"
                    }
                    action={activeFiltersCount > 0 ? (
                        <Button variant="outline" className="rounded-full" onClick={() => { setDepartment("all"); setHelpType("all"); }}>
                            Clear Filters
                        </Button>
                    ) : undefined}
                />
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {requests.map((request) => (
                        <Link key={request._id} href={`/requests/${request._id}`} className="block group">
                            <Card className="glass-card border-none h-full transition-all duration-300 hover:shadow-lg overflow-hidden relative">
                                {/* Hover CTA */}
                                <div className="absolute right-4 bottom-5 z-20 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out">
                                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium shadow-lg">
                                        View Details
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </span>
                                </div>

                                <CardContent className="p-6 h-full flex flex-col">
                                    {/* Header Row */}
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <h3 className="font-semibold text-lg text-foreground line-clamp-1 group-hover:text-foreground/80 transition-colors">
                                            {request.title}
                                        </h3>
                                        <span className="shrink-0 text-lg font-bold text-foreground">
                                            PKR {(request.budget || 0).toLocaleString()}
                                        </span>
                                    </div>

                                    {/* Posted Time */}
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Posted {formatDistanceToNow(request._creationTime)} ago
                                    </p>

                                    {/* Description */}
                                    <p className="text-sm text-muted-foreground line-clamp-2 flex-grow mb-4">
                                        {request.description}
                                    </p>

                                    {/* Category Badges */}
                                    <div className="flex flex-wrap gap-1.5 transition-opacity duration-300 group-hover:opacity-0">
                                        <Badge variant="secondary" className="text-xs bg-foreground/5 text-muted-foreground font-normal border-none">
                                            {request.helpType || request.customCategory || "General"}
                                        </Badge>
                                        {request.department && (
                                            <Badge variant="secondary" className="text-xs bg-foreground/5 text-muted-foreground font-normal border-none">
                                                {request.department}
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
