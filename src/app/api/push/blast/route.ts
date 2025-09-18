// src/app/api/push/route.ts - Route untuk multiple users
import { authenticateAndAuthorize } from '@/lib/auth';
import { dbAdmin } from '@/lib/db';
import { env } from '@/lib/env';
import { sendNotificationToUser } from '@/lib/push-notifications';
import { id } from '@instantdb/admin';
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

interface PushDataMultiple {
    title: string;
    body: string;
    userIds: string[];
    actionUrl?: string;
    senderId: string;
    priority?: 'low' | 'normal' | 'high';
    image?: string; // Base64 atau URL gambar
    tag?: string;
    category: string;
}

interface PushDataSingle {
    title: string;
    body: string;
    userId: string;
    actionUrl?: string;
    senderId: string;
    priority?: 'low' | 'normal' | 'high';
    image?: string;
    tag?: string;
    category: string;
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
            const {
                title,
                body: message,
                userIds,
                actionUrl,
                senderId,
                priority = 'normal',
                image,
                category,
                tag,
            } = body as PushDataMultiple;

            if (!title || !message || !userIds || userIds.length === 0) {
                return NextResponse.json({ error: 'Missing required fields: title, body, userIds' }, { status: 400 });
            }

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
            const results = await Promise.allSettled(
                userIds.map((userId) => {
                    sendNotificationToUser(userId, payload);
                }),
            );

            userIds.forEach(async (userId) => {
                await dbAdmin.transact([
                    dbAdmin.tx.notifications[id()].create({
                        title,
                        body: message,
                        receiverId: userId,
                        senderId,
                        image,
                        actionUrl,
                        priority,
                        createdAt: new Date(),
                        tag,
                        category,
                    }),
                ]);
            });
            // Hitung statistik
            const successful = results.filter((result) => result.status === 'fulfilled').length;
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
            const {
                title,
                body: message,
                userId,
                senderId,
                actionUrl,
                priority = 'normal',
                image,
                tag,
                category,
            } = body as PushDataSingle;

            console.log('Kategory', category);

            if (!title || !message || !userId) {
                return NextResponse.json({ error: 'Missing required fields: title, body, userId' }, { status: 400 });
            }

            const payload = JSON.stringify({
                title,
                body: message,
                icon: '/icons/icon-192x192.png',
                badge: '/badge.png',
                data: {
                    url: actionUrl || '/',
                    priority,
                    timestamp: Date.now(),
                },
                ...(image && { image }),
                ...(tag && { tag }),
            });

            const result = await sendNotificationToUser(userId, payload);
            await dbAdmin.transact([
                dbAdmin.tx.notifications[id()].create({
                    title,
                    body: message,
                    receiverId: userId,
                    senderId,
                    image,
                    actionUrl,
                    priority,
                    createdAt: new Date(),
                    tag,
                    category,
                }),
            ]);

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
