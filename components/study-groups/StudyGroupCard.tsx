"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, LogOut, Crown } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

interface StudyGroupCardProps {
    group: {
        _id: Id<"study_groups">;
        title: string;
        maxMembers: number;
        currentMembers: number;
        hostId: Id<"users">;
        status: string;
    };
    courseCode?: string;
}

export function StudyGroupCard({ group, courseCode }: StudyGroupCardProps) {
    const joinGroup = useMutation(api.study_groups.join);
    const leaveGroup = useMutation(api.study_groups.leave);
    const user = useQuery(api.users.currentUser);

    const isHost = user?._id === group.hostId;
    const isFull = group.currentMembers >= group.maxMembers;

    const handleJoin = async () => {
        try {
            await joinGroup({ groupId: group._id });
            toast.success("Joined study group!");
        } catch (error: any) {
            toast.error(error.message || "Failed to join group");
        }
    };

    const handleLeave = async () => {
        try {
            await leaveGroup({ groupId: group._id });
            toast.success("Left study group");
        } catch (error: any) {
            toast.error(error.message || "Failed to leave group");
        }
    };

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-semibold">{group.title}</CardTitle>
                    <div className="flex gap-1">
                        {isHost && <Badge variant="default"><Crown className="h-3 w-3 mr-1" />Host</Badge>}
                        {courseCode && <Badge variant="secondary">{courseCode}</Badge>}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center text-muted-foreground text-sm">
                    <Users className="mr-2 h-4 w-4" />
                    <span>{group.currentMembers} / {group.maxMembers} members</span>
                </div>
            </CardContent>
            <CardFooter className="gap-2">
                {isHost ? (
                    <Button className="w-full" variant="secondary" disabled>
                        <Crown className="mr-2 h-4 w-4" />
                        You're the Host
                    </Button>
                ) : (
                    <>
                        <Button
                            className="flex-1"
                            onClick={handleJoin}
                            disabled={!user || isFull}
                        >
                            Join Group
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleLeave}
                            disabled={!user}
                            title="Leave group"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </>
                )}
            </CardFooter>
        </Card>
    );
}

