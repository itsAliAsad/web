"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

import SearchBar from "@/components/search/SearchBar";
import Filters from "@/components/search/Filters";

export default function OpportunitiesPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [category, setCategory] = useState<string | undefined>();

    // Decide which query to use
    const isSearching = !!searchQuery;

    // We need to use conditional logic for hooks or just call both and use one.
    // Convex hooks rules: Hooks must be called in the same order.
    // So we can't conditionally call useQuery.
    // We can pass "skip" to useQuery if we want, or just fetch both and pick one.
    // Better approach: Use a single query that handles both? No, search is special.
    // Let's just fetch based on state.

    const searchResults = useQuery(api.requests.search,
        isSearching ? { query: searchQuery, category } : "skip"
    );

    const listResults = useQuery(api.requests.listOpen,
        !isSearching ? { category } : "skip"
    );

    const requests = isSearching ? searchResults : listResults;

    const createOffer = useMutation(api.offers.create);
    const [selectedRequest, setSelectedRequest] = useState<Id<"requests"> | null>(
        null
    );
    const [offerPrice, setOfferPrice] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleOffer = async () => {
        if (!selectedRequest || !offerPrice) return;
        setIsSubmitting(true);
        try {
            await createOffer({
                requestId: selectedRequest,
                price: Number(offerPrice),
            });
            toast.success("Offer sent successfully!");
            setDialogOpen(false);
            setOfferPrice("");
        } catch (error) {
            toast.error("Failed to send offer");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto py-10">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold">Opportunity Board</h1>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-full md:w-64">
                        <SearchBar onSearch={setSearchQuery} />
                    </div>
                    <Filters category={category} setCategory={setCategory} />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {requests === undefined ? (
                    <p>Loading...</p>
                ) : requests.length === 0 ? (
                    <p className="text-gray-500">No requests found.</p>
                ) : (
                    requests.map((request) => (
                        <Card key={request._id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg">{request.title}</CardTitle>
                                    <Badge>{request.category}</Badge>
                                </div>
                                <CardDescription>
                                    Budget: PKR {request.budget} • Due:{" "}
                                    {new Date(request.deadline).toLocaleDateString()}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-sm text-gray-600 line-clamp-3">
                                    {request.description}
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button
                                            className="w-full"
                                            onClick={() => setSelectedRequest(request._id)}
                                        >
                                            I can do this
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Submit Offer</DialogTitle>
                                            <DialogDescription>
                                                Enter your price for this task. The buyer's budget is PKR{" "}
                                                {request.budget}.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <label htmlFor="price" className="text-right">
                                                    Price
                                                </label>
                                                <Input
                                                    id="price"
                                                    type="number"
                                                    value={offerPrice}
                                                    onChange={(e) => setOfferPrice(e.target.value)}
                                                    className="col-span-3"
                                                    placeholder={request.budget.toString()}
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button
                                                onClick={handleOffer}
                                                disabled={isSubmitting || !offerPrice}
                                            >
                                                {isSubmitting ? "Sending..." : "Send Offer"}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
