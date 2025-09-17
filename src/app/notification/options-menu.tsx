'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { EllipsisVertical } from 'lucide-react';

export function OptionsMenu() {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button className="cursor-pointer" variant="ghost" size="icon">
                    <EllipsisVertical size={16} />
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
                <SheetHeader>
                    <SheetTitle>Menu Actions</SheetTitle>
                    <SheetDescription>Pilih salah satu opsi di bawah.</SheetDescription>
                </SheetHeader>

                <div className="mt-4 flex flex-col gap-2">
                    <Button variant="outline">Edit</Button>
                    <Button variant="outline">Duplicate</Button>
                    <Button variant="destructive">Delete</Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
