import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/yosense/sidebar/app-sidebar';
import SidebarContent from '@/components/yosense/sidebar/sidebar-content';
import YonLogo from '@/components/yosense/yon-logo';
interface PageProps {}

export default function Page({}: PageProps) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarContent>
                <YonLogo />
            </SidebarContent>
        </SidebarProvider>
    );
}
