import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/components/yosense/auth/AuthProvider';

import { ThemeProvider } from '@/components/yosense/themes-provider';
import './globals.css';

export const MetaData = {
    title: 'Yonsense',
    icons: {
        icon: '/favicon.ico',
        shortcut: '/favicon-16x16.png',
        apple: '/icons/apple-touch-icon.png',
        badge: 'badge-white.png',
    },
    manifest: '/manifest.json',
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
