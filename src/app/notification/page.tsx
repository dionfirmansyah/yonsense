'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

import AppContent from '@/components/yosense/sidebar/app-content';
import { AppSidebar } from '@/components/yosense/sidebar/app-sidebar';
import { db } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import { Bell, Home, Mail, MailOpen, Settings, Settings2, Star, Trash2, Wand2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

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

    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');

    const applyFilter = useCallback(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (selectedCategory) {
            params.set('filter', selectedCategory);
        } else {
            params.delete('filter');
        }
        if (dateFrom) params.set('from', dateFrom);
        else params.delete('from');
        if (dateTo) params.set('to', dateTo);
        else params.delete('to');

        router.push(`?${params.toString()}`);
    }, [searchParams, selectedCategory, dateFrom, dateTo]);

    const notificationFiltered = useMemo(() => {
        let items = data?.notifications || [];

        // filter kategori
        if (searchParams.get('filter') && searchParams.get('filter') !== 'all') {
            items = items.filter((n) => n.category === searchParams.get('filter'));
        }

        // filter tanggal
        const fromParam = searchParams.get('from');
        const toParam = searchParams.get('to');
        if (fromParam) {
            const fromDate = new Date(fromParam);
            items = items.filter((n) => n.createdAt && new Date(n.createdAt) >= fromDate);
        }
        if (toParam) {
            const toDate = new Date(toParam);
            items = items.filter((n) => n.createdAt && new Date(n.createdAt) <= toDate);
        }

        return items;
    }, [data?.notifications, searchParams]);

    const notificationCategories = useMemo(() => {
        return data?.notification_categories || [];
    }, [data?.notification_categories]);

    if (isLoading) return <p className="text-muted-foreground text-center">Loading...</p>;
    if (error) return <p className="text-destructive text-center">Error: {String(error)}</p>;

    const notifications = notificationFiltered;

    const handleMarkAsRead = useCallback((id: string) => {
        db.transact(
            db.tx.notifications[id].update({
                readAt: new Date(),
            }),
        );
    }, []);

    const handleDelete = useCallback((id: string) => {
        db.transact(db.tx.notifications[id].delete());
    }, []);

    return (
        <SidebarProvider>
            <AppSidebar />
            <AppContent>
                <div className="flex justify-between gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant={'outline'} size={'icon'} className="cursor-pointer">
                                <Settings2 size={16} />
                                <span className="sr-only">filter</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Filter Notifications</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                                {/* Select Kategori */}
                                <div>
                                    <label className="text-sm font-medium">Category</label>

                                    <div className="flex gap-1">
                                        <Button
                                            variant="outline"
                                            size={'sm'}
                                            className={`border-primary w-fit cursor-pointer rounded-full border border-2 text-xs ${
                                                searchParams.get('filter') === 'all' || !searchParams.get('filter')
                                                    ? 'bg-primary text-primary-foreground dark:bg-primary/60 dark:text-primary-foreground'
                                                    : 'text-primary'
                                            }`}
                                            onClick={() => {
                                                router.push('?filter=all');
                                                setSelectedCategory('all');
                                            }}
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
                                                onClick={() => {
                                                    router.push(`?filter=${cat.name}`);
                                                    setSelectedCategory(cat.name);
                                                }}
                                            >
                                                {cat.name}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Date range */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-sm font-medium">From</label>
                                        <input
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                            className="mt-1 w-full rounded-md border px-2 py-1 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">To</label>
                                        <input
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) => setDateTo(e.target.value)}
                                            className="mt-1 w-full rounded-md border px-2 py-1 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline">Cancel</Button>
                                <DialogClose asChild>
                                    <Button onClick={applyFilter}>Apply</Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Filter kategori via chip */}
                    <div className="flex gap-1">
                        <Button
                            variant="outline"
                            size={'sm'}
                            className={`border-primary w-fit cursor-pointer rounded-full border border-2 text-xs ${
                                searchParams.get('filter') === 'all' || !searchParams.get('filter')
                                    ? 'bg-primary text-primary-foreground dark:bg-primary/60 dark:text-primary-foreground'
                                    : 'text-primary'
                            }`}
                            onClick={() => router.push('?filter=all')}
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
                                onClick={() => router.push(`?filter=${cat.name}`)}
                            >
                                {cat.name}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                {notifications.length > 0 ? (
                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle>Your Notifications</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableBody>
                                    {notifications.map((n) => {
                                        const syncIcon = notificationCategories.find(
                                            (cat) => cat.name === n.category,
                                        )?.icon;
                                        const IconComp = iconOptions.find((i) => i.name === syncIcon)?.icon || Star;

                                        return (
                                            <TableRow
                                                key={n.id}
                                                onClick={() => toast('tunggu next update yh😁🙏')}
                                                // onClick={() => router.push(`/notification/${n.id}`)}
                                                className="group relative cursor-pointer"
                                            >
                                                <TableCell className="relative items-center">
                                                    <div className="border-primary w-fit rounded-md border-2 p-1">
                                                        <IconComp size={14} />
                                                        {!n.readAt && (
                                                            <span className="bg-destructive absolute top-2 left-7 h-2 w-2 rounded-full" />
                                                        )}
                                                    </div>
                                                </TableCell>

                                                <TableCell className="w-1/4 max-w-0 truncate font-medium">
                                                    {n.title}
                                                </TableCell>

                                                <TableCell className="w-1/2 max-w-0 truncate">{n.body}</TableCell>

                                                <TableCell className="relative text-right">
                                                    {/* Tanggal */}
                                                    <span className="text-muted-foreground text-sm transition-opacity md:group-hover:opacity-0">
                                                        {n.createdAt ? formatDate(new Date(n.createdAt)) : '-'}
                                                    </span>

                                                    {/* Tombol aksi mobile (selalu tampil) */}
                                                    <div className="absolute top-1/2 right-2 z-10 flex -translate-y-1/2 gap-1 md:hidden">
                                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                                            <MailOpen className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>

                                                    {/* Tombol aksi desktop (hanya saat hover) */}
                                                    <div className="absolute top-1/2 right-2 z-10 hidden -translate-y-1/2 gap-1 opacity-0 transition-opacity group-hover:opacity-100 md:flex">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={(e) => {
                                                                e.stopPropagation(); // 🔑 cegah klik row
                                                                handleDelete(n.id);
                                                            }}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>

                                                        {!n.readAt && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6"
                                                                onClick={(e) => {
                                                                    e.stopPropagation(); // 🔑 cegah klik row
                                                                    handleMarkAsRead(n.id);
                                                                }}
                                                            >
                                                                <MailOpen className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                    </div>
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
