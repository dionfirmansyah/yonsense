// app/layout.tsx
'use client';

import { AuthProvider } from '@/components/auth/AuthProvider';
import { UserProfile } from '@/components/auth/UserProfile';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { Toaster } from '@/components/ui/sonner';

import './globals.css';

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" suppressHydrationWarning={true}>
            <body suppressHydrationWarning={true} className={'bg-background min-h-screen font-sans antialiased'}>
                <AuthProvider>
                    <div className="flex min-h-screen flex-col">
                        <header className="border-b">
                            <div className="container flex h-16 items-center justify-between px-4">
                                <h1 className="text-xl font-bold">Yonsense</h1>
                                <div className="flex items-center gap-4">
                                    <NotificationBell />
                                    <UserProfile />
                                </div>
                            </div>
                        </header>
                        <main className="flex-1">{children}</main>
                    </div>

                    <Toaster richColors position="top-center" />
                </AuthProvider>
            </body>
        </html>
    );
}
