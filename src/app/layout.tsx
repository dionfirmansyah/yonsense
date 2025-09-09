// app/layout.tsx
'use client';

import { AuthProvider } from '@/components/auth/AuthProvider';
import { Toaster } from '@/components/ui/sonner';

import './globals.css';

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
