"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

export default function UserManagement() {
    const users = useQuery(api.admin.listUsers);
    const currentUser = useQuery(api.users.currentUser);
    const banUser = useMutation(api.admin.banUser);
    const setVerification = useMutation(api.admin.setVerification);
    const setAdmin = useMutation(api.admin.setAdmin);

    const handleBan = async (userId: any, isBanned: boolean) => {
        try {
            await banUser({ userId, isBanned });
            toast.success(isBanned ? "User banned" : "User unbanned");
        } catch (error) {
            toast.error("Failed to update user status");
        }
    };

    const handleVerify = async (userId: any, isVerified: boolean) => {
        try {
            await setVerification({ userId, isVerified });
            toast.success(isVerified ? "User verified" : "Verification removed");
        } catch (error) {
            toast.error("Failed to update verification");
        }
    };

    const handleSetAdmin = async (userId: any, isAdmin: boolean) => {
        try {
            await setAdmin({ userId, isAdmin });
            toast.success(isAdmin ? "User promoted to admin" : "Admin privileges removed");
        } catch (error) {
            toast.error("Failed to update admin status");
        }
    };

    if (!users) return <div>Loading users...</div>;

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((user) => {
                    const isSelf = currentUser?._id === user._id;
                    return (
                        <TableRow key={user._id}>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.role || "Member"}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={!!user.isVerified}
                                        onCheckedChange={(checked) => handleVerify(user._id, checked)}
                                        disabled={!!user.isAdmin}
                                    />
                                    {user.isVerified ? (
                                        <Badge variant="outline">Verified</Badge>
                                    ) : (
                                        <Badge variant="secondary">Unverified</Badge>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={!!user.isAdmin}
                                        onCheckedChange={(checked) => handleSetAdmin(user._id, checked)}
                                        disabled={isSelf}
                                    />
                                    {isSelf && (
                                        <span className="text-xs text-muted-foreground">(you)</span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                {user.isBanned && <Badge variant="destructive">Banned</Badge>}
                                {user.isAdmin && <Badge variant="default">Admin</Badge>}
                            </TableCell>
                            <TableCell>
                                {!user.isAdmin && !isSelf && (
                                    <Button
                                        size="sm"
                                        variant={user.isBanned ? "outline" : "destructive"}
                                        onClick={() => handleBan(user._id, !user.isBanned)}
                                    >
                                        {user.isBanned ? "Unban" : "Ban"}
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}

