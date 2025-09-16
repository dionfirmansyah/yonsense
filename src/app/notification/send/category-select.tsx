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
import { useState } from 'react';

interface CategorySelectProps {
    value: string;
    onChange: (value: string) => void;
}

export default function CategorySelect({ value, onChange }: CategorySelectProps) {
    const { data, isLoading, error } = db.useQuery({ notification_categories: {} });

    const categories = data?.notification_categories?.map((cat) => cat.name) || [];

    const [open, setOpen] = useState(false);
    const [newCategory, setNewCategory] = useState('');

    const handleAddCategory = () => {
        if (newCategory.trim() && !categories.includes(newCategory.trim())) {
            db.transact(db.tx.notification_categories[id()].create({ name: newCategory.trim() }));
            onChange(newCategory.trim());
        }
        setNewCategory('');
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
                    <SelectItem value={'custom'}>Custom</SelectItem>
                    {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                            {cat}
                        </SelectItem>
                    ))}
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <div className="cursor-pointer rounded px-2 py-1.5 text-sm text-blue-600 hover:bg-gray-100">
                                + Tambah Kategori Baru
                            </div>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Tambah Kategori</DialogTitle>
                                <DialogDescription>Masukkan nama kategori baru untuk notifikasi.</DialogDescription>
                            </DialogHeader>
                            <Input
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                placeholder="Nama kategori"
                            />
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
