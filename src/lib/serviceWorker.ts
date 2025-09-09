export const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
        console.warn('Service Workers not supported');
        return null;
    }

    try {
        console.log('Registering Service Worker...');

        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none', // Always check for updates
        });

        console.log('Service Worker registered successfully:', registration);

        // Handle updates
        registration.addEventListener('updatefound', () => {
            console.log('Service Worker update found');
            const newWorker = registration.installing;

            if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('New Service Worker installed, refresh recommended');
                        // Optionally show user a message about update
                    }
                });
            }
        });

        // Check for waiting service worker
        if (registration.waiting) {
            console.log('Service Worker is waiting to activate');
        }

        // Check for updates periodically (every 30 minutes)
        setInterval(
            () => {
                registration.update();
            },
            30 * 60 * 1000,
        );

        return registration;
    } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
    }
};

export const unregisterServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
        return;
    }

    try {
        const registrations = await navigator.serviceWorker.getRegistrations();

        for (const registration of registrations) {
            await registration.unregister();
            console.log('Service Worker unregistered');
        }
    } catch (error) {
        console.error('Error unregistering service worker:', error);
    }
};

export const waitForServiceWorker = async (timeout = 10000): Promise<ServiceWorkerRegistration> => {
    if (!('serviceWorker' in navigator)) {
        throw new Error('Service Worker not supported');
    }

    return Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Service Worker timeout')), timeout)),
    ]);
};
