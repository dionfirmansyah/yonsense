'use client';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppContent from '@/components/yosense/sidebar/app-content';
import { AppSidebar } from '@/components/yosense/sidebar/app-sidebar';
import { useAuthUser } from '@/hooks/yonsense/useAuthUser';
import { db } from '@/lib/db';
import { waitForServiceWorker } from '@/lib/serviceWorker';
import { ChangeEvent, useCallback, useState } from 'react';
import { toast } from 'sonner';
import UserTable from '../user-table';
import NotificationTemplateCard from './notification-template-card';
interface PageProps {}

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

export default function TemplatePage({}: PageProps) {
    const { allProfiles, user } = useAuthUser();

    const [notification, setNotification] = useState<NotificationData>(INITIAL_NOTIFICATION_STATE);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const { data } = db.useQuery({
        notificationTemplates: {},
    });
    const templates = data?.notificationTemplates;

    waitForServiceWorker(1000);

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

                console.log('ini notifikasi url', notification.actionUrl);

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

    const handleSelectTemplate = useCallback((template: any) => {
        setNotification({
            title: template.title,
            body: template.body,
            image: null, // Reset image, nanti bisa di-set manual
            actionUrl: template.actionUrl || '',
            priority: template.priority,
        });
        setSelectedImage(template.image || null);
        setSelectedTemplateId(template.id);
        setError(null);
    }, []);

    // Fungsi untuk reset template selection
    const handleResetTemplate = useCallback(() => {
        setNotification(INITIAL_NOTIFICATION_STATE);
        setSelectedImage(null);
        setSelectedTemplateId(null);
    }, []);
    return (
        <SidebarProvider>
            <AppSidebar />
            <AppContent>
                <div className="flex flex-col gap-4 rounded-lg border bg-gray-50 p-4">
                    {/* Choice Templates */}
                    <NotificationTemplateCard
                        templates={templates || []}
                        onSelectTemplate={handleSelectTemplate}
                        selectedTemplateId={selectedTemplateId || undefined}
                    />

                    {/* Users Table */}
                    <UserTable
                        selectedUsers={selectedUsers}
                        handleSelectUser={handleSelectUser}
                        handleSelectAll={handleSelectAll}
                        handleSendToSingle={handleSendToSingle}
                        handleSendToSelected={handleSendToSelected}
                        isFormValid={isFormValid()}
                    />
                </div>
            </AppContent>
        </SidebarProvider>
    );
}
