"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

type Role = "buyer" | "seller";

interface RoleContextType {
    role: Role;
    setRole: (role: Role) => Promise<void>;
    toggleRole: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
    const [role, setRoleState] = useState<Role>("buyer");
    const hydratedRef = useRef(false);
    const user = useQuery(api.users.currentUser);
    const setRoleMutation = useMutation(api.users.setRole);

    useEffect(() => {
        if (user === undefined || hydratedRef.current) return;
        if (!user) return;

        const savedRole = localStorage.getItem("path_user_role") as Role;
        const derivedRole = (user.role as Role) || savedRole || "buyer";

        setRoleState(derivedRole);
        localStorage.setItem("path_user_role", derivedRole);

        if (user.role !== derivedRole) {
            setRoleMutation({ role: derivedRole }).catch(() => {
                /* noop: fallback to local state */
            });
        }

        hydratedRef.current = true;
    }, [user, setRoleMutation]);

    const setRole = async (newRole: Role) => {
        setRoleState(newRole);
        localStorage.setItem("path_user_role", newRole);
        try {
            await setRoleMutation({ role: newRole });
        } catch (error) {
            console.error("Failed to persist role", error);
        }
    };

    const toggleRole = async () => {
        const newRole = role === "buyer" ? "seller" : "buyer";
        await setRole(newRole);
    };

    return (
        <RoleContext.Provider value={{ role, setRole, toggleRole }}>
            {children}
        </RoleContext.Provider>
    );
}

export function useRole() {
    const context = useContext(RoleContext);
    if (context === undefined) {
        throw new Error("useRole must be used within a RoleProvider");
    }
    return context;
}
