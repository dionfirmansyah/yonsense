import webpush, { PushSubscription } from 'web-push';
import { dbAdmin } from './db';

export async function sendNotificationToUser(
    userId: string,

    payload: string,
): Promise<{ success: boolean; error?: string }> {
    try {
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
