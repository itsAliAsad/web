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

export default function ReportsTable() {
    const reports = useQuery(api.admin.getReports);
    const resolveReport = useMutation(api.reports.resolve);

    const handleResolve = async (reportId: any, status: "resolved" | "dismissed") => {
        try {
            await resolveReport({ reportId, status });
            toast.success(`Report ${status}`);
        } catch (error) {
            toast.error("Failed to update report");
        }
    };

    if (!reports) return <div>Loading reports...</div>;

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Reason</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {reports.map((report) => (
                    <TableRow key={report._id}>
                        <TableCell>{report.reason}</TableCell>
                        <TableCell>{report.description}</TableCell>
                        <TableCell>
                            <Badge variant={report.status === "pending" ? "destructive" : "outline"}>
                                {report.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="space-x-2">
                            {report.status === "pending" && (
                                <>
                                    <Button size="sm" onClick={() => handleResolve(report._id, "resolved")}>
                                        Resolve
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => handleResolve(report._id, "dismissed")}>
                                        Dismiss
                                    </Button>
                                </>
                            )}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
