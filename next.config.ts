import type { NextConfig } from 'next';

const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',

    // tambahkan ini
    swSrc: 'src/config/service-worker.js',
    mode: 'InjectManifest', // wajib kalau pakai custom sw
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
