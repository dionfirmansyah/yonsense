'use client';

import { useAuthUser } from '@/hooks/yonsense/useAuthUser';
import { db } from '@/lib/db';

import { registerServiceWorker, waitForServiceWorker } from '@/lib/serviceWorker';
import { id } from '@instantdb/react';
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

type SwStatus = 'loading' | 'ready' | 'error' | 'missing';
type SubscriptionContextType = {
    isSubscribed: boolean | undefined;
    setIsSubscribed: (value: boolean) => void;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function usePushSubcriptions() {
    const [isSubscribed, setIsSubscribed] = useState<boolean | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [swStatus, setSwStatus] = useState<SwStatus>('loading');

    const router = useRouter();

    const { user, allProfiles } = useAuthUser();

    const { data: subscriptionRawData } = db.useQuery({
        subscriptions: {},
    });

    const subscriptions = subscriptionRawData?.subscriptions;

    const subscriptonUsers = () => {
        let data: any[] = [];
        allProfiles?.forEach((profile) => {
            data.push({
                name: profile.displayName,
                userId: profile.userId,
                pushSubscription: subscriptions?.find((s) => s.userId === profile.userId)?.pushSubscriptions,
            });
        });
        return data;
    };

    const notifyError = (error: any, fallbackMsg = 'Something went wrong') => {
        console.error(error);
        if (error.message?.includes('timeout')) toast.error('Request timed out. Please try again.');
        else if (error.name === 'NotAllowedError') toast.error('Notification permission denied');
        else if (error.name === 'NotSupportedError') toast.error('Push notifications not supported');
        else toast.error(fallbackMsg);
    };

    /** --- Check browser support --- */
    const checkPushSupport = useCallback(() => {
        const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
        setIsSupported(supported);
        return supported;
    }, []);

    /** --- Service worker init --- */
    const initializeServiceWorker = useCallback(async () => {
        if (!checkPushSupport()) return setSwStatus('error');

        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            if (registrations.length === 0) {
                const registration = await registerServiceWorker();
                if (!registration) return setSwStatus('error');
            }
            setSwStatus('ready');
            await waitForServiceWorker(8000);
        } catch (err) {
            console.error('Service Worker init error:', err);
            setSwStatus('error');
        }
    }, [checkPushSupport]);

    /** --- Check subscription --- */
    const checkSubscription = useCallback(async () => {
        if (swStatus !== 'ready') return;
        try {
            const registration = await waitForServiceWorker(5000);
            setIsSubscribed(!!(await registration.pushManager.getSubscription()));
        } catch (err) {
            console.warn('Error checking subscription:', err);
            setIsSubscribed(false);
        }
    }, [swStatus]);

    /** --- Notification permission --- */
    const requestNotificationPermission = async () => {
        if (Notification.permission === 'denied') {
            toast.error('Notifications are blocked. Enable them in browser settings.');
            return false;
        }
        if (Notification.permission === 'granted') return true;

        try {
            const permission = await Promise.race([
                Notification.requestPermission(),
                new Promise((resolve) => setTimeout(() => resolve('timeout'), 10000)),
            ]);

            if (permission === 'timeout') return (toast.error('Permission request timed out.'), false);
            if (permission !== 'granted') return (toast.error('Notification permission denied'), false);
            return true;
        } catch (err) {
            console.error('Permission error:', err);
            toast.error('Failed to request notification permission');
            return false;
        }
    };

    /** --- Subscribe logic --- */
    const getOrCreateSubscription = async (registration: ServiceWorkerRegistration, vapidKey: string) => {
        let sub = await registration.pushManager.getSubscription();
        if (sub) return sub;

        return Promise.race([
            registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: vapidKey,
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Subscription timeout')), 15000)),
        ]);
    };

    const saveSubscription = async (subscription: PushSubscription) => {
        const data = subscription.toJSON();
        if (!data.endpoint || !data.keys?.p256dh || !data.keys?.auth) {
            throw new Error('Invalid subscription data');
        }

        const {
            endpoint,
            keys: { p256dh, auth },
            expirationTime = null,
        } = data;
        const existing = subscriptions?.find((sub) => sub.endpoint === endpoint);

        if (existing) {
            await db.transact([
                db.tx.subscriptions[existing.id].update({
                    isActive: true,
                    updatedAt: new Date().toISOString(),
                }),
            ]);
            return existing.id;
        }

        await Promise.race([
            db.transact([
                db.tx.subscriptions[id()].update({
                    userId: user?.id,
                    endpoint,
                    pushSubscriptions: JSON.stringify(data),
                    isActive: true,
                    createdAt: new Date().toISOString(),
                }),
            ]),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Database save timeout')), 10000)),
        ]);

        return data;
    };

    const subscribeToPush = async () => {
        try {
            if (!(await requestNotificationPermission())) return;
            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!vapidKey) return toast.error('Push notification setup is incomplete');

            const registration = await waitForServiceWorker();
            const subscription = (await getOrCreateSubscription(registration, vapidKey)) as PushSubscription;

            return await saveSubscription(subscription);
        } catch (err: any) {
            notifyError(err, 'Failed to enable notifications. Please try again.');
            throw err;
        }
    };

    /** --- Unsubscribe logic --- */
    const unsubscribeFromPush = async () => {
        try {
            const registration = await waitForServiceWorker(5000);
            const sub = await registration.pushManager.getSubscription();
            const subscriptionId = subscriptions?.find((s) => s.endpoint === sub?.endpoint)?.id;

            if (subscriptionId) {
                await db.transact([
                    db.tx.subscriptions[subscriptionId].update({
                        isActive: false,
                        updatedAt: new Date().toISOString(),
                    }),
                ]);
            }
        } catch (err: any) {
            notifyError(err, 'Failed to disable notifications');
            throw err;
        }
    };

    const unsubscribe = async () => {
        try {
            if (process.env.NODE_ENV === 'development') {
                console.log('[unsubscribe] skipped in development mode');
                return;
            }

            const registration = await waitForServiceWorker(5000);
            const sub = await registration.pushManager.getSubscription();
            const subscriptionId = subscriptions?.find((s) => s.endpoint === sub?.endpoint)?.id;

            console.log('subscriptionId', subscriptionId);
            console.log('sub', sub);
            console.log('subs', subscriptions);

            if (subscriptionId) {
                await sub?.unsubscribe();
                await db.transact([db.tx.subscriptions[subscriptionId].delete()]);
            }
        } catch (err: any) {
            notifyError(err, 'Failed to disable notifications');
            throw err;
        }
    };

    /** --- Handler --- */
    const handleSubscription = async () => {
        if (!user) return toast.error('Please sign in to enable notifications');
        if (!isSupported) return toast.error('Push notifications are not supported in this browser');
        if (swStatus === 'error') return toast.error('Service Worker error. Please refresh the page.');
        if (swStatus === 'loading') return toast.error('Service Worker is still loading. Please wait.');
        if (isLoading) return;

        setIsLoading(true);
        try {
            if (isSubscribed) {
                // await unsubscribeFromPush();
                // setIsSubscribed(false);
                // toast.success('Notifications disabled');
                router.push('/notification');
            } else {
                await subscribeToPush();
                setIsSubscribed(true);
                toast.success('Notifications enabled');
            }
        } catch (err) {
            console.error('Error in handleSubscription:', err);
        } finally {
            setIsLoading(false);
        }
    };

    /** --- Effects --- */

    useEffect(() => {
        const saved = localStorage.getItem('isSubscribed');
        if (saved !== null) {
            setIsSubscribed(saved === 'true');
        } else {
            setIsSubscribed(false); // default kalau belum ada
        }
    }, []);

    useEffect(() => {
        if (isSubscribed !== undefined) {
            localStorage.setItem('isSubscribed', String(isSubscribed));
        }
    }, [isSubscribed]);

    useEffect(() => {
        setMounted(true);
        initializeServiceWorker();
    }, [initializeServiceWorker]);

    useEffect(() => {
        if (swStatus === 'ready') checkSubscription();
    }, [swStatus, checkSubscription]);

    return {
        subscriptions,
        subscriptonUsers,
        isSubscribed,
        isLoading,
        mounted,
        isSupported,
        swStatus,
        handleSubscription,
        unsubscribe,
    };
}
