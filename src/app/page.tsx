'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
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

    async function sendToUser(userId: string) {
        try {
            const res = await fetch(`/api/push/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: `Test Notif untuk id: ${userId} 🎉`,
                    body: 'Halo, ini notifikasi dari Next.js + InstantDB!',
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
        <div className="min-h-screen bg-gray-100">
            <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
                {user ? (
                    <div className="space-y-6">
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

                        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
                            <div className="px-4 py-5 sm:px-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Users with Push Subscriptions
                                </h3>
                            </div>
                            <div className="border-t border-gray-200">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                No
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                Push Subscription
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {subscriptions?.map((sub: SubscriptionUser, index: number) => (
                                            <tr key={sub.userId}>
                                                <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                                                    {index + 1}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                                                    {sub.name}
                                                </td>
                                                <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                                                    {sub.pushSubscription ? '✅ Active' : '❌ Inactive'}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={async () => {
                                                            try {
                                                                await sendToUser(sub.userId);
                                                                toast.success(`Notification sent to ${sub.name}`);
                                                            } catch (error) {
                                                                toast.error(`Failed to send to ${sub.name}`);
                                                            }
                                                        }}
                                                        disabled={!sub.pushSubscription}
                                                    >
                                                        Send Test
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-12 text-center">
                        <h2 className="mb-4 text-2xl font-bold text-gray-900">Welcome to Push Notification Demo</h2>
                        <p className="mb-6 text-gray-600">Please login to manage push notifications</p>
                    </div>
                )}
            </main>
        </div>
    );
}
