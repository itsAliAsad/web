import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, Clock, XCircle, ArrowRight } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { formatStatus } from "@/lib/utils";

interface BidCardProps {
    offer: {
        _id: Id<"offers">;
        price: number;
        status: "pending" | "accepted" | "rejected";
        _creationTime: number;
        requestTitle: string;
        requestStatus?: string;
        requestId: Id<"tickets">;
    };
}

export default function BidCard({ offer }: BidCardProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'accepted': return 'bg-teal-500/15 text-teal-700 border-none';
            case 'rejected': return 'bg-destructive/15 text-destructive border-none';
            default: return 'bg-amber-500/15 text-amber-700 border-none';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'accepted': return <CheckCircle2 className="h-3 w-3 mr-1" />;
            case 'rejected': return <XCircle className="h-3 w-3 mr-1" />;
            default: return <Clock className="h-3 w-3 mr-1" />;
        }
    };

    return (
        <Card className="hover:shadow-md transition-all border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg font-semibold line-clamp-1">
                            {offer.requestTitle}
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Sent {formatDistanceToNow(offer._creationTime)} ago
                        </CardDescription>
                    </div>
                    <Badge className={getStatusColor(offer.status)}>
                        {getStatusIcon(offer.status)}
                        {formatStatus(offer.status)}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center">
                    <div className="font-bold text-lg">
                        PKR {offer.price.toLocaleString()}
                    </div>
                    <Button variant="ghost" size="sm" className="gap-2" asChild>
                        <Link href={`/requests/${offer.requestId}`}>
                            View Request <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
