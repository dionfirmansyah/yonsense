import type { NextConfig } from 'next';

const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
    swSrc: 'src/config/service-worker.js',
    mode: 'InjectManifest',
    buildExcludes: [/app-build-manifest\.json$/],
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
