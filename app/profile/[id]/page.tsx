"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import PortfolioSection from "@/components/portfolio/PortfolioSection";
import CoursesSection from "@/components/portfolio/CoursesSection";
import ExpertiseSection from "@/components/profile/ExpertiseSection";
import VerifiedBadge from "@/components/trust/VerifiedBadge";
import ReportDialog from "@/components/trust/ReportDialog";
import EditProfileDialog from "@/components/profile/EditProfileDialog";
import { Linkedin, Twitter, Globe } from "lucide-react";
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
                        {isOwner && (
                            <EditProfileDialog user={user} />
                        )}
                    </div>

                    <div className="mt-4 flex gap-4">
                        <Badge variant="info" className="text-sm px-3 py-1">
                            Reputation: {user.reputation}
                        </Badge>
                        <Badge variant="secondary" className="text-sm px-3 py-1 capitalize">
                            {user.role || "Member"}
                        </Badge>
                    </div>

                    <p className="mt-6 text-lg whitespace-pre-wrap">{user.bio || "No bio provided."}</p>

                    {/* Social Links */}
                    {user.links && (
                        <div className="flex gap-4 mt-6">
                            {user.links.linkedin && (
                                <a href={user.links.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                                    <Linkedin className="w-5 h-5" />
                                </a>
                            )}
                            {user.links.twitter && (
                                <a href={user.links.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                                    <Twitter className="w-5 h-5" />
                                </a>
                            )}
                            {user.links.portfolio && (
                                <a href={user.links.portfolio} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                                    <Globe className="w-5 h-5" />
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-12">
                {user.role === "tutor" && (
                    <ExpertiseSection userId={user._id} isOwner={isOwner} />
                )}
                <PortfolioSection userId={user._id} isOwner={isOwner} />
                <CoursesSection userId={user._id} isOwner={isOwner} />
            </div>
        </div>
    );
}
