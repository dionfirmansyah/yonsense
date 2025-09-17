'use client';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppContent from '@/components/yosense/sidebar/app-content';
import { AppSidebar } from '@/components/yosense/sidebar/app-sidebar';
import { useAuthUser } from '@/hooks/yonsense/useAuthUser';
interface PageProps {}

export default function Page({}: PageProps) {
    const { currentProfile } = useAuthUser();
    return (
        <SidebarProvider>
            <AppSidebar />
            <AppContent>
                <Card>
                    <CardHeader>
                        <CardTitle>Hai {currentProfile?.displayName}, Selamat Datang</CardTitle>
                    </CardHeader>
                </Card>
            </AppContent>
        </SidebarProvider>
    );
}
