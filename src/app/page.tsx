'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/components/yosense/auth/AuthProvider';
import { useAuthUser } from '@/hooks/yonsense/useAuthUser';
import { usePushSubcriptions } from '@/hooks/yonsense/usePushSubcriptions';
import { toast } from 'sonner';

interface SubscriptionUser {
    name: string;
    userId: string;
    pushSubscription: string | undefined;
}

export default function Home() {
    const { currentProfile, user, isLoading } = useAuthUser();
    const { logout } = useAuth();
    const { subscriptonUsers } = usePushSubcriptions();

    const subscriptions = subscriptonUsers();

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading...</div>;
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
            const res = await fetch(`/api/push/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: `Test Notif untuk ${userName} 🎉`,
                    body: `Halo, ini notifikasi dari ${currentProfile?.displayName}`,
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
        <div className="bg-muted/20 min-h-screen">
            <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
                {user ? (
                    <div className="space-y-8">
                        {/* Users Table */}
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

                        {/* Send to All Users */}
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">Send Test Notifications</CardTitle>
                            </CardHeader>
                            <CardContent>
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
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="py-20 text-center">
                        <h2 className="mb-3 text-2xl font-bold text-gray-900">Welcome to Push Notification Demo</h2>
                        <p className="text-gray-600">Please login to manage push notifications</p>
                    </div>
                )}
            </main>
        </div>
    );
}
