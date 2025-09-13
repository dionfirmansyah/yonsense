import type { NextConfig } from 'next';

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

export default nextConfig;
