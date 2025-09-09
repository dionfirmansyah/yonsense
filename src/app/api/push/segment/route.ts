import { dbAdmin } from '@/lib/db';
import { env } from '@/lib/env';
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

// Set VAPID details
webpush.setVapidDetails('mailto:admin@yourdomain.com', env.vapidPublicKey!, process.env.VAPID_PRIVATE_KEY!);

export async function POST(req: NextRequest) {
    try {
        const { title, body } = await req.json();

        const data = await dbAdmin.query({
            subscriptions: { $: { where: { isActive: true } } },
        });

        const subscription = data?.subscriptions;

        const payload = JSON.stringify({
            title: title,
            body: body,
            icon: '/icon-192x192.png',
            badge: '/badge.png',
            // optional
        });

        // Kirim ke semua subscription aktif
        await Promise.all(
            subscription.map(async (sub: any) => {
                try {
                    await webpush.sendNotification(JSON.parse(sub.pushSubscriptions), payload);
                } catch (err: any) {
                    console.error('Push error:', err?.body || err);
                    if (err.statusCode === 410 || err.statusCode === 404) {
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
