import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/components/yosense/auth/AuthProvider';

import { ThemeProvider } from '@/components/yosense/themes-provider';
import './globals.css';

import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Yonsense',
    description: 'Simple Next.js PWA',
    manifest: '/manifest.json',
    themeColor: '#000000',
    icons: {
        icon: '/favicon.ico',
        shortcut: '/favicon-16x16.png',
        apple: '/icons/apple-touch-icon.png',
    },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" suppressHydrationWarning={true}>
            <body className={'bg-background min-h-screen font-sans antialiased'}>
                <AuthProvider>
                    <ThemeProvider
                        attribute="class"
                        value={{
                            light: 'light',
                            dark: 'dark',
                            retro: 'retro',
                        }}
                        defaultTheme="light"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <main className="flex-1">{children}</main>
                        <Toaster richColors position="top-center" />
                    </ThemeProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
