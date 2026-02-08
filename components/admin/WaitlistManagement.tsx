"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Download, Trash2, Users, TrendingUp, GraduationCap, Search, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function WaitlistManagement() {
    const entries = useQuery(api.waitlist.getWaitlistEntries, {});
    const stats = useQuery(api.waitlist.getWaitlistStats);
    const deleteEntry = useMutation(api.waitlist.deleteWaitlistEntry);

    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const handleDelete = async (id: Id<"waitlist">) => {
        if (!confirm("Are you sure you want to remove this entry?")) return;

        setIsDeleting(id);
        try {
            await deleteEntry({ id });
            toast.success("Entry removed");
        } catch (error) {
            console.error(error);
            toast.error("Failed to remove entry");
        } finally {
            setIsDeleting(null);
        }
    };

    const handleExportCSV = () => {
        if (!entries?.length) {
            toast.error("No entries to export");
            return;
        }

        const headers = ["Email", "Name", "University", "Role", "Referral Source", "Joined At"];
        const rows = entries.map((entry) => [
            entry.email,
            entry.name || "",
            entry.university || "",
            entry.role || "",
            entry.referralSource || "",
            new Date(entry.createdAt).toISOString(),
        ]);

        const csvContent = [headers, ...rows]
            .map((row) => row.map((cell) => `"${cell}"`).join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `waitlist-${new Date().toISOString().split("T")[0]}.csv`;
        link.click();

        toast.success("CSV exported successfully");
    };

    // Filter entries
    const filteredEntries = entries?.filter((entry) => {
        const matchesSearch =
            searchTerm === "" ||
            entry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.university?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole =
            roleFilter === "all" ||
            (roleFilter === "unspecified" && !entry.role) ||
            entry.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    if (!entries || !stats) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Total Signups
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Last 7 Days
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.recentSignups}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            📚 Students
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.byRole.student}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" />
                            Tutors
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.byRole.tutor}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Referral Sources */}
            {Object.keys(stats.byReferral).length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Referral Sources</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(stats.byReferral).map(([source, count]) => (
                                <Badge key={source} variant="secondary">
                                    {source}: {String(count)}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Entries Table */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <CardTitle>Waitlist Entries</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 w-[200px]"
                                />
                            </div>
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Filter by role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="student">Students</SelectItem>
                                    <SelectItem value="tutor">Tutors</SelectItem>
                                    <SelectItem value="unspecified">Unspecified</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" onClick={handleExportCSV}>
                                <Download className="w-4 h-4 mr-2" />
                                Export CSV
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>University</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Source</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEntries?.length ? (
                                    filteredEntries.map((entry) => (
                                        <TableRow key={entry._id}>
                                            <TableCell className="font-medium">{entry.email}</TableCell>
                                            <TableCell>{entry.name || "-"}</TableCell>
                                            <TableCell>{entry.university || "-"}</TableCell>
                                            <TableCell>
                                                {entry.role ? (
                                                    <Badge variant={entry.role === "student" ? "default" : "secondary"}>
                                                        {entry.role}
                                                    </Badge>
                                                ) : (
                                                    "-"
                                                )}
                                            </TableCell>
                                            <TableCell>{entry.referralSource || "-"}</TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {new Date(entry.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                    onClick={() => handleDelete(entry._id)}
                                                    disabled={isDeleting === entry._id}
                                                >
                                                    {isDeleting === entry._id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            No entries found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
