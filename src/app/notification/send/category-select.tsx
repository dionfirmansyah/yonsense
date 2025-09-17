'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db } from '@/lib/db';
import { id } from '@instantdb/react';
import { Bell, Home, Mail, Settings, Star, Wand2 } from 'lucide-react';
import { useState } from 'react';

interface CategorySelectProps {
    value: string;
    onChange: (value: string) => void;
}

const iconOptions = [
    { name: 'Custom', icon: Wand2 },
    { name: 'Home', icon: Home },
    { name: 'Bell', icon: Bell },
    { name: 'Mail', icon: Mail },
    { name: 'Star', icon: Star },
    { name: 'Settings', icon: Settings },
];

export default function CategorySelect({ value, onChange }: CategorySelectProps) {
    const { data } = db.useQuery({ notification_categories: {} });

    const categories =
        data?.notification_categories?.map((cat) => ({
            name: cat.name,
            icon: cat.icon,
        })) || [];

    const [open, setOpen] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [selectedIcon, setSelectedIcon] = useState(iconOptions[0].name);

    const handleAddCategory = () => {
        if (newCategory.trim() && !categories.some((c) => c.name === newCategory.trim())) {
            db.transact(
                db.tx.notification_categories[id()].create({
                    name: newCategory.trim(),
                    icon: selectedIcon,
                }),
            );
            onChange(newCategory.trim());
        }
        setNewCategory('');
        setSelectedIcon(iconOptions[0].name);
        setOpen(false);
    };

    return (
        <div className="space-y-4">
            <label className="text-sm font-medium text-gray-700">Kategori</label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={'custom'}>
                        <div className="flex items-center gap-2">
                            <Wand2 size={16} />
                            Custom
                        </div>
                    </SelectItem>
                    {categories.map((cat) => {
                        const IconComp = iconOptions.find((i) => i.name === cat.icon)?.icon || Star;
                        return (
                            <SelectItem key={cat.name} value={cat.name}>
                                <div className="flex items-center gap-2">
                                    <IconComp size={16} />
                                    {cat.name}
                                </div>
                            </SelectItem>
                        );
                    })}
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <div className="cursor-pointer rounded px-2 py-1.5 text-sm text-blue-600 hover:bg-gray-100">
                                + Tambah Kategori Baru
                            </div>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Tambah Kategori</DialogTitle>
                                <DialogDescription>
                                    Masukkan nama kategori baru untuk notifikasi dan pilih icon.
                                </DialogDescription>
                            </DialogHeader>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Nama Kategori</label>
                                <Input
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    placeholder="Nama kategori"
                                />
                            </div>

                            {/* Pilihan Icon */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Pilih Icon</label>
                                <div className="mt-4 grid grid-cols-6 gap-2">
                                    {iconOptions.map((opt) => {
                                        const IconComp = opt.icon;
                                        const isSelected = selectedIcon === opt.name;
                                        return (
                                            <Button
                                                key={opt.name}
                                                variant={'outline'}
                                                size={'icon'}
                                                onClick={() => setSelectedIcon(opt.name)}
                                                className={`flex cursor-pointer flex-col items-center rounded border p-4 ${
                                                    isSelected
                                                        ? 'border-primary border-2 bg-blue-50'
                                                        : 'border-gray-200'
                                                }`}
                                            >
                                                <IconComp size={20} />
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setOpen(false)}>
                                    Batal
                                </Button>
                                <Button onClick={handleAddCategory}>Simpan</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </SelectContent>
            </Select>
        </div>
    );
}
