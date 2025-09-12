// src/lib/push-notification.ts - Utility functions dan types
export interface PushNotificationPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    image?: string;
    data?: {
        url?: string;
        priority?: 'low' | 'normal' | 'high';
        timestamp?: number;
        [key: string]: any;
    };
}

export interface NotificationResponse {
    success: boolean;
    message: string;
    stats?: {
        total: number;
        successful: number;
        failed: number;
    };
}

export interface NotificationRequest {
    title: string;
    body: string;
    actionUrl?: string;
    priority?: 'low' | 'normal' | 'high';
    image?: string;
}

export interface SingleNotificationRequest extends NotificationRequest {
    userId: string;
}

export interface MultipleNotificationRequest extends NotificationRequest {
    userIds: string[];
}

// Utility function untuk validasi notification data
export function validateNotificationData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
        errors.push('Title is required and must be a non-empty string');
    }

    if (!data.body || typeof data.body !== 'string' || data.body.trim().length === 0) {
        errors.push('Body is required and must be a non-empty string');
    }

    if ('userId' in data && (!data.userId || typeof data.userId !== 'string')) {
        errors.push('userId is required and must be a string');
    }

    if ('userIds' in data) {
        if (!Array.isArray(data.userIds) || data.userIds.length === 0) {
            errors.push('userIds must be a non-empty array');
        } else if (!data.userIds.every((id: any) => typeof id === 'string')) {
            errors.push('All userIds must be strings');
        }
    }

    if (data.actionUrl && typeof data.actionUrl !== 'string') {
        errors.push('actionUrl must be a string if provided');
    }

    if (data.priority && !['low', 'normal', 'high'].includes(data.priority)) {
        errors.push('priority must be one of: low, normal, high');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

// Utility function untuk membuat payload notifikasi
export function createNotificationPayload(data: NotificationRequest): PushNotificationPayload {
    return {
        title: data.title,
        body: data.body,
        icon: '/icon-192x192.png',
        badge: '/badge.png',
        ...(data.image && { image: data.image }),
        data: {
            url: data.actionUrl || '/',
            priority: data.priority || 'normal',
            timestamp: Date.now(),
        },
    };
}

// Client-side API functions
export class PushNotificationAPI {
    private static baseURL = '/api/push';

    static async sendToSingleUser(userId: string, notification: NotificationRequest): Promise<NotificationResponse> {
        const response = await fetch(this.baseURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...notification,
                userId,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    }

    static async sendToMultipleUsers(
        userIds: string[],
        notification: NotificationRequest,
    ): Promise<NotificationResponse> {
        const response = await fetch(this.baseURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...notification,
                userIds,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    }

    static async sendToUsers(
        userIds: string | string[],
        notification: NotificationRequest,
    ): Promise<NotificationResponse> {
        if (typeof userIds === 'string') {
            return this.sendToSingleUser(userIds, notification);
        } else {
            return this.sendToMultipleUsers(userIds, notification);
        }
    }

    static async healthCheck(): Promise<{ message: string; vapidPublicKey: string }> {
        const response = await fetch(this.baseURL, {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`Health check failed: ${response.status}`);
        }

        return response.json();
    }
}

// React hook untuk menggunakan push notification API
import { useCallback, useState } from 'react';

interface UsePushNotificationReturn {
    sendNotification: (userIds: string | string[], notification: NotificationRequest) => Promise<void>;
    isLoading: boolean;
    error: string | null;
    success: string | null;
    clearMessages: () => void;
}

export function usePushNotification(): UsePushNotificationReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const sendNotification = useCallback(async (userIds: string | string[], notification: NotificationRequest) => {
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await PushNotificationAPI.sendToUsers(userIds, notification);

            const successMessage = result.stats
                ? `Berhasil mengirim ke ${result.stats.successful} dari ${result.stats.total} pengguna${result.stats.failed > 0 ? ` (${result.stats.failed} gagal)` : ''}`
                : result.message;

            setSuccess(successMessage);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Gagal mengirim notifikasi';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const clearMessages = useCallback(() => {
        setError(null);
        setSuccess(null);
    }, []);

    return {
        sendNotification,
        isLoading,
        error,
        success,
        clearMessages,
    };
}
