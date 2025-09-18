'use client';

import { useEffect, useState } from 'react';

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const dismissedAt = localStorage.getItem('pwa_dismissed_at');
        if (dismissedAt) {
            const diff = Date.now() - parseInt(dismissedAt, 10);
            // Jangan tampilkan lagi selama 1 hari
            if (diff < 24 * 60 * 60 * 1000) return;
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Jika user berhasil install
        window.addEventListener('appinstalled', () => {
            console.log('PWA installed');
            setShowPrompt(false);
            setDeferredPrompt(null);
            localStorage.removeItem('pwa_dismissed_at');
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('User accepted install');
            setShowPrompt(false);
        } else {
            console.log('User dismissed install');
            localStorage.setItem('pwa_dismissed_at', Date.now().toString());
            setShowPrompt(false);
        }
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border bg-white p-4 shadow-lg">
            <span className="text-sm font-medium">Install aplikasi ini?</span>
            <button onClick={handleInstall} className="rounded bg-blue-600 px-3 py-1 text-sm text-white">
                Install
            </button>
            <button
                onClick={() => {
                    localStorage.setItem('pwa_dismissed_at', Date.now().toString());
                    setShowPrompt(false);
                }}
                className="rounded bg-gray-300 px-3 py-1 text-sm"
            >
                Nanti
            </button>
        </div>
    );
}
