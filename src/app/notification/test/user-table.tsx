'use client';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuthUser } from '@/hooks/yonsense/useAuthUser';
import { usePushSubcriptions } from '@/hooks/yonsense/usePushSubcriptions';
import { toast } from 'sonner';

interface UserTableProps {}
interface SubscriptionUser {
    name: string;
    userId: string;
    pushSubscription: string | undefined;
}

export default function UserTable({}: UserTableProps) {
    const { subscriptonUsers } = usePushSubcriptions();

    const subscriptions = subscriptonUsers();

    const { currentProfile, user, isLoading } = useAuthUser();

    async function sendToUser(userId: string, userName: string) {
        try {
            const res = await fetch(`/api/push`, {
                // const res = await fetch(`http://localhost:3001/api/push`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${user?.refresh_token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: `Test Notif untuk ${userName} 🎉`,
                    body: `Halo, ini notifikasi dari ${currentProfile?.displayName} `,
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
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[60px]">No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {!isLoading && subscriptions?.length > 0 ? (
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
                        <TableCell colSpan={3} className="text-muted-foreground py-6 text-center">
                            No users found
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}
