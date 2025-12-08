"use client";

import AdminGuard from "@/components/admin/AdminGuard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReportsTable from "@/components/admin/ReportsTable";
import UserManagement from "@/components/admin/UserManagement";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

export default function AdminPage() {
    const stats = useQuery(api.admin.getStats);
    const createAnnouncement = useMutation(api.admin.createAnnouncement);
    const announcements = useQuery(api.admin.listAnnouncements);
    const setAnnouncementStatus = useMutation(api.admin.setAnnouncementStatus);
    const [announcementTitle, setAnnouncementTitle] = useState("");
    const [announcementContent, setAnnouncementContent] = useState("");

    const handleAnnouncement = async () => {
        try {
            await createAnnouncement({
                title: announcementTitle,
                content: announcementContent,
            });
            toast.success("Announcement created");
            setAnnouncementTitle("");
            setAnnouncementContent("");
        } catch (error) {
            toast.error("Failed to create announcement");
        }
    };

    const handleToggleAnnouncement = async (id: any, isActive: boolean) => {
        try {
            await setAnnouncementStatus({ id, isActive });
            toast.success(isActive ? "Announcement activated" : "Announcement deactivated");
        } catch (error) {
            toast.error("Failed to update announcement");
        }
    };

    return (
        <AdminGuard>
            <div className="container mx-auto py-10">
                <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

                {stats && (
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.usersCount}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.requestsCount}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.reportsCount}</div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <Tabs defaultValue="overview">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="users">Users</TabsTrigger>
                        <TabsTrigger value="reports">Reports</TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Create Announcement</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Input
                                    placeholder="Title"
                                    value={announcementTitle}
                                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                                />
                                <Textarea
                                    placeholder="Content"
                                    value={announcementContent}
                                    onChange={(e) => setAnnouncementContent(e.target.value)}
                                />
                                <Button onClick={handleAnnouncement}>Post Announcement</Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Manage Announcements</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {announcements?.length ? (
                                    announcements.map((announcement) => (
                                        <div
                                            key={announcement._id}
                                            className="flex items-start justify-between gap-4 border p-3 rounded-lg"
                                        >
                                            <div>
                                                <p className="font-semibold">{announcement.title}</p>
                                                <p className="text-sm text-muted-foreground">{announcement.content}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={announcement.isActive}
                                                    onCheckedChange={(checked) =>
                                                        handleToggleAnnouncement(announcement._id, checked)
                                                    }
                                                />
                                                <span className="text-sm text-muted-foreground">
                                                    {announcement.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">No announcements yet.</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="users">
                        <UserManagement />
                    </TabsContent>
                    <TabsContent value="reports">
                        <ReportsTable />
                    </TabsContent>
                </Tabs>
            </div>
        </AdminGuard>
    );
}
