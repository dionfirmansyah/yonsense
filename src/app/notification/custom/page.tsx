'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppContent from '@/components/yosense/sidebar/app-content';
import { AppSidebar } from '@/components/yosense/sidebar/app-sidebar';
import YonLogo from '@/components/yosense/yon-logo';
import { useAuthUser } from '@/hooks/yonsense/useAuthUser';
import { db } from '@/lib/db';
import { id } from '@instantdb/react';
import { Bell, Loader2, Plus } from 'lucide-react';
import { ChangeEvent, useCallback, useState } from 'react';
import { toast } from 'sonner';
import UserTable from '../user-table';
import UploadImageGallery from './upload-image-galery';

// TypeScript Interfaces
interface NotificationData {
    title: string;
    body: string;
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
    body: '',
    image: null,
    actionUrl: '',
    priority: 'normal',
};

const customPushNotificationPage: React.FC = () => {
    const { allProfiles, user } = useAuthUser();

    const [notification, setNotification] = useState<NotificationData>(INITIAL_NOTIFICATION_STATE);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Validation helpers
    const isFormValid = useCallback((): boolean => {
        return Boolean(notification.title.trim() && notification.body.trim());
    }, [notification.title, notification.body]);

    // Event handlers
    const handleInputChange = useCallback((field: keyof NotificationData) => {
        return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
            const value = event.target.value;
            setNotification((prev) => ({ ...prev, [field]: value }));
            setError(null);
        };
    }, []);

    const handleSaveTemplates = useCallback(async () => {
        if (!isFormValid) return;

        setIsLoading(true);
        try {
            await db.transact(
                db.tx.notificationTemplates[id()].create({
                    title: notification.title,
                    body: notification.body,
                    priority: notification.priority,
                    actionUrl: notification.actionUrl,
                    image: selectedImage,
                }),
            );
            setNotification(INITIAL_NOTIFICATION_STATE);
            setSelectedImage(null);
            toast.success('Template notifikasi berhasil disimpan.');
        } catch (error) {
            toast.error('Gagal menyimpan template notifikasi. Silakan coba lagi.');
        } finally {
            setIsLoading(false);
        }
    }, [handleInputChange, selectedImage, notification]);

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
                        body: notification.body,
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
            } catch (err) {
                setError('Gagal mengirim notifikasi. Silakan coba lagi.');
                console.error('Send notification error:', err);
            } finally {
                setIsLoading(false);
            }
        },
        [isFormValid, handleInputChange, selectedImage, notification],
    );

    const handleSelectUser = useCallback((userId: string) => {
        setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
    }, []);

    const handleSelectAll = useCallback(() => {
        if (!allProfiles) return;

        const allUserIds = allProfiles.map((user) => user.userId);
        setSelectedUsers(selectedUsers.length === allProfiles.length ? [] : allUserIds);
    }, [allProfiles, selectedUsers.length]);

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
                                    {notification.body.trim() || 'Pesan notifikasi akan muncul di sini...'}
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
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="flex items-center space-x-2 text-xl font-semibold text-gray-900">
                                <Bell className="h-5 w-5" />
                                <span>Create Notification</span>
                            </h2>
                            {isFormValid() && (
                                <Button className="ml-2" size={'sm'} onClick={handleSaveTemplates} disabled={isLoading}>
                                    {isLoading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Plus className="mr-2 h-4 w-4" />
                                    )}
                                    Save as Template
                                </Button>
                            )}
                        </div>

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
                                            value={notification.body}
                                            onChange={handleInputChange('body')}
                                            maxLength={200}
                                            required
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            {notification.body.length}/200 karakter
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
                    <UserTable
                        selectedUsers={selectedUsers}
                        handleSelectUser={handleSelectUser}
                        handleSelectAll={handleSelectAll}
                        handleSendToSingle={handleSendToSingle}
                        handleSendToSelected={handleSendToSelected}
                        isFormValid={isFormValid()}
                    />

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

export default customPushNotificationPage;
