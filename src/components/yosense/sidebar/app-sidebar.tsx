'use client';

import { Bell, Frame, Map, PieChart } from 'lucide-react';
import * as React from 'react';

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@/components/ui/sidebar';
import AppLogo from '@/components/yosense/sidebar/app-logo';
import { NavNotification } from '@/components/yosense/sidebar/nav-notification';
import { NavProjects } from '@/components/yosense/sidebar/nav-projects';

// This is sample data.
const data = {
    user: {
        name: 'shadcn',
        email: 'm@example.com',
        avatar: '/avatars/shadcn.jpg',
    },

    navNotification: [
        {
            title: 'Notifications',
            url: '#',
            icon: Bell,
            isActive: true,
            items: [
                {
                    title: 'Push to All User',
                    url: '#',
                },
                {
                    title: 'Segment',
                    url: '#',
                },
            ],
        },
    ],
    projects: [
        {
            name: 'Design Engineering',
            url: '#',
            icon: Frame,
        },
        {
            name: 'Sales & Marketing',
            url: '#',
            icon: PieChart,
        },
        {
            name: 'Travel',
            url: '#',
            icon: Map,
        },
    ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <AppLogo />
            </SidebarHeader>
            <SidebarContent>
                <NavNotification items={data.navNotification} />
                <NavProjects projects={data.projects} />
            </SidebarContent>
            <SidebarFooter></SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
