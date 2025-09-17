import { SidebarProvider } from '@/components/ui/sidebar';
import AppContent from '@/components/yosense/sidebar/app-content';
import { AppSidebar } from '@/components/yosense/sidebar/app-sidebar';
interface PageProps {}

export default function Page({}: PageProps) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <AppContent>
                <p>Hi, ini page</p>
            </AppContent>
        </SidebarProvider>
    );
}
