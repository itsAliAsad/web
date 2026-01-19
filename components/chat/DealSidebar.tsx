"use client";

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PanelRight, DollarSign, Calendar, CheckCircle2, Clock, Mail } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import TicketHistorySection from "./TicketHistorySection";
import { Separator } from "@/components/ui/separator";
import { formatStatus } from "@/lib/utils";

interface DealSidebarProps {
    otherUserId: Id<"users">;
}

export default function DealSidebar({ otherUserId }: DealSidebarProps) {
    const deals = useQuery(api.offers.listBetweenUsers, { otherUserId });
    const unreadCount = useQuery(api.messages.getUnreadMessagesFromUser, { otherUserId });

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "accepted":
                return {
                    variant: "default" as const,
                    icon: CheckCircle2,
                    className: "bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-0"
                };
            case "pending":
                return {
                    variant: "secondary" as const,
                    icon: Clock,
                    className: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400"
                };
            default:
                return {
                    variant: "secondary" as const,
                    icon: Clock,
                    className: ""
                };
        }
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-muted/50 transition-all duration-200 hover:scale-105 gap-2"
                >
                    <PanelRight className="h-4 w-4" />
                    <span className="text-sm font-medium">View Deals</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[500px] sm:w-[540px] p-0">
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <SheetHeader className="px-6 pt-6 pb-4 border-b">
                        <SheetTitle className="text-xl font-semibold tracking-tight">
                            Deal Details
                        </SheetTitle>
                        <SheetDescription className="text-sm text-muted-foreground mt-1">
                            Active offers and ticket history with this user
                        </SheetDescription>
                    </SheetHeader>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-6">
                        {/* Unread Messages Indicator */}
                        {unreadCount !== undefined && unreadCount > 0 && (
                            <div className="mb-6">
                                <Card className="border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                                    <CardContent className="flex items-center gap-3 py-4">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
                                            <span className="text-white font-bold text-sm">{unreadCount}</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-foreground">
                                                {unreadCount === 1 ? '1 Unread Message' : `${unreadCount} Unread Messages`}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                You have new messages from this student
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Deals Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                Active Offers
                            </h3>

                            {deals === undefined ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-center space-y-2">
                                        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                                        <p className="text-sm text-muted-foreground">Loading deals...</p>
                                    </div>
                                </div>
                            ) : deals.length === 0 ? (
                                <Card className="border-dashed">
                                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                            <DollarSign className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm font-medium text-foreground mb-1">
                                            No active deals
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            No offers have been made between you yet
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-3">
                                    {deals.map((deal: any) => {
                                        const statusConfig = getStatusConfig(deal.status);
                                        const StatusIcon = statusConfig.icon;

                                        return (
                                            <Card
                                                key={deal._id}
                                                className="group hover:shadow-md transition-all duration-300 border-muted/50 hover:border-muted"
                                            >
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <CardTitle className="text-base font-semibold leading-tight flex-1 group-hover:text-primary transition-colors">
                                                            {deal.requestTitle || "Untitled Offer"}
                                                        </CardTitle>
                                                        <Badge
                                                            variant={statusConfig.variant}
                                                            className={`shrink-0 flex items-center gap-1 px-2.5 py-0.5 ${statusConfig.className}`}
                                                        >
                                                            <StatusIcon className="h-3 w-3" />
                                                            <span className="text-xs font-medium capitalize">
                                                                {formatStatus(deal.status)}
                                                            </span>
                                                        </Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-3">
                                                    {/* Price */}
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                                                            ${deal.price}
                                                        </span>
                                                        <span className="text-sm text-muted-foreground">USD</span>
                                                    </div>

                                                    {/* Description */}
                                                    {deal.requestDescription && (
                                                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                                            {deal.requestDescription}
                                                        </p>
                                                    )}

                                                    {/* Date */}
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        <span>
                                                            Offered {new Date(deal._creationTime).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Separator */}
                        <Separator className="my-6" />

                        {/* Ticket History Section */}
                        <TicketHistorySection tutorId={otherUserId} />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

