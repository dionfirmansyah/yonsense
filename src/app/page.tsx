'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { LoginButton } from '@/components/auth/LoginButton';
import { Button } from '@/components/ui/button';
import { useAuthUser } from '@/hooks/yonsense/useAuthUser';
import { usePushSubcriptions } from '@/hooks/yonsense/usePushSubcriptions';
import { toast } from 'sonner';

export default function Home() {
    const { currentProfile, user, isLoading, error } = useAuthUser();
    const { logout } = useAuth();

    const { subscriptonUsers } = usePushSubcriptions();

    const subcriptions = subscriptonUsers();

    if (isLoading) {
        return <div className="p-8">Loading...</div>;
    }

    async function sendToAllUsers() {
        const res = await fetch('/api/push/all-users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: `Test Notif dari ${currentProfile?.displayName} 🎉`,
                body: 'Halo, ini notifikasi dari Next.js + InstantDB!',
            }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to send');
        return data;
    }

    async function sendToUser(userId: string) {
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
    }

    return (
        <div className="min-h-screen p-8">
            <header className="mb-8 flex items-center justify-between">
                <h1 className="text-2xl font-bold">My App</h1>

                {user ? (
                    <Button variant={'destructive'} onClick={logout}>
                        LogOut
                    </Button>
                ) : (
                    <LoginButton />
                )}
            </header>

            <main>
                {user ? (
                    <div className="space-y-4">
                        <h2 className="text-xl">Dashboard</h2>
                        <p>Selamat datang, {currentProfile?.displayName}</p>

                        {isLoading ? (
                            <p>Loading user data...</p>
                        ) : currentProfile ? (
                            <div className="space-y-4 rounded bg-gray-100 p-4">
                                <h3 className="font-semibold">Data dari Database:</h3>

                                <div className="flex flex-col gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={async () => {
                                            try {
                                                await sendToAllUsers();
                                                toast.success('Notif berhasil dikirim 🚀');
                                            } catch (err) {
                                                toast.error('Gagal kirim notif');
                                                console.error(err);
                                            }
                                        }}
                                    >
                                        Test Notif Semua user
                                    </Button>

                                    <table>
                                        <thead>
                                            <tr>
                                                <th>No</th>
                                                <th>Nama</th>
                                                <th>Push Subscription</th>
                                                <th>Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-center">
                                            {subcriptions?.map((sub: any, index: number) => (
                                                <tr key={index}>
                                                    <td>{index + 1}</td>
                                                    <td>{sub.name}</td>
                                                    <td className="line-clamp-2 max-w-[200px] overflow-hidden text-ellipsis">
                                                        {sub.pushSubscription && 'Ada'}
                                                    </td>
                                                    <td>
                                                        <Button
                                                            variant="outline"
                                                            onClick={async () => {
                                                                try {
                                                                    await sendToUser(sub.userId);
                                                                    toast.success('Notif berhasil dikirim 🚀');
                                                                } catch (err) {
                                                                    toast.error('Gagal kirim notif');
                                                                    console.error(err);
                                                                }
                                                            }}
                                                        >
                                                            Test Notif
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <p>No user data found</p>
                        )}
                    </div>
                ) : (
                    <div className="text-center">
                        <h2 className="mb-4 text-xl">Silakan login untuk melanjutkan</h2>
                        <p className="text-gray-600">Klik tombol "Login dengan Google" di pojok kanan atas</p>
                    </div>
                )}
            </main>
        </div>
    );
}
