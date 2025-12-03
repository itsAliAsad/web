import { CheckCircle2 } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export default function VerifiedBadge() {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <CheckCircle2 className="h-4 w-4 text-blue-500 inline-block ml-1" />
                </TooltipTrigger>
                <TooltipContent>
                    <p>Verified User</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
