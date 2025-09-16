'use client';
import { Button } from '@/components/ui/button';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppContent from '@/components/yosense/sidebar/app-content';
import { AppSidebar } from '@/components/yosense/sidebar/app-sidebar';
import { useAuthUser } from '@/hooks/yonsense/useAuthUser';
import { db, Segment } from '@/lib/db';
import { Loader2, RefreshCw, Send, Target, Users } from 'lucide-react';
import { ChangeEvent, useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import UserTable from '../user-table';
import NotificationTemplateCard from './notification-template-card';
import UserSegmentManager from './user-segment-manager';

interface PageProps {}

interface NotificationData {
    title: string;
    body: string;
    image: File | null;
    actionUrl: string;
    priority: 'low' | 'normal' | 'high';
}

type NotificationPriority = 'low' | 'normal' | 'high';
type TargetMode = 'individual' | 'segment';

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

    // State management
    const [notification, setNotification] = useState<NotificationData>(INITIAL_NOTIFICATION_STATE);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [selectedSegments, setSelectedSegments] = useState<Segment[]>([]);
    const [targetMode, setTargetMode] = useState<TargetMode>('individual');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Database queries
    const { data: templateData } = db.useQuery({
        notificationTemplates: {},
    });

    const { data: segmentData } = db.useQuery({
        segment: {},
        segment_user: {},
    });

    // Processed data
    const templates = useMemo(() => {
        return (
            templateData?.notificationTemplates?.map((template) => ({
                ...template,
                createdAt: template.createdAt ? new Date(template.createdAt).toISOString() : undefined,
                updatedAt: template.updatedAt ? new Date(template.updatedAt).toISOString() : undefined,
            })) || []
        );
    }, [templateData]);

    const segments = useMemo(() => {
        return segmentData?.segment || [];
    }, [segmentData]);

    const segmentUsers = useMemo(() => {
        return segmentData?.segment_user || [];
    }, [segmentData]);

    // Calculate target users based on selected segments
    const targetUsersFromSegments = useMemo(() => {
        if (selectedSegments.length === 0) return [];

        const selectedSegmentIds = selectedSegments.map((s) => s.id);
        const userIds = segmentUsers.filter((su) => selectedSegmentIds.includes(su.segmentId)).map((su) => su.userId);

        // Remove duplicates
        return [...new Set(userIds)];
    }, [selectedSegments, segmentUsers]);

    // Get final target user list
    const finalTargetUsers = useMemo(() => {
        return targetMode === 'segment' ? targetUsersFromSegments : selectedUsers;
    }, [targetMode, targetUsersFromSegments, selectedUsers]);

    // Validation helpers
    const isFormValid = useCallback((): boolean => {
        return Boolean(notification.title.trim() && notification.body.trim());
    }, [notification.title, notification.body]);

    const canSendNotification = useMemo(() => {
        return isFormValid() && finalTargetUsers.length > 0 && !isLoading;
    }, [isFormValid, finalTargetUsers.length, isLoading]);

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
            if (!isFormValid() || userIds.length === 0) {
                toast.error('Form tidak valid atau tidak ada user yang dipilih');
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const res = await fetch(`/api/push/blast`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${user?.refresh_token}`,
                        'Content-Type': 'application/json',
                    },
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

                if (!res.ok) {
                    throw new Error(data.error || 'Failed to send notification');
                }

                toast.success(`Berhasil mengirim notifikasi ke ${userIds.length} pengguna`, {
                    description:
                        targetMode === 'segment'
                            ? `Melalui ${selectedSegments.length} segment`
                            : 'Pengiriman individual',
                });

                // Reset form after successful send
                handleResetForm();
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Gagal mengirim notifikasi';
                setError(errorMessage);
                toast.error(errorMessage);
                console.error('Send notification error:', err);
            } finally {
                setIsLoading(false);
            }
        },
        [isFormValid, notification, selectedImage, user?.refresh_token, targetMode, selectedSegments.length],
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
        handleSendNotification(finalTargetUsers);
    }, [handleSendNotification, finalTargetUsers]);

    const handleSelectTemplate = useCallback((template: any) => {
        setNotification({
            title: template.title,
            body: template.body,
            image: null,
            actionUrl: template.actionUrl || '',
            priority: template.priority,
        });
        setSelectedImage(template.image || null);
        setSelectedTemplateId(template.id);
        setError(null);
    }, []);

    const handleSelectSegment = useCallback((segment: Segment) => {
        setSelectedSegments((prev) => {
            const isAlreadySelected = prev.some((s) => s.id === segment.id);
            if (isAlreadySelected) {
                return prev.filter((s) => s.id !== segment.id);
            } else {
                return [...prev, segment];
            }
        });
    }, []);

    const handleResetForm = useCallback(() => {
        setNotification(INITIAL_NOTIFICATION_STATE);
        setSelectedImage(null);
        setSelectedTemplateId(null);
        setSelectedUsers([]);
        setSelectedSegments([]);
        setError(null);
    }, []);

    const handleTargetModeChange = useCallback((mode: TargetMode) => {
        setTargetMode(mode);
        // Reset selections when switching modes
        if (mode === 'segment') {
            setSelectedUsers([]);
        } else {
            setSelectedSegments([]);
        }
    }, []);

    return (
        <SidebarProvider>
            <AppSidebar />
            <AppContent>
                <div className="space-y-6 p-6">
                    {/* Page Header */}
                    <div className="border-b pb-4">
                        <h1 className="text-2xl font-bold text-gray-900">Kirim Notifikasi</h1>
                        <p className="mt-1 text-gray-600">
                            Pilih template dan target pengguna untuk mengirim notifikasi push
                        </p>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    {/* Template Selection */}
                    <div className="rounded-lg border bg-white p-6">
                        <NotificationTemplateCard
                            templates={templates}
                            onSelectTemplate={handleSelectTemplate}
                            selectedTemplateId={selectedTemplateId || undefined}
                        />
                    </div>

                    {/* Target Mode Selection */}
                    <div className="rounded-lg border bg-white p-6">
                        <div className="mb-4">
                            <h3 className="mb-3 font-medium text-gray-900">Pilih Mode Target</h3>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleTargetModeChange('individual')}
                                    className={`flex items-center gap-2 rounded-lg border px-4 py-2 transition-all ${
                                        targetMode === 'individual'
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                    }`}
                                >
                                    <Users className="h-4 w-4" />
                                    Individual Users
                                </button>
                                <button
                                    onClick={() => handleTargetModeChange('segment')}
                                    className={`flex items-center gap-2 rounded-lg border px-4 py-2 transition-all ${
                                        targetMode === 'segment'
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                    }`}
                                >
                                    <Target className="h-4 w-4" />
                                    User Segments
                                </button>
                            </div>
                        </div>

                        {/* Segment Selection */}
                        {targetMode === 'segment' && (
                            <UserSegmentManager
                                segments={segments}
                                segmentUsers={segmentUsers}
                                profiles={allProfiles ?? []}
                                onSelectSegment={handleSelectSegment}
                                selectedSegmentIds={selectedSegments.map((s) => s.id)}
                                multiSelect={true}
                            />
                        )}
                    </div>

                    {/* User Table - Only show in individual mode */}
                    {targetMode === 'individual' && (
                        <div className="rounded-lg border bg-white p-6">
                            <UserTable
                                selectedUsers={selectedUsers}
                                handleSelectUser={handleSelectUser}
                                handleSelectAll={handleSelectAll}
                                handleSendToSingle={handleSendToSingle}
                                handleSendToSelected={handleSendToSelected}
                                isFormValid={isFormValid()}
                            />
                        </div>
                    )}

                    {/* Action Bar */}
                    <div className="rounded-lg border bg-white p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="text-sm text-gray-600">
                                    <span className="font-medium">Target: </span>
                                    {targetMode === 'segment' ? (
                                        <>
                                            {selectedSegments.length} segment ({finalTargetUsers.length} users)
                                        </>
                                    ) : (
                                        <>{selectedUsers.length} individual users</>
                                    )}
                                </div>
                                {selectedTemplateId && <div className="text-sm text-green-600">✓ Template dipilih</div>}
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    onClick={handleResetForm}
                                    disabled={isLoading}
                                    className="flex items-center gap-2"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Reset
                                </Button>
                                <Button
                                    onClick={handleSendToSelected}
                                    disabled={!canSendNotification}
                                    className="flex items-center gap-2"
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                    Kirim Notifikasi
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </AppContent>
        </SidebarProvider>
    );
}
