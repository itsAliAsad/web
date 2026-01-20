"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState, useMemo } from "react";
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
import { CheckCircle2, Clock, ArrowLeft, Star } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import MessageButton from "@/components/chat/MessageButton";
import { formatStatus } from "@/lib/utils";
import StarRating from "@/components/reviews/StarRating";

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
    const [sortBy, setSortBy] = useState<"best" | "price" | "rating" | "newest">("best");

    const request = useQuery(api.tickets.get, { id: ticketId });
    const offers = useQuery(api.offers.listByTicket, { ticketId });
    const currentUser = useQuery(api.users.currentUser);

    const acceptOffer = useMutation(api.offers.accept);
    const completeRequest = useMutation(api.tickets.complete);
    const createReview = useMutation(api.reviews.create);
    const createOffer = useMutation(api.offers.create);

    const isOwner = currentUser && request && currentUser._id === request.studentId;
    // const isSeller = currentUser && request && currentUser._id !== request.studentId;
    const acceptedOffer = offers?.find((o) => o.status === "accepted");
    const acceptedByCurrentSeller = offers?.find(
        (o) => o.status === "accepted" && currentUser && o.tutorId === currentUser._id
    );

    // Sort offers based on selected sort option
    const sortedOffers = useMemo(() => {
        if (!offers) return [];
        const sorted = [...offers];
        switch (sortBy) {
            case "price":
                return sorted.sort((a, b) => a.price - b.price);
            case "rating":
                return sorted.sort((a, b) => (b.tutorReputation ?? 0) - (a.tutorReputation ?? 0));
            case "newest":
                return sorted.sort((a, b) => (b._creationTime ?? 0) - (a._creationTime ?? 0));
            case "best":
            default:
                return sorted.sort((a, b) => (b.rankScore ?? 0) - (a.rankScore ?? 0));
        }
    }, [offers, sortBy]);

    // Helper for match percentage badge styling
    const getMatchBadgeStyle = (matchPercent: number) => {
        if (matchPercent >= 80) return "bg-emerald-500/15 text-emerald-700";
        if (matchPercent >= 60) return "bg-amber-500/15 text-amber-700";
        return "bg-foreground/5 text-muted-foreground";
    };

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
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to submit offer";
            toast.error(message);
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
                <Link href={currentUser?.role === "student" ? "/dashboard/buyer" : "/search"}>
                    <Button variant="outline" className="rounded-full">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {currentUser?.role === "student" ? "Back to Dashboard" : "Back to Jobs"}
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
            <Link
                href={isOwner ? "/dashboard/buyer" : "/search"}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
            >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                {isOwner ? "Back to Dashboard" : "Back to Jobs"}
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
                        {formatStatus(request.status)}
                    </Badge>
                    <Badge variant="secondary" className="bg-foreground/5 text-muted-foreground border-none font-normal">
                        {formatStatus(request.helpType || request.customCategory || 'General')}
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
                                    <MessageButton
                                        otherUserId={isOwner ? (acceptedOffer?.tutorId as Id<"users">) : request.studentId}
                                        className="rounded-full h-11 px-6"
                                    >
                                        Message {isOwner ? "Seller" : "Buyer"}
                                    </MessageButton>
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
                    {/* About the Student (Visible to everyone except the student) */}
                    {!isOwner && request.student && (
                        <Card className="glass-card border-none">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl font-bold">About the Student</CardTitle>
                                    {(request.student.isVerified) && <VerifiedBadge />}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-full bg-foreground/5 overflow-hidden">
                                        {request.student.image ? (
                                            <img src={request.student.image} alt={request.student.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center bg-violet-500/10 text-violet-600 font-bold text-lg">
                                                {request.student.name?.[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">{request.student.name}</p>
                                        <p className="text-sm text-muted-foreground">{request.student.university || "University Student"}</p>
                                    </div>
                                </div>

                                {request.student.reputation > 0 && (
                                    <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-2 rounded-lg w-fit">
                                        <StarRating rating={request.student.reputation} />
                                        <span className="text-sm font-medium text-amber-700">{request.student.reputation.toFixed(1)}</span>
                                    </div>
                                )}

                                {acceptedByCurrentSeller ? (
                                    <MessageButton
                                        otherUserId={request.student._id}
                                        className="w-full rounded-full"
                                        variant="outline"
                                    >
                                        Message Student
                                    </MessageButton>
                                ) : (
                                    <Button
                                        className="w-full rounded-full opacity-50 cursor-not-allowed"
                                        variant="outline"
                                        disabled
                                        title="You can only message the student once your offer is accepted"
                                    >
                                        Message Student
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* About the Tutor (Visible to Student when assigned) */}
                    {isOwner && acceptedOffer && (
                        <Card className="glass-card border-none">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl font-bold">About your Tutor</CardTitle>
                                    {acceptedOffer.sellerIsVerified && <VerifiedBadge />}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-full bg-foreground/5 overflow-hidden flex items-center justify-center bg-teal-500/10 text-teal-600 font-bold text-lg">
                                        {acceptedOffer.tutorName?.[0] || "T"}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">{acceptedOffer.tutorName}</p>
                                        <p className="text-sm text-muted-foreground">Assigned Tutor</p>
                                    </div>
                                </div>

                                {acceptedOffer.tutorBio && (
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {acceptedOffer.tutorBio}
                                    </p>
                                )}

                                {acceptedOffer.tutorLevel && (
                                    <Badge variant="secondary" className="bg-teal-500/10 text-teal-700 border-none">
                                        {acceptedOffer.tutorLevel}
                                    </Badge>
                                )}

                                <MessageButton
                                    otherUserId={acceptedOffer.tutorId}
                                    className="w-full rounded-full"
                                >
                                    Message Tutor
                                </MessageButton>
                            </CardContent>
                        </Card>
                    )}

                    {isOwner && !acceptedOffer ? (
                        <>
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold">Offers</h2>
                                <span className="text-sm text-muted-foreground">
                                    {offers.length} received
                                </span>
                            </div>

                            {/* Sorting dropdown - show when more than 3 offers */}
                            {offers.length > 3 && (
                                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                                    <SelectTrigger className="w-full h-10 rounded-xl bg-foreground/5 border-none">
                                        <SelectValue placeholder="Sort by..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="best">Best Match</SelectItem>
                                        <SelectItem value="price">Lowest Price</SelectItem>
                                        <SelectItem value="rating">Highest Rated</SelectItem>
                                        <SelectItem value="newest">Newest First</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}

                            <div className="space-y-3">
                                {offers.length === 0 ? (
                                    <Card className="glass-card border-none">
                                        <CardContent className="py-8 text-center">
                                            <p className="text-muted-foreground">No offers yet. Hang tight!</p>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    sortedOffers.map((offer) => (
                                        <Card
                                            key={offer._id}
                                            className={`glass-card border-none transition-all ${offer.status === 'accepted' ? 'shadow-glow-teal' : ''
                                                }`}
                                        >
                                            <CardContent className="p-5">
                                                {/* Top row: Reputation, Online Status, Match % */}
                                                <div className="flex items-center gap-2 mb-3 flex-wrap">
                                                    {/* Reputation */}
                                                    {(offer.tutorReputation ?? 0) > 0 && (
                                                        <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-md">
                                                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                                            <span className="text-sm font-medium text-amber-700">
                                                                {offer.tutorReputation?.toFixed(1)}
                                                            </span>
                                                            {(offer.completedJobs ?? 0) > 0 && (
                                                                <span className="text-xs text-amber-600/70">
                                                                    ({offer.completedJobs} jobs)
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Online indicator */}
                                                    {offer.isOnline ? (
                                                        <div className="flex items-center gap-1 text-xs text-emerald-600">
                                                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                                            Online
                                                        </div>
                                                    ) : offer.lastActiveAt && (Date.now() - offer.lastActiveAt) < 24 * 60 * 60 * 1000 ? (
                                                        <div className="flex items-center gap-1 text-xs text-amber-600">
                                                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                                                            Active today
                                                        </div>
                                                    ) : null}

                                                    {/* Match percentage */}
                                                    {(offer.matchPercent ?? 0) > 0 && (
                                                        <Badge className={`${getMatchBadgeStyle(offer.matchPercent ?? 0)} border-none ml-auto`}>
                                                            {offer.matchPercent}% Match
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* Price and status */}
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

                                                {/* Tutor name and verified badge */}
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-base font-semibold text-foreground">
                                                            {offer.tutorName || `Tutor ${offer.tutorId?.toString().slice(0, 6)}...`}
                                                        </span>
                                                        {offer.sellerIsVerified && <VerifiedBadge />}
                                                    </div>
                                                    <ReportDialog targetId={offer.tutorId} requestId={ticketId} />
                                                </div>

                                                {/* Tutor Details */}
                                                <div className="space-y-3 mb-4">
                                                    {/* Level Badge */}
                                                    {offer.tutorLevel && (
                                                        <Badge variant="secondary" className="bg-violet-500/10 text-violet-700 hover:bg-violet-500/20 border-none transition-colors">
                                                            {offer.tutorLevel} in this course
                                                        </Badge>
                                                    )}

                                                    {/* Bio */}
                                                    {offer.tutorBio && (
                                                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                                            {offer.tutorBio}
                                                        </p>
                                                    )}

                                                    {/* Other Courses */}
                                                    {offer.tutorCourses && offer.tutorCourses.length > 0 && (
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <span className="font-medium text-foreground/80">Also teaches:</span>
                                                            <span className="truncate max-w-[200px]">
                                                                {offer.tutorCourses.join(", ")}
                                                            </span>
                                                        </div>
                                                    )}
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
                                                {offer.status === "accepted" && (request.status === "in_session" || request.status === "in_progress") && !isOwner && (
                                                    <MessageButton
                                                        otherUserId={offer.tutorId}
                                                        size="sm"
                                                        variant="outline"
                                                        className="w-full rounded-full h-10"
                                                    >
                                                        Message Tutor
                                                    </MessageButton>
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
                                    <Card className={`glass-card border-none ${offers.find(o => o.tutorId === currentUser?._id)?.status === 'accepted' ? 'shadow-glow-teal' : 'shadow-glow-teal'}`}>
                                        <CardHeader className="pb-4">
                                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                                <CheckCircle2 className="h-5 w-5 text-teal-600" />
                                                {offers.find(o => o.tutorId === currentUser?._id)?.status === 'accepted' ? 'Offer Accepted' : 'Offer Submitted'}
                                            </CardTitle>
                                            <CardDescription>
                                                {offers.find(o => o.tutorId === currentUser?._id)?.status === 'accepted'
                                                    ? "Congratulations! Your offer was accepted."
                                                    : "Your bid has been placed. Waiting for response."}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-2xl font-bold text-foreground">
                                                    PKR {offers.find(o => o.tutorId === currentUser?._id)?.price?.toLocaleString()}
                                                </span>
                                                <Badge
                                                    variant="secondary"
                                                    className={`border-none ${offers.find(o => o.tutorId === currentUser?._id)?.status === 'accepted'
                                                        ? 'bg-teal-500/15 text-teal-700'
                                                        : 'bg-foreground/5 text-muted-foreground'
                                                        }`}
                                                >
                                                    {offers.find(o => o.tutorId === currentUser?._id)?.status === 'accepted' ? 'Accepted' : 'Pending'}
                                                </Badge>
                                            </div>
                                            {offers.find(o => o.tutorId === currentUser?._id)?.status === 'accepted' && (
                                                <MessageButton
                                                    otherUserId={request.studentId}
                                                    className="w-full rounded-full h-11"
                                                >
                                                    Message Student
                                                </MessageButton>
                                            )}
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
                                            This request is currently <span className="font-medium text-foreground">{formatStatus(request.status)}</span>.
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
