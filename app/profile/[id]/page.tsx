"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PortfolioSection from "@/components/portfolio/PortfolioSection";
import CoursesSection from "@/components/portfolio/CoursesSection";
import VerifiedBadge from "@/components/trust/VerifiedBadge";
import ReportDialog from "@/components/trust/ReportDialog";
import { useParams } from "next/navigation";

export default function PublicProfilePage() {
    const params = useParams();
    const userIdParam = params.id as string;
    const isMe = userIdParam === "me";

    // If it's "me", we skip the get query. If it's an ID, we run it.
    const userProfile = useQuery(api.users.get, isMe ? "skip" : { id: userIdParam as Id<"users"> });

    // If it's "me", we run currentUser. If it's an ID, we skip currentUser (or run it anyway if we need it for isOwner check, but we already have it below)
    // Actually, we need currentUser for the isOwner check regardless of the profile being viewed.
    const currentUser = useQuery(api.users.currentUser);

    // If isMe is true, we use currentUser as the user to display.
    // However, currentUser might be null if not logged in.
    const user = isMe ? currentUser : userProfile;

    if (user === undefined) return <div className="p-10">Loading...</div>;
    if (user === null) return <div className="p-10">User not found</div>;

    const isOwner = currentUser?._id === user._id;

    return (
        <div className="container mx-auto py-10 max-w-4xl">
            <div className="flex flex-col md:flex-row gap-8 mb-10">
                <div className="flex-shrink-0">
                    <Avatar className="h-32 w-32">
                        <AvatarImage src={user.image} />
                        <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-2">
                                {user.name}
                                {user.isVerified && <VerifiedBadge />}
                            </h1>
                            <p className="text-muted-foreground text-lg">{user.university}</p>
                        </div>
                        {!isOwner && currentUser && (
                            <ReportDialog targetId={user._id} />
                        )}
                    </div>

                    <div className="mt-4 flex gap-4">
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            Reputation: {user.reputation}
                        </div>
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 capitalize">
                            {user.role || "Member"}
                        </div>
                    </div>

                    <p className="mt-6 text-lg whitespace-pre-wrap">{user.bio || "No bio provided."}</p>
                </div>
            </div>

            <div className="space-y-12">
                <PortfolioSection userId={user._id} isOwner={isOwner} />
                <CoursesSection userId={user._id} isOwner={isOwner} />
            </div>
        </div>
    );
}
