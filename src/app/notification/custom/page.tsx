'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/yosense/sidebar/app-sidebar';
import SidebarContent from '@/components/yosense/sidebar/sidebar-content';
import { useAuthUser } from '@/hooks/yonsense/useAuthUser';
import { createInitial } from '@/lib/utils';
import { Bell, Eye, Send, Trash2, Upload, Users, X } from 'lucide-react';
import { ChangeEvent, useCallback, useState } from 'react';
import { toast } from 'sonner';

// TypeScript Interfaces
interface NotificationData {
    title: string;
    message: string;
    image: File | null;
    actionUrl: string;
    priority: 'low' | 'normal' | 'high';
}

interface UserProfile {
    id: string;
    userId: string;
    displayName?: string | undefined;
    email: string;
    status?: 'online' | 'offline' | 'away';
    lastSeen?: string;
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

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const PushNotificationManager: React.FC = () => {
    const { allProfiles } = useAuthUser();

    const [notification, setNotification] = useState<NotificationData>(INITIAL_NOTIFICATION_STATE);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Validation helpers
    const isFormValid = useCallback((): boolean => {
        return Boolean(notification.title.trim() && notification.message.trim());
    }, [notification.title, notification.message]);

    const convertImageToBase64 = useCallback((file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }, []);

    const validateImageFile = useCallback((file: File): string | null => {
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
            return 'Format gambar tidak didukung. Gunakan JPG, JPEG, PNG, atau WebP.';
        }
        if (file.size > MAX_FILE_SIZE) {
            return 'Ukuran gambar terlalu besar. Maksimal 2MB.';
        }
        return null;
    }, []);

    // Event handlers
    const handleInputChange = useCallback((field: keyof NotificationData) => {
        return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
            const value = event.target.value;
            setNotification((prev) => ({ ...prev, [field]: value }));
            setError(null);
        };
    }, []);

    const handleImageUpload = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file) return;

            const validationError = validateImageFile(file);
            if (validationError) {
                setError(validationError);
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setPreviewImage(result);
                setNotification((prev) => ({ ...prev, image: file }));
                setError(null);
            };
            reader.onerror = () => {
                setError('Gagal membaca file gambar.');
            };
            reader.readAsDataURL(file);
        },
        [validateImageFile],
    );

    const removeImage = useCallback(() => {
        setPreviewImage(null);
        setNotification((prev) => ({ ...prev, image: null }));
        const fileInput = document.getElementById('image-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
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
                let imageBase64 = '';

                // console.log('Image type:', notification.image, typeof notification.image);

                if (notification.image instanceof File) {
                    imageBase64 = await convertImageToBase64(notification.image);
                } else {
                    imageBase64 = ''; // atau pakai URL kalau sudah di-upload
                }
                // console.log('Image type:', imageBase64, typeof imageBase64);

                console.log(notification.actionUrl);

                const res = await fetch(`/api/push/blast`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: notification.title,
                        body: notification.message,
                        userIds,
                        actionUrl: notification.actionUrl,
                        priority: notification.priority,
                        image: 'https://instant-storage.s3.amazonaws.com/056cac02-cce0-412b-ae83-6643c0c1c6d1/8/a31f49c7-744a-465c-af61-c29dd5319651?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAYWCAC6QEI3OTBM73%2F20250912%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250912T000000Z&X-Amz-Expires=604800&X-Amz-Signature=6b5f17e93407a44d19922c25fac4fae7c8b50a089f6e71a0f1b74ab032e254ae&X-Amz-SignedHeaders=host&response-cache-control=public%2C%20max-age%3D86400%2C%20immutable',
                        // image: imageBase64,
                    }),
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to send');

                toast(`Berhasil mengirim notifikasi ke ${userIds.length} pengguna`);

                // Reset form after successful send
                setNotification(INITIAL_NOTIFICATION_STATE);
                setPreviewImage(null);
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
        [isFormValid],
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
                <h3 className="mb-3 font-medium text-gray-900">
                    Preview Notifikasi
                    {notification.image ? `(with image: ${convertImageToBase64(notification.image)})` : ''}
                </h3>
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                    <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
                                <Bell className="h-4 w-4 text-white" />
                            </div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900">
                                {notification.title.trim() || 'Judul Notifikasi'}
                            </p>
                            <p className="mt-1 text-sm text-gray-600">
                                {notification.message.trim() || 'Pesan notifikasi akan muncul di sini...'}
                            </p>
                            {previewImage && (
                                <img
                                    src={previewImage}
                                    alt="Preview notifikasi"
                                    className="mt-2 h-24 max-w-full rounded object-cover"
                                />
                            )}
                            {notification.actionUrl && (
                                <p className="mt-1 text-xs text-blue-600">🔗 {notification.actionUrl}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        ),
        [notification, previewImage],
    );

    if (!allProfiles) {
        return (
            <SidebarProvider>
                <AppSidebar />
                <SidebarContent>
                    <div className="flex h-64 items-center justify-center">
                        <div className="text-center">
                            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                            <p className="mt-2 text-gray-600">Memuat data pengguna...</p>
                        </div>
                    </div>
                </SidebarContent>
            </SidebarProvider>
        );
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarContent>
                <div className="min-h-screen space-y-8 bg-gray-50">
                    {/* Header */}
                    <div className="space-y-2 text-center">
                        <div className="flex items-center justify-center space-x-3">
                            <div className="rounded-full bg-blue-100 p-3">
                                <Bell className="h-8 w-8 text-blue-600" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900">Push Notification Manager</h1>
                        </div>
                        <p className="text-gray-600">Buat dan kirim notifikasi custom ke pengguna Anda</p>
                    </div>

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
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Judul Notifikasi *
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
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
                                        maxLength={500}
                                        required
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        {notification.message.length}/500 karakter
                                    </p>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        URL Aksi (Opsional)
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
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
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Prioritas</label>
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

                            {/* Image Upload & Preview */}
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Gambar Notifikasi (Opsional)
                                    </label>
                                    <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-blue-400">
                                        {previewImage ? (
                                            <div className="relative">
                                                <img
                                                    src={previewImage}
                                                    alt="Preview gambar notifikasi"
                                                    className="mx-auto h-48 max-w-full rounded-lg object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={removeImage}
                                                    className="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white transition-colors hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
                                                    aria-label="Hapus gambar"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                                <div>
                                                    <p className="text-gray-600">Upload gambar untuk notifikasi</p>
                                                    <p className="text-sm text-gray-400">PNG, JPG, WebP hingga 2MB</p>
                                                </div>
                                                <input
                                                    id="image-upload"
                                                    type="file"
                                                    accept={ACCEPTED_IMAGE_TYPES.join(',')}
                                                    className="hidden"
                                                    onChange={handleImageUpload}
                                                />
                                                <label
                                                    htmlFor="image-upload"
                                                    className="inline-flex cursor-pointer items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                                                >
                                                    <Upload className="mr-2 h-4 w-4" />
                                                    Pilih Gambar
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Notification Preview */}
                                {renderNotificationPreview()}
                            </div>
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                        <div className="border-b border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <h2 className="flex items-center space-x-2 text-xl font-semibold text-gray-900">
                                    <Users className="h-5 w-5" />
                                    <span>Daftar Pengguna ({allProfiles.length})</span>
                                </h2>
                                <div className="flex items-center space-x-3">
                                    <span className="text-sm text-gray-600">
                                        {selectedUsers.length} dari {allProfiles.length} dipilih
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
                                                    selectedUsers.length === allProfiles.length &&
                                                    allProfiles.length > 0
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
                                    {allProfiles.map((user) => (
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
            </SidebarContent>
        </SidebarProvider>
    );
};

export default PushNotificationManager;
