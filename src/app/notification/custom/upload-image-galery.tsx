'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/yosense/sidebar/app-sidebar';
import SidebarContent from '@/components/yosense/sidebar/sidebar-content';
import { useAuthUser } from '@/hooks/yonsense/useAuthUser';
import { Bell } from 'lucide-react';
import { ChangeEvent, useCallback, useState } from 'react';
import { toast } from 'sonner';

// ======================
// Types & Constants
// ======================
interface NotificationData {
    title: string;
    message: string;
    image: File | null;
    actionUrl: string;
    priority: NotificationPriority;
}

interface UserProfile {
    id: string;
    userId: string;
    displayName?: string;
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

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// ======================
// Component
// ======================
const PushNotificationManager: React.FC = () => {
    const { allProfiles } = useAuthUser();

    const [notification, setNotification] = useState<NotificationData>(INITIAL_NOTIFICATION_STATE);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // ======================
    // Helpers
    // ======================
    const isFormValid = useCallback(
        () => Boolean(notification.title.trim() && notification.message.trim()),
        [notification.title, notification.message],
    );

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

    // ======================
    // Handlers
    // ======================
    const handleInputChange = useCallback(
        (field: keyof NotificationData) =>
            (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
                setNotification((prev) => ({ ...prev, [field]: event.target.value }));
                setError(null);
            },
        [],
    );

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
            reader.onerror = () => setError('Gagal membaca file gambar.');
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

                if (notification.image instanceof File) {
                    imageBase64 = await convertImageToBase64(notification.image);
                }

                const res = await fetch(`/api/push/blast`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: notification.title,
                        body: notification.message,
                        userIds,
                        actionUrl: notification.actionUrl,
                        priority: notification.priority,
                        image: selectedImage ?? imageBase64,
                    }),
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to send');

                toast(`Berhasil mengirim notifikasi ke ${userIds.length} pengguna`);

                // Reset form
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
        [isFormValid, notification, selectedImage, convertImageToBase64],
    );

    const handleSendToSingle = useCallback(
        (userId: string) => handleSendNotification([userId]),
        [handleSendNotification],
    );
    const handleSendToSelected = useCallback(
        () => handleSendNotification(selectedUsers),
        [handleSendNotification, selectedUsers],
    );

    // ======================
    // Render Helpers
    // ======================
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

    // ======================
    // Loading State
    // ======================
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

    // ======================
    // Main Render
    // ======================
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarContent>{/* ... UI kamu di sini (form, tabel users, dsb) tetap sama */}</SidebarContent>
        </SidebarProvider>
    );
};

export default PushNotificationManager;
