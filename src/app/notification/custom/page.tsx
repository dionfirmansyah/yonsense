'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppContent from '@/components/yosense/sidebar/app-content';
import { AppSidebar } from '@/components/yosense/sidebar/app-sidebar';
import YonLogo from '@/components/yosense/yon-logo';
import { useAuthUser } from '@/hooks/yonsense/useAuthUser';
import { createInitial } from '@/lib/utils';
import { Bell, Eye, Send, Trash2, Users } from 'lucide-react';
import { ChangeEvent, useCallback, useState } from 'react';
import { toast } from 'sonner';
import UploadImageGallery from './upload-image-galery';

// TypeScript Interfaces
interface NotificationData {
    title: string;
    message: string;
    image: File | null;
    actionUrl: string;
    priority: 'low' | 'normal' | 'high';
}

type NotificationPriority = 'low' | 'normal' | 'high';

const PRIORITY_OPTIONS: { value: NotificationPriority; label: string }[] = [
    { value: 'low', label: 'Rendah' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'Tinggi' },
];

const INITIAL_NOTIFICATION_STATE: NotificationData = {
    title: '',
    message: '',
    image: null,
    actionUrl: '',
    priority: 'normal',
};

const PushNotificationManager: React.FC = () => {
    const { allProfiles, user } = useAuthUser();

    const [notification, setNotification] = useState<NotificationData>(INITIAL_NOTIFICATION_STATE);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Validation helpers
    const isFormValid = useCallback((): boolean => {
        return Boolean(notification.title.trim() && notification.message.trim());
    }, [notification.title, notification.message]);

    // Event handlers
    const handleInputChange = useCallback((field: keyof NotificationData) => {
        return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
            const value = event.target.value;
            setNotification((prev) => ({ ...prev, [field]: value }));
            setError(null);
        };
    }, []);

    const handleSelectUser = useCallback((userId: string) => {
        setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
    }, []);

    const handleSelectAll = useCallback(() => {
        if (!allProfiles) return;

        const allUserIds = allProfiles.map((user) => user.userId);
        setSelectedUsers(selectedUsers.length === allProfiles.length ? [] : allUserIds);
    }, [allProfiles, selectedUsers.length]);

    const handleSendNotification = useCallback(
        async (userIds: string[]) => {
            if (!isFormValid() || userIds.length === 0) return;

            setIsLoading(true);
            try {
                const res = await fetch(`/api/push/blast`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${user?.refresh_token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: notification.title,
                        body: notification.message,
                        userIds,
                        actionUrl: notification.actionUrl,
                        priority: notification.priority,
                        image: selectedImage,
                    }),
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to send');

                toast(`Berhasil mengirim notifikasi ke ${userIds.length} pengguna`);

                // Reset form after successful send
                setNotification(INITIAL_NOTIFICATION_STATE);
                setSelectedImage(null);
                setSelectedUsers([]);

                const fileInput = document.getElementById('image-upload') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
            } catch (err) {
                setError('Gagal mengirim notifikasi. Silakan coba lagi.');
                console.error('Send notification error:', err);
            } finally {
                setIsLoading(false);
            }
        },
        [isFormValid, selectedImage, notification],
    );

    const handleSendToSingle = useCallback(
        (userId: string) => {
            handleSendNotification([userId]);
        },
        [handleSendNotification],
    );

    const handleSendToSelected = useCallback(() => {
        handleSendNotification(selectedUsers);
    }, [handleSendNotification, selectedUsers]);

    // Render helpers

    const renderNotificationPreview = useCallback(
        () => (
            <div className="rounded-lg border bg-gray-50 p-4">
                <h3 className="mb-3 font-medium text-gray-900">Preview Notifikasi</h3>
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                    <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
                                <Bell className="h-4 w-4 text-white" />
                            </div>
                        </div>
                        <div className="flex w-full items-center justify-between">
                            <div className="flex flex-col items-start">
                                <p className="font-medium text-gray-900">
                                    {notification.title.trim() || 'Judul Notifikasi'}
                                </p>
                                <p className="mt-1 mb-2 text-sm text-gray-600">
                                    {notification.message.trim() || 'Pesan notifikasi akan muncul di sini...'}
                                </p>
                            </div>
                            <div className="flex items-center">
                                <YonLogo className="h-8 w-8" />
                            </div>
                        </div>
                    </div>
                    <div className="min-w-0 flex-1">
                        {selectedImage && (
                            <img
                                src={selectedImage}
                                alt="Push Notification Image"
                                className="h-[300px] w-full object-cover transition group-hover:opacity-80"
                            />
                        )}
                        {notification.actionUrl && (
                            <p className="mt-1 text-xs text-blue-600">🔗 {notification.actionUrl}</p>
                        )}
                    </div>
                </div>
            </div>
        ),
        [notification, selectedImage],
    );

    return (
        <SidebarProvider>
            <AppSidebar />
            <AppContent>
                <div className="min-h-screen space-y-8 bg-gray-50">
                    {/* Error Alert */}
                    {error && (
                        <Alert className="border-red-200 bg-red-50">
                            <AlertDescription className="text-red-800">{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Form Section */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
                        <h2 className="mb-6 flex items-center space-x-2 text-xl font-semibold text-gray-900">
                            <Bell className="h-5 w-5" />
                            <span>Buat Notifikasi Baru</span>
                        </h2>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {/* Form Fields */}
                            <form>
                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                            Judul Notifikasi *
                                        </label>
                                        <Input
                                            type="text"
                                            placeholder="Masukkan judul notifikasi..."
                                            value={notification.title}
                                            onChange={handleInputChange('title')}
                                            maxLength={100}
                                            required
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            {notification.title.length}/100 karakter
                                        </p>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">Pesan *</label>
                                        <textarea
                                            className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                            rows={4}
                                            placeholder="Masukkan pesan notifikasi..."
                                            value={notification.message}
                                            onChange={handleInputChange('message')}
                                            maxLength={200}
                                            required
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            {notification.message.length}/200 karakter
                                        </p>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                            URL Aksi (Opsional)
                                        </label>
                                        <Input
                                            type="text"
                                            placeholder="https://example.com"
                                            value={notification.actionUrl}
                                            onChange={handleInputChange('actionUrl')}
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            URL yang akan dibuka ketika notifikasi diklik
                                        </p>
                                        <p>{notification.actionUrl}</p>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                            Prioritas
                                        </label>
                                        <select
                                            className="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                            value={notification.priority}
                                            onChange={handleInputChange('priority')}
                                        >
                                            {PRIORITY_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </form>

                            {/* Image Upload & Preview */}
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Gambar Notifikasi (Opsional)
                                    </label>
                                    <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-blue-400">
                                        <UploadImageGallery
                                            onSelect={(url: string) => setSelectedImage(url)}
                                            userId={user?.id}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">{renderNotificationPreview()}</div>
                            </div>
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                        <div className="border-b border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <h2 className="flex items-center space-x-2 text-xl font-semibold text-gray-900">
                                    <Users className="h-5 w-5" />
                                    <span>Daftar Pengguna ({allProfiles?.length})</span>
                                </h2>
                                <div className="flex items-center space-x-3">
                                    <span className="text-sm text-gray-600">
                                        {selectedUsers.length} dari {allProfiles?.length} dipilih
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleSendToSelected}
                                        disabled={selectedUsers.length === 0 || !isFormValid() || isLoading}
                                        className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-400"
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                                Mengirim...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="mr-2 h-4 w-4" />
                                                Kirim ke Terpilih
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    selectedUsers.length === allProfiles?.length &&
                                                    allProfiles?.length > 0
                                                }
                                                onChange={handleSelectAll}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                aria-label="Pilih semua pengguna"
                                            />
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                                            Pengguna
                                        </th>
                                        <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {allProfiles?.map((user) => (
                                        <tr key={user.id} className="transition-colors hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.includes(user.userId)}
                                                    onChange={() => handleSelectUser(user.userId)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    aria-label={`Pilih ${user.displayName}`}
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                                                        <span className="text-sm font-medium text-blue-600">
                                                            {createInitial(user.displayName)}
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="truncate font-medium text-gray-900">
                                                            {user.displayName}
                                                        </div>
                                                        <div className="truncate text-sm text-gray-500">
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSendToSingle(user.userId)}
                                                        disabled={!isFormValid() || isLoading}
                                                        className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-100 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:text-gray-400"
                                                        title="Kirim notifikasi"
                                                        aria-label={`Kirim notifikasi ke ${user.displayName}`}
                                                    >
                                                        <Send className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="rounded-lg p-2 text-green-600 transition-colors hover:bg-green-100 focus:ring-2 focus:ring-green-500 focus:outline-none"
                                                        title="Lihat detail"
                                                        aria-label={`Lihat detail ${user.displayName}`}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-100 focus:ring-2 focus:ring-red-500 focus:outline-none"
                                                        title="Hapus pengguna"
                                                        aria-label={`Hapus ${user.displayName}`}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Status Alert */}
                    {selectedUsers.length > 0 && isFormValid() && (
                        <Alert className="border-blue-200 bg-blue-50">
                            <Bell className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-800">
                                {selectedUsers.length} pengguna siap menerima notifikasi &ldquo;{notification.title}
                                &rdquo;
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            </AppContent>
        </SidebarProvider>
    );
};

export default PushNotificationManager;
