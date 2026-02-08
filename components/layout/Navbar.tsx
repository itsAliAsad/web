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

// Set this to true when you want to show the full navigation (after launch)
const IS_LAUNCHED = false;

export default function Navbar() {
    const { role } = useRole();
    const pathname = usePathname();
    const user = useQuery(api.users.currentUser);

    const isActive = (path: string) => pathname === path;
    
    // On landing page before launch, show minimal navbar
    const isLandingPage = pathname === "/";
    const showFullNav = IS_LAUNCHED || (!isLandingPage && user?.isAdmin);

    return (
        <nav className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="container flex h-16 items-center justify-between px-6">
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="text-xl font-bold">Peer</span>
                    </Link>

                    {/* Show full navigation only if launched or admin on internal pages */}
                    {showFullNav && (
                        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
                            {role === "student" ? (
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
                                    "transition-colors hover:text-foreground/80 flex items-center gap-1.5",
                                    isActive("/messages") ? "text-foreground" : "text-foreground/60"
                                )}
                            >
                                Messages
                                {(() => {
                                    const conversations = useQuery(
                                        api.messages.listConversations,
                                        user ? {} : "skip"
                                    );
                                    const unreadCount = conversations?.filter(c =>
                                        c.lastMessage &&
                                        !c.lastMessage.isRead &&
                                        c.lastMessage.senderId !== user?._id
                                    ).length ?? 0;

                                    return unreadCount > 0 ? (
                                        <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-[10px] font-bold rounded-full bg-amber-500 text-white">
                                            {unreadCount}
                                        </span>
                                    ) : null;
                                })()}
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
                            <Link
                                href="/settings"
                                className={cn(
                                    "transition-colors hover:text-foreground/80",
                                    isActive("/settings") ? "text-foreground" : "text-foreground/60"
                                )}
                            >
                                Settings
                            </Link>
                        </div>
                    )}
                    
                    {/* On landing page, only show Admin link for admins */}
                    {!showFullNav && user?.isAdmin && (
                        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
                            <Link
                                href="/admin"
                                className={cn(
                                    "transition-colors hover:text-foreground/80",
                                    isActive("/admin") ? "text-foreground" : "text-foreground/60"
                                )}
                            >
                                Admin Portal
                            </Link>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {/* Only show search and role switcher if launched or admin */}
                    {showFullNav && (
                        <>
                            <div className="hidden md:block">
                                <CommandSearch />
                            </div>
                            <RoleSwitcher />
                            {user && <NotificationDropdown />}
                        </>
                    )}
                    <UserButton afterSignOutUrl="/" />
                </div>
            </div>
        </nav>
    );
}

