"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function TermsModal() {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const user = useQuery(api.users.currentUser);
    const acceptTerms = useMutation(api.users.acceptTerms);

    useEffect(() => {
        if (user === undefined) return;
        if (!user || user.termsAcceptedAt) {
            setOpen(false);
        } else {
            setOpen(true);
        }
    }, [user]);

    const handleAccept = async () => {
        if (!user || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await acceptTerms({});
            setOpen(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && handleAccept()}>
            <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Terms of Service</DialogTitle>
                    <DialogDescription>
                        Please review and accept our terms to continue using Path.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[300px] overflow-y-auto text-sm space-y-4 p-1">
                    <p><strong>1. Acceptance of Terms</strong><br />By accessing and using Path, you accept and agree to be bound by the terms and provision of this agreement.</p>
                    <p><strong>2. User Conduct</strong><br />You agree to use the platform only for lawful purposes and in a way that does not infringe the rights of, restrict or inhibit anyone else's use and enjoyment of the platform.</p>
                    <p><strong>3. Trust & Safety</strong><br />We prioritize the safety of our community. Harassment, hate speech, and fraudulent activities are strictly prohibited and will result in account suspension.</p>
                    <p><strong>4. Disclaimer</strong><br />Path is a platform for connecting students. We are not responsible for the quality of services provided by other users.</p>
                </div>
                <DialogFooter>
                    <Button onClick={handleAccept} disabled={isSubmitting || !user}>
                        I Accept
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
