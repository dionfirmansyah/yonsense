'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Props {
    receiverId: string;
}

import AppContent from '@/components/yosense/sidebar/app-content';
import { AppSidebar } from '@/components/yosense/sidebar/app-sidebar';
import { db } from '@/lib/db';
interface PageProps {}

export default function Page({}: PageProps) {
    const { user } = db.useAuth();

    const { data, isLoading, error } = db.useQuery({
        notifications: {
            $: {
                where: { receiverId: user?.id },
                order: {
                    serverCreatedAt: 'desc',
                },
            },
        },
    });

    if (isLoading) return <p className="text-muted-foreground text-center">Loading...</p>;
    if (error) return <p className="text-destructive text-center">Error: {String(error)}</p>;

    const notifications = data?.notifications || [];

    if (notifications.length === 0) {
        return (
            <Card className="p-6 text-center">
                <CardTitle>No Notifications</CardTitle>
                <p className="text-muted-foreground text-sm">You don’t have any notifications yet.</p>
            </Card>
        );
    }
    return (
        <SidebarProvider>
            <AppSidebar />
            <AppContent>
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle>Your Notifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]"></TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Message</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {notifications.map((n) => (
                                    <TableRow key={n.id}>
                                        <TableCell>
                                            {n.image ? (
                                                <Avatar>
                                                    <AvatarImage src={n.image} />
                                                    <AvatarFallback>N</AvatarFallback>
                                                </Avatar>
                                            ) : (
                                                <Avatar>
                                                    <AvatarFallback>N</AvatarFallback>
                                                </Avatar>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">{n.title}</TableCell>
                                        <TableCell className="max-w-[250px] truncate">{n.body}</TableCell>
                                        <TableCell>
                                            {n.readAt ? <Badge variant="secondary">Read</Badge> : <Badge>Unread</Badge>}
                                        </TableCell>
                                        <TableCell>
                                            {n.createdAt ? new Date(n.createdAt).toLocaleString() : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {n.actionUrl ? (
                                                <Button size="sm" variant="outline" asChild>
                                                    <a href={n.actionUrl} target="_blank" rel="noopener noreferrer">
                                                        Open
                                                    </a>
                                                </Button>
                                            ) : (
                                                <Button size="sm" variant="ghost" disabled>
                                                    No Action
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </AppContent>
        </SidebarProvider>
    );
}
