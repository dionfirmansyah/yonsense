'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import AppContent from '@/components/yosense/sidebar/app-content';
import { AppSidebar } from '@/components/yosense/sidebar/app-sidebar';
import { db } from '@/lib/db';
import { Bell, Home, Mail, Settings, Settings2, Star, Wand2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
interface PageProps {}

const iconOptions = [
    { name: 'Custom', icon: Wand2 },
    { name: 'Home', icon: Home },
    { name: 'Bell', icon: Bell },
    { name: 'Mail', icon: Mail },
    { name: 'Star', icon: Star },
    { name: 'Settings', icon: Settings },
];

export default function Page({}: PageProps) {
    const { user } = db.useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const { data, isLoading, error } = db.useQuery({
        notifications: {
            $: {
                where: { receiverId: user?.id },
                order: {
                    serverCreatedAt: 'desc',
                },
            },
        },
        notification_categories: {},
    });

    const setFilter = useCallback(
        (filter: string) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('filter', filter);
            router.push(`?${params.toString()}`);
        },
        [searchParams],
    );

    const notificationFiltered = useMemo(() => {
        if (!searchParams.get('filter') || searchParams.get('filter') === 'all') return data?.notifications || [];
        return data?.notifications?.filter((n) => n.category === searchParams.get('filter')) || [];
    }, [data?.notifications, searchParams]);

    const notificationCategories = useMemo(() => {
        return data?.notification_categories || [];
    }, [data?.notification_categories]);

    if (isLoading) return <p className="text-muted-foreground text-center">Loading...</p>;
    if (error) return <p className="text-destructive text-center">Error: {String(error)}</p>;

    const notifications = notificationFiltered;

    return (
        <SidebarProvider>
            <AppSidebar />
            <AppContent>
                <div className="flex justify-between gap-2">
                    <Button variant={'outline'} size={'icon'} className="cursor-pointer">
                        <Settings2 size={16} />
                        <span className="sr-only">filter</span>
                    </Button>
                    <div className="flex gap-1">
                        <Button
                            variant="outline"
                            size={'sm'}
                            className={`border-primary w-fit cursor-pointer rounded-full border border-2 text-xs ${
                                searchParams.get('filter') === 'all' || !searchParams.get('filter')
                                    ? 'bg-primary text-primary-foreground dark:bg-primary/60 dark:text-primary-foreground'
                                    : 'text-primary'
                            }`}
                            onClick={() => setFilter('all')}
                        >
                            All
                        </Button>
                        {notificationCategories.map((cat) => (
                            <Button
                                key={cat.id}
                                variant="outline"
                                size={'sm'}
                                className={`border-primary w-fit cursor-pointer rounded-full border border-2 text-xs ${
                                    searchParams.get('filter') === cat.name
                                        ? 'bg-primary text-primary-foreground dark:bg-primary/60 dark:text-primary-foreground'
                                        : 'text-primary'
                                }`}
                                onClick={() => setFilter(cat.name)}
                            >
                                {cat.name}
                            </Button>
                        ))}
                    </div>
                </div>
                {notifications.length > 0 ? (
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
                                        <TableHead>Kategori</TableHead>
                                        <TableHead>Message</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {notifications.map((n) => {
                                        const syncIcon = notificationCategories.find(
                                            (cat) => cat.name === n.category,
                                        )?.icon;
                                        const IconComp = iconOptions.find((i) => i.name === syncIcon)?.icon || Star;

                                        return (
                                            <TableRow key={n.id}>
                                                <TableCell>
                                                    <IconComp size={16} />
                                                </TableCell>
                                                <TableCell className="font-medium">{n.title}</TableCell>
                                                <TableCell className="max-w-[250px] truncate">{n.category}</TableCell>
                                                <TableCell className="max-w-[250px] truncate">{n.body}</TableCell>
                                                <TableCell>
                                                    {n.readAt ? (
                                                        <Badge variant="secondary">Read</Badge>
                                                    ) : (
                                                        <Badge>Unread</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {n.actionUrl ? (
                                                        <Button size="sm" variant="outline" asChild>
                                                            <a
                                                                href={n.actionUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
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
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="p-6 text-center">
                        <CardTitle>No Notifications</CardTitle>
                        <p className="text-muted-foreground text-sm">You don’t have any notifications yet.</p>
                    </Card>
                )}
            </AppContent>
        </SidebarProvider>
    );
}
