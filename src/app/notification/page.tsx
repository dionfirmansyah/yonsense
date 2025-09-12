'use client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useAuth } from '@/components/yosense/auth/AuthProvider';
import { AppSidebar } from '@/components/yosense/sidebar/app-sidebar';

import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import SidebarContent from '@/components/yosense/sidebar/sidebar-content';
import { useAuthUser } from '@/hooks/yonsense/useAuthUser';
import { usePushSubcriptions } from '@/hooks/yonsense/usePushSubcriptions';
import { toast } from 'sonner';
interface SubscriptionUser {
    name: string;
    userId: string;
    pushSubscription: string | undefined;
}

export default function Page() {
    const { currentProfile, user, isLoading } = useAuthUser();
    const { logout } = useAuth();

    const { subscriptonUsers } = usePushSubcriptions();

    const subscriptions = subscriptonUsers();

    if (isLoading) {
        return <div className="p-8">Loading...</div>;
    }

    async function sendToAllUsers() {
        try {
            const res = await fetch('/api/push/all-users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: `Test Notif dari ${currentProfile?.displayName || 'Admin'} 🎉`,
                    body: 'Halo, ini notifikasi dari Next.js + InstantDB!',
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to send');
            return data;
        } catch (error) {
            console.error('Failed to send to all users:', error);
            throw error;
        }
    }

    async function sendToUser(userId: string, userName: string) {
        try {
            const res = await fetch(`/api/push`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: `Test Notif untuk ${userName} 🎉`,
                    body: `Halo, ini notifikasi dari ${currentProfile?.displayName}`,
                    userId,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to send');
            return data;
        } catch (error) {
            console.error(`Failed to send to user ${userId}:`, error);
            throw error;
        }
    }
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarContent>
                {user ? (
                    <div className="space-y-6">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">Users with Push Subscriptions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[60px]">No</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {subscriptions?.length ? (
                                            subscriptions.map((sub: SubscriptionUser, index: number) => (
                                                <TableRow key={sub.userId}>
                                                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                                                    <TableCell className="font-medium">{sub.name}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={async () => {
                                                                try {
                                                                    await sendToUser(sub.userId, sub.name);
                                                                    toast.success(`Notification sent to ${sub.name}`);
                                                                } catch (error) {
                                                                    toast.error(`Failed to send to ${sub.name}`);
                                                                }
                                                            }}
                                                            disabled={!sub.pushSubscription}
                                                        >
                                                            Send Test
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={3}
                                                    className="text-muted-foreground py-6 text-center"
                                                >
                                                    No users found
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <div className="overflow-hidden rounded-lg bg-white shadow">
                            <div className="px-4 py-5 sm:p-6">
                                <h2 className="mb-4 text-lg font-medium text-gray-900">Send Test Notifications</h2>
                                <div className="flex space-x-4">
                                    <Button
                                        onClick={async () => {
                                            try {
                                                await sendToAllUsers();
                                                toast.success('Notification sent to all users');
                                            } catch (error) {
                                                toast.error('Failed to send notification');
                                            }
                                        }}
                                    >
                                        Send to All Users
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-12 text-center">
                        <h2 className="mb-4 text-2xl font-bold text-gray-900">Welcome to Push Notification Demo</h2>
                        <p className="mb-6 text-gray-600">Please login to manage push notifications</p>
                    </div>
                )}
            </SidebarContent>
        </SidebarProvider>
    );
}
