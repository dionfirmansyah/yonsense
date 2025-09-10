import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/yosense/sidebar/app-sidebar';

import SidebarContent from '@/components/yosense/sidebar/sidebar-content';

export default function Page() {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarContent>Halo Halo</SidebarContent>
        </SidebarProvider>
    );
}
