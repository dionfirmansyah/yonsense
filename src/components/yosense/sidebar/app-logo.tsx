'use client';

import { SidebarMenu, SidebarMenuButton, SidebarTrigger } from '@/components/ui/sidebar';
import YonLogo from '../yon-logo';

interface AppLogoProps {}

export default function AppLogo({}: AppLogoProps) {
    return (
        <SidebarMenu>
            <SidebarTrigger>
                <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground p-1"
                >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg transition-all duration-300 ease-in-out group-data-[state=collapsed]:scale-90 group-data-[state=collapsed]:-rotate-360 group-data-[state=expanded]:size-12 group-data-[state=expanded]:scale-110 group-data-[state=expanded]:rotate-0">
                        <YonLogo className="fill-primary mx-auto transition-all duration-300 ease-in-out" />
                    </div>

                    <div className="grid flex-1 text-left text-sm leading-tight transition-opacity duration-300 ease-in-out group-data-[state=collapsed]:hidden">
                        <span className="truncate font-medium">Yonsense</span>
                        <span className="truncate text-xs">Top PWA Starter</span>
                    </div>
                </SidebarMenuButton>
            </SidebarTrigger>
        </SidebarMenu>
    );
}
