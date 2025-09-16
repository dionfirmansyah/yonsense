'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthUser } from '@/hooks/yonsense/useAuthUser';
import { createInitial } from '@/lib/utils';

import { Send, Users } from 'lucide-react';

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

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
            <div className="border-b border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <h2 className="flex items-center space-x-2 text-xl font-semibold text-gray-900">
                        <Users className="h-5 w-5" />
                        <span>Daftar Pengguna ({allProfiles?.length})</span>
                    </h2>
                    <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600">
                            {selectedUsers.length} dari {allProfiles?.length} dipilih
                        </span>
                        <button
                            type="button"
                            onClick={handleSendToSelected}
                            disabled={selectedUsers.length === 0 || !isFormValid || isLoading}
                            className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-400"
                        >
                            {isLoading ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                    Mengirim...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Kirim ke Terpilih
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left">
                                <input
                                    type="checkbox"
                                    checked={selectedUsers.length === allProfiles?.length && allProfiles?.length > 0}
                                    onChange={handleSelectAll}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    aria-label="Pilih semua pengguna"
                                />
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Pengguna</th>
                            <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {allProfiles?.map((user) => (
                            <tr key={user.id} className="transition-colors hover:bg-gray-50">
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
                                    <div className="flex items-center space-x-3">
                                        <Avatar className="h-8 w-8 rounded-full">
                                            <AvatarImage src={user.picture} alt={user.displayName} />
                                            <AvatarFallback className="rounded-full bg-gray-300 p-2 text-center text-xs">
                                                {createInitial(user.displayName)}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="min-w-0 flex-1">
                                            <div className="truncate font-medium text-gray-900">{user.displayName}</div>
                                            <div className="truncate text-sm text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => handleSendToSingle(user.userId)}
                                            disabled={isLoading || !isFormValid}
                                            className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-100 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:text-gray-400"
                                            title="Kirim notifikasi"
                                            aria-label={`Kirim notifikasi ke ${user.displayName}`}
                                        >
                                            <Send className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
