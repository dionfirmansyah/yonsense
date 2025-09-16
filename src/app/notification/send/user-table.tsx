'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthUser } from '@/hooks/yonsense/useAuthUser';
import { createInitial } from '@/lib/utils';
import { useMemo, useState } from 'react';

import { Search, Send, Users } from 'lucide-react';

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
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* Header */}
            <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <Users className="h-5 w-5 text-blue-600" />
                    Daftar User
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {allProfiles?.length ?? 0}
                    </span>
                </h2>

                {/* Search */}
                <div className="relative w-full sm:w-64">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Cari user..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1); // reset ke halaman 1 saat search berubah
                        }}
                        className="border-border pl-9"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left text-gray-600">
                        <tr>
                            <th className="px-6 py-3">
                                <input
                                    type="checkbox"
                                    checked={
                                        selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0
                                    }
                                    onChange={handleSelectAll}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    aria-label="Pilih semua pengguna"
                                />
                            </th>
                            <th className="px-6 py-3 font-medium">Pengguna</th>
                            <th className="px-6 py-3 text-center font-medium">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
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
                                <td colSpan={3} className="px-6 py-10 text-center text-gray-500">
                                    Tidak ada user ditemukan.
                                </td>
                            </tr>
                        )}

                        {paginatedUsers.map((user) => (
                            <tr key={user.id} className="transition-colors hover:bg-blue-50/30">
                                <td className="px-6 py-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(user.userId)}
                                        onChange={() => handleSelectUser(user.userId)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        aria-label={`Pilih ${user.displayName}`}
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 rounded-full ring-2 ring-gray-100">
                                            <AvatarImage src={user.picture} alt={user.displayName} />
                                            <AvatarFallback className="rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                                                {createInitial(user.displayName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <div className="truncate font-medium text-gray-900">{user.displayName}</div>
                                            <div className="truncate text-xs text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button
                                        type="button"
                                        onClick={() => handleSendToSingle(user.userId)}
                                        disabled={isLoading || !isFormValid}
                                        className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-100 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:text-gray-400"
                                        title={`Kirim notifikasi ke ${user.displayName}`}
                                    >
                                        <Send className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {!isLoading && filteredUsers.length > pageSize && (
                <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 text-sm text-gray-600">
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
