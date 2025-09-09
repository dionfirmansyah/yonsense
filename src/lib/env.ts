export const env = {
    instantDbAppId: process.env.NEXT_PUBLIC_INSTANT_APP_ID,
    googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT,
    vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
};

if (!env.instantDbAppId || !env.googleClientId || !env.vapidPublicKey) {
    throw new Error('Missing required environment variables');
}
