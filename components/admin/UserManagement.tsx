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

export default function UserManagement() {
    const users = useQuery(api.admin.listUsers);
    const banUser = useMutation(api.admin.banUser);

    const handleBan = async (userId: any, isBanned: boolean) => {
        try {
            await banUser({ userId, isBanned });
            toast.success(isBanned ? "User banned" : "User unbanned");
        } catch (error) {
            toast.error("Failed to update user status");
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
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((user) => (
                    <TableRow key={user._id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role || "Member"}</TableCell>
                        <TableCell>
                            {user.isBanned && <Badge variant="destructive">Banned</Badge>}
                            {user.isAdmin && <Badge variant="default">Admin</Badge>}
                        </TableCell>
                        <TableCell>
                            {!user.isAdmin && (
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
                ))}
            </TableBody>
        </Table>
    );
}
