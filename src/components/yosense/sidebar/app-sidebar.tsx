'use client';

import * as React from 'react';

import {
    BadgeCheck,
    Bell,
    ChevronDown,
    CreditCard,
    Frame,
    Home,
    LogOut,
    Map,
    PieChart,
    Settings,
    Sparkles,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenuButton } from '@/components/ui/sidebar';
import { createInitial } from '@/lib/utils';
import AppLogo from './app-logo';

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@/components/ui/sidebar';
import { NavNotification } from '@/components/yosense/sidebar/nav-notification';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuthUser } from '@/hooks/yonsense/useAuthUser';
import { usePathname } from 'next/navigation';
import { useAuth } from '../auth/AuthProvider';

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
            url: 'notification',
            icon: Bell,
            isActive: true,
            items: [
                {
                    title: 'Your Notifications',
                    url: '/notification',
                },

                {
                    title: 'Send Notification',
                    url: '/notification/send',
                    isAdmin: true,
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
    const isMobile = useIsMobile();
    const { currentProfile, role } = useAuthUser();
    const { logout } = useAuth();
    const pathname = usePathname();

    const filteredMenuItems = React.useMemo(() => {
        const menuItems = [
            {
                title: 'Home',
                icon: Home,
                url: '/',
                isActive: pathname === '/',
            },
            {
                title: 'Notification',
                icon: Bell,
                isActive: pathname.includes('/notification'),
                items: [
                    {
                        title: 'Send Notification',
                        url: '/notification/send',
                        isAdmin: true,
                        isActive: pathname.match('/notification/send'),
                    },
                ],
            },
            {
                title: 'Settings',
                icon: Settings,
                url: '/settings',
                isActive: pathname.startsWith('/settings'),
            },
        ];

        return menuItems
            .map((item) => {
                if (!item.items) {
                    return item;
                }
                const filteredSubItems = item.items.filter(
                    (subItem) => !subItem.isAdmin || (subItem.isAdmin && role === 'admin'),
                );
                return { ...item, items: filteredSubItems };
            })
            .filter((item) => !item.items || item.items.length > 0);
    }, [pathname, role]);

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <AppLogo />
            </SidebarHeader>
            <SidebarContent>
                {/* <NavMain items={filteredMenuItems.filter((i) => !i.items)} /> */}
                <NavNotification items={filteredMenuItems.filter((i) => i.items)} />
            </SidebarContent>
            <SidebarFooter>
                {isMobile && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                                size="lg"
                                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                            >
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage src={currentProfile?.picture} alt={currentProfile?.displayName} />
                                    <AvatarFallback className="rounded-lg">
                                        {createInitial(currentProfile?.displayName)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">{currentProfile?.displayName}</span>
                                    <span className="truncate text-xs">{currentProfile?.email}</span>
                                </div>
                                <ChevronDown className="ml-auto size-4" />
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                            side={isMobile ? 'bottom' : 'right'}
                            align="end"
                            sideOffset={4}
                        >
                            <DropdownMenuLabel className="p-0 font-normal">
                                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarImage src={currentProfile?.picture} alt={currentProfile?.displayName} />
                                        <AvatarFallback className="rounded-lg">
                                            {createInitial(currentProfile?.displayName)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-medium">{currentProfile?.displayName}</span>
                                        <span className="truncate text-xs">{currentProfile?.email}</span>
                                    </div>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                <DropdownMenuItem>
                                    <Sparkles />
                                    Upgrade to Pro
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                <DropdownMenuItem>
                                    <BadgeCheck />
                                    Account
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <CreditCard />
                                    Billing
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Bell />
                                    Notifications
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={logout}>
                                <LogOut />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
