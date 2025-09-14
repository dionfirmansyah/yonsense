import { Card } from '@/components/ui/card';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/yosense/sidebar/app-sidebar';

import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import SidebarContent from '@/components/yosense/sidebar/sidebar-content';
import UserTable from './user-table';

export default function Page() {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarContent>
                <div className="space-y-6">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Users with Push Subscriptions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <UserTable />
                        </CardContent>
                    </Card>
                </div>
            </SidebarContent>
        </SidebarProvider>
    );
}
