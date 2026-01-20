"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, ChevronDown, SortAsc, SortDesc, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Id } from "@/convex/_generated/dataModel";

interface Offer {
    _id: Id<"offers">;
    ticketId?: Id<"tickets">;
    requestId?: Id<"tickets">;
    requestTitle?: string;
    price: number;
    status: string;
    _creationTime: number;
}

interface OffersSectionProps {
    offers: Offer[];
}

type SortOption = "newest" | "oldest" | "price-high" | "price-low";

export function OffersSection({ offers }: OffersSectionProps) {
    const [sortOption, setSortOption] = useState<SortOption>("newest");
    const [visibleCount, setVisibleCount] = useState(6);

    const sortOffers = (offers: Offer[], option: SortOption) => {
        return [...offers].sort((a, b) => {
            switch (option) {
                case "newest":
                    return b._creationTime - a._creationTime;
                case "oldest":
                    return a._creationTime - b._creationTime;
                case "price-high":
                    return b.price - a.price;
                case "price-low":
                    return a.price - b.price;
                default:
                    return 0;
            }
        });
    };

    const sortedOffers = sortOffers(offers, sortOption);
    const visibleOffers = sortedOffers.slice(0, visibleCount);
    const hasMore = visibleCount < offers.length;

    const getSortLabel = (option: SortOption) => {
        switch (option) {
            case "newest": return "Newest First";
            case "oldest": return "Oldest First";
            case "price-high": return "Price: High to Low";
            case "price-low": return "Price: Low to High";
        }
    };

    return (
        <section className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Offers Waiting for You</h2>
                        <p className="text-sm text-muted-foreground">
                            {offers.length} {offers.length === 1 ? 'offer' : 'offers'} pending your review
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground hidden sm:inline-block">Sort by:</span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-9 px-4 gap-2 rounded-full border-foreground/10 bg-background/50 backdrop-blur-sm">
                                {sortOption === 'newest' || sortOption === 'oldest' ? (
                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                ) : (
                                    sortOption === 'price-high' ? (
                                        <SortDesc className="h-3.5 w-3.5 text-muted-foreground" />
                                    ) : (
                                        <SortAsc className="h-3.5 w-3.5 text-muted-foreground" />
                                    )
                                )}
                                {getSortLabel(sortOption)}
                                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setSortOption("newest")}>
                                Newest First
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortOption("oldest")}>
                                Oldest First
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortOption("price-high")}>
                                Price: High to Low
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortOption("price-low")}>
                                Price: Low to High
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {visibleOffers.map((offer) => (
                    <Link
                        key={offer._id}
                        href={`/requests/${offer.ticketId || offer.requestId}`}
                        className="block group"
                    >
                        <Card className="glass-card border-none h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden relative">
                            {/* Hover CTA */}
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out">
                                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium shadow-lg">
                                    Review
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </span>
                            </div>

                            <CardContent className="p-5 transition-all duration-300 group-hover:pr-28">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-2xl font-bold text-foreground">
                                        PKR {(offer.price || 0).toLocaleString()}
                                    </span>
                                    <Badge className="bg-amber-500/15 text-amber-700 border-none text-xs group-hover:opacity-0 transition-opacity">
                                        Pending
                                    </Badge>
                                </div>
                                <p className="text-sm font-medium text-foreground/80 line-clamp-1 mb-1">
                                    {offer.requestTitle || "Untitled Request"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Recieved {new Date(offer._creationTime).toLocaleDateString()}
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {hasMore && (
                <div className="mt-8 flex justify-center">
                    <Button
                        variant="ghost"
                        onClick={() => setVisibleCount((prev) => prev + 6)}
                        className="rounded-full px-8 h-10 text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                    >
                        Show More Offers
                        <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            )}
        </section>
    );
}
