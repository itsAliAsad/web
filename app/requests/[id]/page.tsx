"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ReportDialog from "@/components/trust/ReportDialog";
import VerifiedBadge from "@/components/trust/VerifiedBadge";
import { MessageSquare, CheckCircle2, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function RequestDetailsPage() {
    const params = useParams();
    const ticketId = params.id as Id<"tickets">;
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [sellerReviewDialogOpen, setSellerReviewDialogOpen] = useState(false);
    const [sellerRating, setSellerRating] = useState(5);
    const [sellerComment, setSellerComment] = useState("");
    const [offerPrice, setOfferPrice] = useState("");
    const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

    const request = useQuery(api.tickets.get, { id: ticketId });
    const offers = useQuery(api.offers.listByTicket, { ticketId });
    const currentUser = useQuery(api.users.currentUser);

    const acceptOffer = useMutation(api.offers.accept);
    const completeRequest = useMutation(api.tickets.complete);
    const createReview = useMutation(api.reviews.create);
    const createOffer = useMutation(api.offers.create);

    const isOwner = currentUser && request && currentUser._id === request.studentId;
    const isSeller = currentUser && request && currentUser._id !== request.studentId;
    const acceptedOffer = offers?.find((o) => o.status === "accepted");
    const acceptedByCurrentSeller = offers?.find(
        (o) => o.status === "accepted" && currentUser && o.tutorId === currentUser._id
    );

    const handleAccept = async (offerId: Id<"offers">) => {
        if (currentUser?.isBanned) return;
        try {
            await acceptOffer({ offerId, ticketId });
            toast.success("Offer accepted!");
        } catch (error) {
            toast.error("Failed to accept offer");
            console.error(error);
        }
    };

    const handleComplete = async () => {
        if (currentUser?.isBanned) return;
        try {
            await completeRequest({ id: ticketId });
            await createReview({
                ticketId,
                rating,
                comment,
                type: "student_to_tutor"
            });
            toast.success("Ticket resolved and review submitted!");
            setReviewDialogOpen(false);
        } catch (error) {
            toast.error("Failed to complete ticket");
            console.error(error);
        }
    };

    const handleSubmitOffer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!offerPrice) return;

        if (currentUser?.isBanned) {
            toast.error("You are banned and cannot submit offers.");
            return;
        }

        setIsSubmittingOffer(true);
        try {
            await createOffer({
                ticketId,
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

    const handleSellerReview = async () => {
        if (!acceptedByCurrentSeller || currentUser?.isBanned) return;
        try {
            await createReview({
                ticketId,
                rating: sellerRating,
                comment: sellerComment,
                type: "tutor_to_student",
            });
            toast.success("Review submitted!");
            setSellerReviewDialogOpen(false);
        } catch (error) {
            toast.error("Failed to submit review");
            console.error(error);
        }
    };

    if (request === undefined || offers === undefined || currentUser === undefined) {
        return (
            <div className="container mx-auto py-10">
                <div className="animate-pulse space-y-6">
                    <div className="h-12 bg-foreground/5 rounded-lg w-2/3" />
                    <div className="flex gap-2">
                        <div className="h-6 w-16 bg-foreground/5 rounded-full" />
                        <div className="h-6 w-20 bg-foreground/5 rounded-full" />
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 h-48 bg-foreground/5 rounded-2xl" />
                        <div className="h-64 bg-foreground/5 rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (request === null) {
        return (
            <div className="container mx-auto py-10 text-center">
                <h1 className="text-2xl font-bold mb-4">Request not found</h1>
                <Link href="/search">
                    <Button variant="outline" className="rounded-full">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Jobs
                    </Button>
                </Link>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-emerald-500/15 text-emerald-700 border-none';
            case 'in_progress': return 'bg-amber-500/15 text-amber-700 border-none';
            case 'resolved': return 'bg-foreground/10 text-foreground border-none';
            default: return 'bg-foreground/5 text-muted-foreground border-none';
        }
    };

    return (
        <div className="container mx-auto py-10">
            {/* Back Link */}
            <Link href="/search" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group">
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back to Jobs
            </Link>

            {/* Header - Premium Editorial */}
            <header className="mb-10">
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
                    {request.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                    <Badge className={getStatusColor(request.status)}>
                        {request.status === 'open' && <Clock className="h-3 w-3 mr-1" />}
                        {request.status === 'in_progress' && <Clock className="h-3 w-3 mr-1" />}
                        {request.status === 'resolved' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {request.status}
                    </Badge>
                    <Badge variant="secondary" className="bg-foreground/5 text-muted-foreground border-none font-normal">
                        {request.helpType || request.customCategory || 'General'}
                    </Badge>
                    <span className="text-lg font-bold text-foreground ml-2">
                        PKR {(request.budget || 0).toLocaleString()}
                    </span>
                </div>
            </header>

            {/* Main Content Grid */}
            <div className="grid gap-8 lg:grid-cols-3">
                {/* Left Column - Description */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="glass-card border-none">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl font-bold">Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
                                {request.description}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Active Session Card */}
                    {request.status === "in_progress" && (
                        <Card className="glass-card border-none shadow-glow-amber">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-xl font-bold flex items-center gap-2">
                                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                                    Active Session
                                </CardTitle>
                                <CardDescription>
                                    This request is in progress. You can now communicate with the other party.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-3">
                                    <Button
                                        onClick={() => window.location.href = "/messages"}
                                        className="rounded-full h-11 px-6"
                                    >
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Message {isOwner ? "Seller" : "Buyer"}
                                    </Button>
                                    {isOwner && (
                                        <Button
                                            variant="outline"
                                            onClick={() => setReviewDialogOpen(true)}
                                            className="rounded-full h-11 px-6"
                                        >
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                            Mark as Done
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column - Offers / Submit Offer */}
                <div className="space-y-6">
                    {isOwner ? (
                        <>
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold">Offers</h2>
                                <span className="text-sm text-muted-foreground">
                                    {offers.length} received
                                </span>
                            </div>
                            <div className="space-y-3">
                                {offers.length === 0 ? (
                                    <Card className="glass-card border-none">
                                        <CardContent className="py-8 text-center">
                                            <p className="text-muted-foreground">No offers yet. Hang tight!</p>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    offers.map((offer) => (
                                        <Card
                                            key={offer._id}
                                            className={`glass-card border-none transition-all ${offer.status === 'accepted' ? 'shadow-glow-teal' : ''
                                                }`}
                                        >
                                            <CardContent className="p-5">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-2xl font-bold text-foreground">
                                                        PKR {(offer.price || 0).toLocaleString()}
                                                    </span>
                                                    {offer.status === 'accepted' && (
                                                        <Badge className="bg-teal-500/15 text-teal-700 border-none">
                                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                                            Accepted
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-sm text-muted-foreground">
                                                            {offer.tutorName || `Tutor ${offer.tutorId?.toString().slice(0, 6)}...`}
                                                        </span>
                                                        {offer.sellerIsVerified && <VerifiedBadge />}
                                                    </div>
                                                    <ReportDialog targetId={offer.tutorId} requestId={ticketId} />
                                                </div>
                                                {request.status === "open" && (
                                                    <Button
                                                        size="sm"
                                                        className="w-full rounded-full h-10"
                                                        onClick={() => handleAccept(offer._id)}
                                                    >
                                                        Accept Offer
                                                    </Button>
                                                )}
                                                {offer.status === "accepted" && (request.status === "in_session" || request.status === "in_progress") && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="w-full rounded-full h-10"
                                                        onClick={() => window.location.href = "/messages"}
                                                    >
                                                        <MessageSquare className="h-4 w-4 mr-2" />
                                                        Message Tutor
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
                            {request.status === "open" ? (
                                offers.find(o => o.tutorId === currentUser?._id) ? (
                                    <Card className="glass-card border-none shadow-glow-teal">
                                        <CardHeader className="pb-4">
                                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                                <CheckCircle2 className="h-5 w-5 text-teal-600" />
                                                Offer Submitted
                                            </CardTitle>
                                            <CardDescription>
                                                Your bid has been placed. Waiting for response.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center justify-between">
                                                <span className="text-2xl font-bold text-foreground">
                                                    PKR {offers.find(o => o.tutorId === currentUser?._id)?.price?.toLocaleString()}
                                                </span>
                                                <Badge variant="secondary" className="bg-foreground/5 text-muted-foreground border-none">
                                                    Pending
                                                </Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <Card className="glass-card border-none">
                                        <CardHeader className="pb-4">
                                            <CardTitle className="text-xl font-bold">Submit an Offer</CardTitle>
                                            <CardDescription>
                                                Place your bid for this request.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <form onSubmit={handleSubmitOffer} className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="price" className="text-sm font-medium">
                                                        Your Price (PKR)
                                                    </Label>
                                                    <Input
                                                        id="price"
                                                        type="number"
                                                        placeholder="e.g. 5000"
                                                        value={offerPrice}
                                                        onChange={(e) => setOfferPrice(e.target.value)}
                                                        required
                                                        min="1"
                                                        className="h-12 rounded-xl"
                                                    />
                                                </div>
                                                <Button
                                                    type="submit"
                                                    className="w-full h-12 rounded-full font-semibold"
                                                    disabled={isSubmittingOffer}
                                                >
                                                    {isSubmittingOffer ? "Submitting..." : "Submit Offer"}
                                                </Button>
                                            </form>
                                        </CardContent>
                                    </Card>
                                )
                            ) : (
                                <Card className="glass-card border-none">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-xl font-bold">Request Status</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground">
                                            This request is currently <span className="font-medium text-foreground">{request.status}</span>.
                                            No new offers are being accepted.
                                        </p>
                                    </CardContent>
                                </Card>
                            )}

                            {request.status === "resolved" && acceptedByCurrentSeller && (
                                <Card className="glass-card border-none">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-xl font-bold">Leave a Review</CardTitle>
                                        <CardDescription>Share your experience after completing the job.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button
                                            onClick={() => setSellerReviewDialogOpen(true)}
                                            className="w-full h-11 rounded-full"
                                        >
                                            Write Review
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Review Dialog - Student to Tutor */}
            <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Complete Request & Review</DialogTitle>
                        <DialogDescription>
                            Mark this request as done and leave a review for the seller.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="rating" className="text-right">Rating (1-5)</Label>
                            <Input
                                id="rating"
                                type="number"
                                min="1"
                                max="5"
                                value={rating}
                                onChange={(e) => setRating(Number(e.target.value))}
                                className="col-span-3 rounded-xl"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="comment" className="text-right">Comment</Label>
                            <Textarea
                                id="comment"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="col-span-3 rounded-xl"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleComplete} className="rounded-full">Submit Review</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Review Dialog - Tutor to Student */}
            <Dialog open={sellerReviewDialogOpen} onOpenChange={setSellerReviewDialogOpen}>
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Review the Buyer</DialogTitle>
                        <DialogDescription>
                            Leave feedback for the buyer now that the job is completed.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="seller-rating" className="text-right">Rating (1-5)</Label>
                            <Input
                                id="seller-rating"
                                type="number"
                                min="1"
                                max="5"
                                value={sellerRating}
                                onChange={(e) => setSellerRating(Number(e.target.value))}
                                className="col-span-3 rounded-xl"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="seller-comment" className="text-right">Comment</Label>
                            <Textarea
                                id="seller-comment"
                                value={sellerComment}
                                onChange={(e) => setSellerComment(e.target.value)}
                                className="col-span-3 rounded-xl"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSellerReview} className="rounded-full">Submit Review</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
