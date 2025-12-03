"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Role = "buyer" | "seller";

interface RoleContextType {
    role: Role;
    setRole: (role: Role) => void;
    toggleRole: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
    const [role, setRoleState] = useState<Role>("buyer");

    useEffect(() => {
        const savedRole = localStorage.getItem("path_user_role") as Role;
        if (savedRole && (savedRole === "buyer" || savedRole === "seller")) {
            setRoleState(savedRole);
        }
    }, []);

    const setRole = (newRole: Role) => {
        setRoleState(newRole);
        localStorage.setItem("path_user_role", newRole);
    };

    const toggleRole = () => {
        const newRole = role === "buyer" ? "seller" : "buyer";
        setRole(newRole);
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
