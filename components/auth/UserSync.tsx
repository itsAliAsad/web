"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { useConvexAuth } from "convex/react";

export default function UserSync() {
    const { user } = useUser();
    const { isAuthenticated } = useConvexAuth();
    const storeUser = useMutation(api.users.store);

    useEffect(() => {
        if (user && isAuthenticated) {
            storeUser();
        }
    }, [user, isAuthenticated, storeUser]);

    return null;
}
