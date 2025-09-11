'use client';

import * as React from 'react';

import { SidebarInset } from '@/components/ui/sidebar';

import { BadgeCheck, Bell, ChevronDown, CreditCard, LogOut, Search, Settings, Sparkles } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { Separator } from '@/components/ui/separator';
import { SidebarMenuButton } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuthUser } from '@/hooks/yonsense/useAuthUser';
import { cn, createInitial } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '../auth/AuthProvider';
import { LoginButton } from '../auth/LoginButton';
import AppLogo from './app-logo';

export default function SidebarContent({ children, className }: React.ComponentProps<'div'>) {
    const isMobile = useIsMobile();
    const { logout } = useAuth();
    const { currentProfile, user } = useAuthUser();

    return (
        <SidebarInset>
            <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-2">
                    {!isMobile ? (
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
                                            <AvatarImage
                                                src={currentProfile?.picture}
                                                alt={currentProfile?.displayName}
                                            />
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
                    ) : (
                        <AppLogo />
                    )}
                    <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                </div>

                <div className="flex items-center gap-2 px-4">
                    <NotificationBell />
                    {!isMobile && (
                        <>
                            <div className="relative">
                                <Search className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />
                                <Input type="text" placeholder="Search..." className="pl-8" />
                            </div>
                            <Button className="items-center" onClick={() => toast.info('Coming Soon 😁')}>
                                Settings
                                <Settings />
                            </Button>
                        </>
                    )}
                    {!user && <LoginButton />}
                </div>
            </header>
            <div className={cn('flex flex-col gap-2 p-2', className)}>{children}</div>
        </SidebarInset>
    );
}
