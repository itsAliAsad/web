"use client";

import { useRole } from "@/context/RoleContext";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function RoleSwitcher() {
    const { role, toggleRole } = useRole();
    const router = useRouter();

    const handleToggle = async () => {
        const nextRole = role === "student" ? "tutor" : "student";
        await toggleRole();
        // Map to old dashboard URLs (can be updated later)
        router.push(nextRole === "student" ? "/dashboard/buyer" : "/dashboard/seller");
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleToggle}
            className="relative overflow-hidden group border-primary/20 hover:border-primary/50 transition-colors"
        >
            <motion.div
                key={role}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2"
            >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                <span className="font-medium">
                    Switch to {role === "student" ? "Tutor" : "Student"}
                </span>
            </motion.div>
        </Button>
    );
}
