"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ReportDialog from "@/components/trust/ReportDialog";
import VerifiedBadge from "@/components/trust/VerifiedBadge";

export default function RequestDetailsPage() {
    const params = useParams();
    const requestId = params.id as Id<"requests">;
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");

    // Offer form state
    const [offerPrice, setOfferPrice] = useState("");
    const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

    const request = useQuery(api.requests.get, { id: requestId });
    const offers = useQuery(api.offers.listByRequest, { requestId });
    const currentUser = useQuery(api.users.currentUser);

    const acceptOffer = useMutation(api.offers.accept);
    const completeRequest = useMutation(api.requests.complete);
    const createReview = useMutation(api.reviews.create);
    const createOffer = useMutation(api.offers.create);

    const isOwner = currentUser && request && currentUser._id === request.buyerId;
    const isSeller = currentUser && request && currentUser._id !== request.buyerId;

    const handleAccept = async (offerId: Id<"offers">) => {
        try {
            await acceptOffer({ offerId, requestId });
            toast.success("Offer accepted!");
        } catch (error) {
            toast.error("Failed to accept offer");
            console.error(error);
        }
    };

    const handleComplete = async () => {
        try {
            await completeRequest({ id: requestId });
            await createReview({
                requestId,
                rating,
                comment,
                type: "buyer_to_seller"
            });
            toast.success("Request completed and review submitted!");
            setReviewDialogOpen(false);
        } catch (error) {
            toast.error("Failed to complete request");
            console.error(error);
        }
    };

    const handleSubmitOffer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!offerPrice) return;

        setIsSubmittingOffer(true);
        try {
            await createOffer({
                requestId,
                price: Number(offerPrice),
            });
            toast.success("Offer submitted successfully!");
            setOfferPrice("");
        } catch (error: any) {
            toast.error(error.message || "Failed to submit offer");
            console.error(error);
        } finally {
            setIsSubmittingOffer(false);
        }
    };

    if (request === undefined || offers === undefined || currentUser === undefined) return <div className="p-10">Loading...</div>;
    if (request === null) return <div className="p-10">Request not found</div>;

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-4">{request.title}</h1>
            <div className="flex gap-2 mb-8">
                <Badge>{request.status}</Badge>
                <Badge variant="outline">{request.category}</Badge>
                <Badge variant="secondary">Budget: PKR {request.budget}</Badge>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-wrap">{request.description}</p>
                        </CardContent>
                    </Card>

                    {/* Active Session Card - Visible to Owner or Accepted Seller */}
                    {request.status === "in_progress" && (
                        <Card className="bg-green-50 border-green-200">
                            <CardHeader>
                                <CardTitle className="text-green-800">Active Session</CardTitle>
                                <CardDescription className="text-green-700">
                                    This request is in progress.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="font-medium mb-2">Contact Info:</p>
                                <p className="text-sm text-gray-600 mb-4">
                                    You can now message the other party to discuss details.
                                </p>
                                <div className="flex gap-2">
                                    <Button onClick={() => window.location.href = "/messages"}>
                                        Message {isOwner ? "Seller" : "Buyer"}
                                    </Button>
                                    {isOwner && (
                                        <Button variant="outline" onClick={() => setReviewDialogOpen(true)}>
                                            Mark as Done
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div>
                    {isOwner ? (
                        <>
                            <h2 className="text-xl font-semibold mb-4">Offers ({offers.length})</h2>
                            <div className="space-y-4">
                                {offers.length === 0 ? (
                                    <p className="text-gray-500">No offers yet.</p>
                                ) : (
                                    offers.map((offer) => (
                                        <Card key={offer._id} className={offer.status === 'accepted' ? 'border-green-500 bg-green-50' : ''}>
                                            <CardHeader className="pb-2">
                                                <div className="flex justify-between items-center">
                                                    <CardTitle className="text-base">PKR {offer.price}</CardTitle>
                                                    {offer.status === 'accepted' && <Badge className="bg-green-600">Accepted</Badge>}
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex justify-between items-center mb-4">
                                                    <div className="flex items-center">
                                                        <p className="text-xs text-gray-500">Seller: {offer.sellerId.toString().slice(0, 8)}...</p>
                                                        <VerifiedBadge />
                                                    </div>
                                                    <ReportDialog targetId={offer.sellerId} requestId={requestId} />
                                                </div>
                                                {request.status === "open" && (
                                                    <Button size="sm" className="w-full" onClick={() => handleAccept(offer._id)}>
                                                        Accept Offer
                                                    </Button>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Seller View */}
                            {request.status === "open" ? (
                                offers.find(o => o.sellerId === currentUser?._id) ? (
                                    <Card className="bg-blue-50 border-blue-200">
                                        <CardHeader>
                                            <CardTitle className="text-blue-800">Offer Submitted</CardTitle>
                                            <CardDescription className="text-blue-700">
                                                You have placed an offer for this request.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex justify-between items-center">
                                                <p className="font-medium text-lg">
                                                    PKR {offers.find(o => o.sellerId === currentUser._id)?.price}
                                                </p>
                                                <Badge className="bg-blue-600">Pending</Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Submit an Offer</CardTitle>
                                            <CardDescription>
                                                Place your bid for this request.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <form onSubmit={handleSubmitOffer} className="space-y-4">
                                                <div className="space-y-2">
                                                    <label htmlFor="price" className="text-sm font-medium">
                                                        Your Price (PKR)
                                                    </label>
                                                    <Input
                                                        id="price"
                                                        type="number"
                                                        placeholder="e.g. 5000"
                                                        value={offerPrice}
                                                        onChange={(e) => setOfferPrice(e.target.value)}
                                                        required
                                                        min="1"
                                                    />
                                                </div>
                                                <Button type="submit" className="w-full" disabled={isSubmittingOffer}>
                                                    {isSubmittingOffer ? "Submitting..." : "Submit Offer"}
                                                </Button>
                                            </form>
                                        </CardContent>
                                    </Card>
                                )
                            ) : (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Request Status</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-gray-600">
                                            This request is currently {request.status}.
                                            {request.status !== "open" && " No new offers are being accepted."}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}
                </div>
            </div>

            <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Complete Request & Review</DialogTitle>
                        <DialogDescription>
                            Mark this request as done and leave a review for the seller.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="rating" className="text-right">Rating (1-5)</label>
                            <Input id="rating" type="number" min="1" max="5" value={rating} onChange={(e) => setRating(Number(e.target.value))} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="comment" className="text-right">Comment</label>
                            <Textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleComplete}>Submit Review</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
