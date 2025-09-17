'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthUser } from '@/hooks/yonsense/useAuthUser';
import { createInitial } from '@/lib/utils';
import { Search, Send, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

interface UserTableProps {
    selectedUsers: string[];
    handleSelectUser: (userId: string) => void;
    handleSelectAll: () => void;
    handleSendToSingle: (userId: string) => void;
    handleSendToSelected: () => void;
    isFormValid: boolean;
}

export default function UserTable({
    selectedUsers,
    handleSelectUser,
    handleSelectAll,
    handleSendToSingle,
    handleSendToSelected,
    isFormValid,
}: UserTableProps) {
    const { allProfiles, isLoading } = useAuthUser();

    // State untuk search dan pagination
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 5; // jumlah user per halaman

    // Filter user berdasarkan search
    const filteredUsers = useMemo(() => {
        if (!allProfiles) return [];
        return allProfiles.filter(
            (u) =>
                u?.displayName?.toLowerCase().includes(search.toLowerCase()) ||
                u?.email?.toLowerCase().includes(search.toLowerCase()),
        );
    }, [allProfiles, search]);

    // Hitung pagination
    const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
    const paginatedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className="border-border bg-background overflow-hidden rounded-xl border shadow-sm">
            {/* Header */}
            <div className="border-border flex flex-col gap-4 border-b px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-foreground flex items-center gap-2 text-lg font-semibold">
                    <Users className="h-5 w-5" />
                    Daftar User
                </h2>

                {/* Search */}
                <div className="relative w-full sm:w-64">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                        type="text"
                        placeholder="Cari user..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1); // reset ke halaman 1 saat search berubah
                        }}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="text-left">
                        <tr>
                            <th className="px-6 py-3">
                                <Checkbox
                                    checked={
                                        selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0
                                    }
                                    onCheckedChange={handleSelectAll}
                                    className="border-primary border"
                                    aria-label="Pilih semua pengguna"
                                />
                            </th>
                            <th className="text-foreground px-6 py-3 font-medium">Pengguna</th>
                            <th className="text-foreground px-6 py-3 text-center font-medium">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-border divide-y">
                        {isLoading &&
                            Array.from({ length: pageSize }).map((_, i) => (
                                <tr key={i}>
                                    <td className="px-6 py-4">
                                        <Skeleton className="h-4 w-4 rounded" />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-8 w-8 rounded-full" />
                                            <div className="flex flex-col gap-1">
                                                <Skeleton className="h-3 w-32 rounded" />
                                                <Skeleton className="h-3 w-20 rounded" />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <Skeleton className="mx-auto h-8 w-8 rounded" />
                                    </td>
                                </tr>
                            ))}

                        {!isLoading && paginatedUsers.length === 0 && (
                            <tr>
                                <td colSpan={3} className="text-muted-foreground px-6 py-10 text-center">
                                    Tidak ada user ditemukan.
                                </td>
                            </tr>
                        )}

                        {paginatedUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                                <td className="px-6 py-4">
                                    <Checkbox
                                        checked={selectedUsers.includes(user.userId)}
                                        onCheckedChange={() => handleSelectUser(user.userId)}
                                        className="border-primary border"
                                        aria-label={`Pilih ${user.displayName}`}
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="ring-border h-9 w-9 rounded-full ring-1">
                                            <AvatarImage src={user.picture} alt={user.displayName} />
                                            <AvatarFallback className="bg-muted text-foreground rounded-full text-xs font-medium">
                                                {createInitial(user.displayName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <div className="text-foreground truncate font-medium">
                                                {user.displayName}
                                            </div>
                                            <div className="text-muted-foreground truncate text-xs">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleSendToSingle(user.userId)}
                                        disabled={isLoading || !isFormValid}
                                        title={`Kirim notifikasi ke ${user.displayName}`}
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {!isLoading && filteredUsers.length > pageSize && (
                <div className="border-border text-muted-foreground flex items-center justify-between border-t px-6 py-4 text-sm">
                    <span>
                        Halaman {page} dari {totalPages}
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPage((p) => Math.max(p - 1, 1))}
                            disabled={page === 1}
                        >
                            Sebelumnya
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                            disabled={page === totalPages}
                        >
                            Selanjutnya
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
