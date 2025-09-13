// app/layout.tsx
'use client';

import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/components/yosense/auth/AuthProvider';

import './globals.css';

export const MetaData = {
    title: 'Yonsense',
    icons: {
        icon: '/favicon.ico',
        shortcut: '/favicon-16x16.png',
        apple: '/apple-touch-icon.png',
        badge: 'badge-white.png',
    },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" suppressHydrationWarning={true}>
            <body suppressHydrationWarning={true} className={'bg-background min-h-screen font-sans antialiased'}>
                <AuthProvider>
                    <div className="flex min-h-screen flex-col">
                        <main className="flex-1">{children}</main>
                    </div>
                    <Toaster richColors position="top-center" />
                </AuthProvider>
            </body>
        </html>
    );
}
