// src/app/api/push/route.ts - Route untuk multiple users
import { authenticateAndAuthorize } from '@/lib/auth';
import { env } from '@/lib/env';
import { sendNotificationToUser } from '@/lib/push-notifications';
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

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

// POST untuk multiple users
export async function POST(req: NextRequest) {
    try {
        const authResult = await authenticateAndAuthorize(req);

        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const body = await req.json();

        const isMultiple = 'userIds' in body;

        if (isMultiple) {
            const { title, body: message, userIds, actionUrl, priority = 'normal', image } = body as PushDataMultiple;

            if (!title || !message || !userIds || userIds.length === 0) {
                return NextResponse.json({ error: 'Missing required fields: title, body, userIds' }, { status: 400 });
            }

            console.log('ini action url', actionUrl);

            // Buat payload notifikasi
            const payload = JSON.stringify({
                title,
                body: message,
                data: {
                    url: actionUrl,
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
