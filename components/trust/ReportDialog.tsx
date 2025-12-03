"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Flag } from "lucide-react";

interface ReportDialogProps {
    targetId: Id<"users">;
    requestId?: Id<"requests">;
}

export default function ReportDialog({ targetId, requestId }: ReportDialogProps) {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [description, setDescription] = useState("");
    const createReport = useMutation(api.reports.create);

    const handleSubmit = async () => {
        if (!reason) {
            toast.error("Please select a reason");
            return;
        }

        try {
            await createReport({
                targetId,
                requestId,
                reason,
                description,
            });
            toast.success("Report submitted successfully");
            setOpen(false);
            setReason("");
            setDescription("");
        } catch (error) {
            toast.error("Failed to submit report");
            console.error(error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                    <Flag className="h-4 w-4 mr-2" />
                    Report
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Report User</DialogTitle>
                    <DialogDescription>
                        Please provide details about why you are reporting this user.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Reason</label>
                        <Select value={reason} onValueChange={setReason}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a reason" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="spam">Spam or Advertising</SelectItem>
                                <SelectItem value="harassment">Harassment or Abuse</SelectItem>
                                <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                                <SelectItem value="scam">Scam or Fraud</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description (Optional)</label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Provide more details..."
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="destructive">Submit Report</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
