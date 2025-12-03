"use client";

import Link from "next/link";
import { useRole } from "@/context/RoleContext";
import RoleSwitcher from "./RoleSwitcher";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import NotificationDropdown from "@/components/notifications/NotificationDropdown";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

import { CommandSearch } from "@/components/search/CommandSearch";

export default function Navbar() {
    const { role } = useRole();
    const pathname = usePathname();
    const user = useQuery(api.users.currentUser);

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="glass-panel sticky top-0 z-50 border-b-0">
            <div className="container flex h-16 items-center justify-between px-6">
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="text-xl font-bold">Path</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-6 text-sm font-medium">
                        {role === "buyer" ? (
                            <>
                                <Link
                                    href="/dashboard/buyer"
                                    className={cn(
                                        "transition-colors hover:text-foreground/80",
                                        isActive("/dashboard/buyer") ? "text-foreground" : "text-foreground/60"
                                    )}
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    href="/requests/new"
                                    className={cn(
                                        "transition-colors hover:text-foreground/80",
                                        isActive("/requests/new") ? "text-foreground" : "text-foreground/60"
                                    )}
                                >
                                    Post Request
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/dashboard/seller"
                                    className={cn(
                                        "transition-colors hover:text-foreground/80",
                                        isActive("/dashboard/seller") ? "text-foreground" : "text-foreground/60"
                                    )}
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    href="/search"
                                    className={cn(
                                        "transition-colors hover:text-foreground/80",
                                        isActive("/search") ? "text-foreground" : "text-foreground/60"
                                    )}
                                >
                                    Find Jobs
                                </Link>
                            </>
                        )}
                        <Link
                            href="/messages"
                            className={cn(
                                "transition-colors hover:text-foreground/80",
                                "text-foreground/60"
                            )}
                        >
                            Messages
                        </Link>
                        {user?.isAdmin && (
                            <Link
                                href="/admin"
                                className={cn(
                                    "transition-colors hover:text-foreground/80",
                                    isActive("/admin") ? "text-foreground" : "text-foreground/60"
                                )}
                            >
                                Admin Portal
                            </Link>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:block">
                        <CommandSearch />
                    </div>
                    <RoleSwitcher />
                    <NotificationDropdown />
                    <UserButton afterSignOutUrl="/" />
                </div>
            </div>
        </nav>
    );
}
