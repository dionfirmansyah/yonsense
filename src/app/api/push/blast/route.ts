// src/app/api/push/route.ts - Route untuk multiple users
import { dbAdmin } from '@/lib/db';
import { env } from '@/lib/env';
import { NextRequest, NextResponse } from 'next/server';
import webpush, { PushSubscription } from 'web-push';

interface PushDataMultiple {
    title: string;
    body: string;
    userIds: string[];
    actionUrl?: string;
    priority?: 'low' | 'normal' | 'high';
    image?: string; // Base64 atau URL gambar
}

interface PushDataSingle {
    title: string;
    body: string;
    userId: string;
    actionUrl?: string;
    priority?: 'low' | 'normal' | 'high';
    image?: string;
}

// Set VAPID details
webpush.setVapidDetails('mailto:admin@yourdomain.com', env.vapidPublicKey!, process.env.VAPID_PRIVATE_KEY!);

// Helper function untuk mengirim notifikasi ke user
async function sendNotificationToUser(userId: string, payload: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Ambil semua subscription aktif untuk user ini
        const data = await dbAdmin.query({
            subscriptions: {
                $: {
                    where: {
                        userId,
                        isActive: true,
                    },
                },
            },
        });

        const subscriptions = data?.subscriptions || [];

        if (subscriptions.length === 0) {
            return { success: false, error: 'No active subscriptions found' };
        }

        // Kirim notifikasi ke semua subscription user ini
        const results = await Promise.allSettled(
            subscriptions.map(async (sub: any) => {
                try {
                    const pushSubscription: PushSubscription =
                        typeof sub.pushSubscriptions === 'string'
                            ? JSON.parse(sub.pushSubscriptions)
                            : sub.pushSubscriptions;

                    await webpush.sendNotification(pushSubscription, payload);
                    return { success: true, subscriptionId: sub.id };
                } catch (err) {
                    const error = err as { statusCode?: number; body?: unknown };
                    console.error('Push error for subscription:', sub.id, error?.body || error);

                    // Hapus subscription yang invalid (404 / 410)
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        await dbAdmin.transact([dbAdmin.tx.subscriptions[sub.id].delete()]);
                    }

                    throw error;
                }
            }),
        );

        const successful = results.filter((result) => result.status === 'fulfilled').length;
        const failed = results.filter((result) => result.status === 'rejected').length;

        return {
            success: successful > 0,
            error: failed > 0 ? `${failed} subscriptions failed` : undefined,
        };
    } catch (err) {
        console.error('Error sending notification to user:', userId, err);
        return { success: false, error: 'Internal server error' };
    }
}

// POST untuk multiple users
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Check if it's multiple users or single user request
        const isMultiple = 'userIds' in body;

        if (isMultiple) {
            const { title, body: message, userIds, actionUrl, priority = 'normal', image } = body as PushDataMultiple;

            if (!title || !message || !userIds || userIds.length === 0) {
                return NextResponse.json({ error: 'Missing required fields: title, body, userIds' }, { status: 400 });
            }

            // Buat payload notifikasi
            const payload = JSON.stringify({
                title,
                body: message,
                icon: '/icon-192x192.png',
                badge: '/badge.png',
                data: {
                    url: actionUrl || '/',
                    priority,
                    timestamp: Date.now(),
                },
                ...(image && { image }),
            });

            // Kirim ke semua user secara parallel
            const results = await Promise.allSettled(userIds.map((userId) => sendNotificationToUser(userId, payload)));

            // Hitung statistik
            const successful = results.filter((result) => result.status === 'fulfilled' && result.value.success).length;
            const failed = results.length - successful;

            // Log untuk debugging
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    console.error(`Failed to send to user ${userIds[index]}:`, result.reason);
                }
            });

            return NextResponse.json({
                success: true,
                message: `Notification sent to ${successful} users${failed > 0 ? `, ${failed} failed` : ''}`,
                stats: {
                    total: userIds.length,
                    successful,
                    failed,
                },
            });
        } else {
            // Handle single user (backward compatibility)
            const { title, body: message, userId, actionUrl, priority = 'normal', image } = body as PushDataSingle;

            if (!title || !message || !userId) {
                return NextResponse.json({ error: 'Missing required fields: title, body, userId' }, { status: 400 });
            }

            const payload = JSON.stringify({
                title,
                body: message,
                icon: '/icon-192x192.png',
                badge: '/badge.png',
                data: {
                    url: actionUrl || '/',
                    priority,
                    timestamp: Date.now(),
                },
                ...(image && { image }),
            });

            const result = await sendNotificationToUser(userId, payload);

            if (result.success) {
                return NextResponse.json({
                    success: true,
                    message: 'Notification sent successfully',
                });
            } else {
                return NextResponse.json({ error: result.error || 'Failed to send notification' }, { status: 500 });
            }
        }
    } catch (err) {
        console.error('API error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET untuk testing/health check
export async function GET() {
    return NextResponse.json({
        message: 'Push notification API is running',
        vapidPublicKey: env.vapidPublicKey,
    });
}
