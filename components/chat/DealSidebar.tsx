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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PanelRight } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import TicketHistorySection from "./TicketHistorySection";
import { Separator } from "@/components/ui/separator";

interface DealSidebarProps {
    otherUserId: Id<"users">;
}

export default function DealSidebar({ otherUserId }: DealSidebarProps) {
    // We need a query to get deals between current user and otherUserId
    // For now, let's assume we have `api.offers.listBetweenUsers`
    // If not, we'll need to create it.
    const deals = useQuery(api.offers.listBetweenUsers, { otherUserId });

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                    <PanelRight className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle>Deal Details</SheetTitle>
                    <SheetDescription>
                        Active offers and requests with this user.
                    </SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-100px)] mt-4 pr-4">
                    {deals === undefined ? (
                        <div>Loading deals...</div>
                    ) : deals.length === 0 ? (
                        <div className="text-center text-muted-foreground py-10">
                            No active deals found.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {deals.map((deal: any) => (
                                <Card key={deal._id} className="glass-card">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base flex justify-between items-start">
                                            <span>{deal.requestTitle}</span>
                                            <Badge variant={deal.status === "accepted" ? "default" : "secondary"}>
                                                {deal.status}
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold mb-2">
                                            ${deal.price}
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            {deal.requestDescription}
                                        </p>
                                        <div className="text-xs text-muted-foreground">
                                            Offered on {new Date(deal._creationTime).toLocaleDateString()}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    <Separator className="my-6" />

                    {/* Ticket History Section */}
                    <TicketHistorySection tutorId={otherUserId} />
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}

