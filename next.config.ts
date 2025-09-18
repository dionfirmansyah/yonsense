import type { NextConfig } from 'next';

const withPWA = require('next-pwa')({
    dest: 'public', // tempat generate service worker
    register: true, // auto register service worker
    skipWaiting: true, // langsung aktif service worker baru tanpa tunggu reload
    swSrc: './src/config/service-worker.js',
    disable: process.env.NODE_ENV === 'development', // matikan PWA saat dev
});

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'instant-storage.s3.amazonaws.com',
                pathname: '/**',
            },
        ],
    },
};

export default withPWA(nextConfig);
