// src/app/api/push/[id]/route.ts
import { authenticateAndAuthorize } from '@/lib/auth';
import { dbAdmin } from '@/lib/db';
import { env } from '@/lib/env';
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

interface PushData {
    title: string;
    body: string;
    userId: string;
}

// Set VAPID details (gunakan env.ts biar konsisten)
webpush.setVapidDetails('mailto:admin@yourdomain.com', env.vapidPublicKey!, process.env.VAPID_PRIVATE_KEY!);

export async function POST(req: NextRequest) {
    try {
        const authResult = await authenticateAndAuthorize(req);

        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { title, body, userId } = (await req.json()) as PushData;

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

        const payload = JSON.stringify({
            title,
            body,
        });

        await Promise.all(
            subscriptions.map(async (sub: any) => {
                try {
                    await webpush.sendNotification(JSON.parse(sub.pushSubscriptions), payload);
                } catch (err) {
                    const error = err as { statusCode?: number; body?: unknown };
                    console.error('Push error:', error?.body || error);

                    // hapus subscription yang invalid (404 / 410)
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        await dbAdmin.transact([dbAdmin.tx.subscriptions[sub.id].delete()]);
                    }
                }
            }),
        );

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('API error:', err);
        return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
    }
}
