"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function SearchPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [category, setCategory] = useState<string | undefined>(undefined);

    // Use search query if present, otherwise list open requests
    const searchResults = useQuery(api.requests.search, { query: searchQuery, category: category === "all" ? undefined : category });
    const openRequests = useQuery(api.requests.listOpen, { category: category === "all" ? undefined : category });

    const requests = searchQuery ? searchResults : openRequests;

    return (
        <div className="container mx-auto py-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Find Jobs</h1>
                    <p className="text-muted-foreground mt-1">Browse open requests and submit offers.</p>
                </div>
                <div className="flex w-full md:w-auto gap-2">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by title..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {/* Add Category Filter Dropdown here if needed */}
                </div>
            </div>

            <div className="grid gap-6">
                {requests === undefined ? (
                    <p>Loading...</p>
                ) : requests.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground text-lg">No jobs found matching your criteria.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {requests.map((request) => (
                            <Card key={request._id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex justify-between items-start gap-2">
                                        <CardTitle className="text-lg line-clamp-1">{request.title}</CardTitle>
                                        <Badge variant="secondary" className="shrink-0">PKR {request.budget}</Badge>
                                    </div>
                                    <CardDescription>
                                        Posted {formatDistanceToNow(request._creationTime)} ago
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                                        {request.description}
                                    </p>
                                    {request.category && (
                                        <Badge variant="outline" className="text-xs">
                                            {request.category}
                                        </Badge>
                                    )}
                                </CardContent>
                                <CardFooter>
                                    <Link href={`/requests/${request._id}`} className="w-full">
                                        <Button className="w-full">View Details</Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
