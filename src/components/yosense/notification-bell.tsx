'use client';

import { usePushSubcriptions } from '@/hooks/yonsense/usePushSubcriptions';
import { AlertTriangle, Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';

export function NotificationBell() {
    const { isSubscribed, isLoading, mounted, isSupported, swStatus, handleSubscription } = usePushSubcriptions();

    if (!mounted || !isSupported) return null;

    if (swStatus === 'error') {
        return (
            <Button variant="ghost" size="icon" onClick={() => window.location.reload()}>
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="sr-only">Service Worker error - Click to refresh</span>
            </Button>
        );
    }

    const title =
        swStatus === 'loading'
            ? 'Setting up notifications...'
            : isSubscribed
              ? 'Disable notifications'
              : 'Enable notifications';

    const label = isLoading || swStatus === 'loading' ? 'Setting up notifications...' : title;

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleSubscription}
            disabled={isLoading || swStatus === 'loading'}
            aria-label={label}
            title={title}
        >
            {isLoading || swStatus === 'loading' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
            ) : isSubscribed ? (
                <Bell className="h-5 w-5 text-blue-500" />
            ) : (
                <BellOff className="h-5 w-5" />
            )}
            <span className="sr-only">{label}</span>
        </Button>
    );
}
