import { dbAdmin } from '@/lib/db';
import { env } from '@/lib/env';
import { NextRequest, NextResponse } from 'next/server';
import webpush, { PushSubscription } from 'web-push';

interface PushData {
    title: string;
    body: string;
}

// Set VAPID details
webpush.setVapidDetails('mailto:admin@yourdomain.com', env.vapidPublicKey!, process.env.VAPID_PRIVATE_KEY!);

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { title, body } = (await req.json()) as PushData;
        const userId = params.id;

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
            icon: '/icon-192x192.png',
            badge: '/badge.png',
        });

        // Send to all matching subscriptions
        await Promise.all(
            subscriptions.map(async (sub: any) => {
                try {
                    const pushSubscription: PushSubscription = JSON.parse(sub.pushSubscriptions);
                    await webpush.sendNotification(pushSubscription, payload);
                } catch (err) {
                    const error = err as { statusCode?: number; body?: unknown };
                    console.error('Push error:', error?.body || error);

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
