import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { db, Segment, SegmentUser } from '@/lib/db';
import { createInitial } from '@/lib/utils';
import { id } from '@instantdb/react';

import { Check, Loader2, Plus, Save, Search, Trash2, Users, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface Profile {
    id: string;
    userId: string;
    email?: string;
    displayName?: string;
    picture?: string;
    createdAt: Date;
    updatedAt?: Date;
}

interface UserSegmentManagerProps {
    segments: Segment[];
    segmentUsers: SegmentUser[];
    profiles: Profile[];
    onSelectSegment: (segment: Segment) => void;
    selectedSegmentIds?: string[];
    multiSelect?: boolean;
}

export default function UserSegmentManager({
    segments,
    segmentUsers,
    profiles,
    onSelectSegment,
    selectedSegmentIds = [],
    multiSelect = false,
}: UserSegmentManagerProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

    // New segment form state
    const [newSegment, setNewSegment] = useState({
        name: '',
        description: '',
        color: '#3B82F6',
        autoAssignUsers: true,
    });

    const colorOptions = ['#3B82F6', '#8B5CF6', '#10B981', '#EF4444', '#F59E0B', '#EC4899', '#06B6D4', '#84CC16'];

    // Calculate user count for each segment
    const segmentUserCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        segmentUsers.forEach((su) => {
            counts[su.segmentId] = (counts[su.segmentId] || 0) + 1;
        });
        return counts;
    }, [segmentUsers]);

    // Filter segments based on search term
    const filteredSegments = useMemo(() => {
        if (!searchTerm.trim()) return segments;

        const searchLower = searchTerm.toLowerCase();
        return segments.filter(
            (segment) =>
                segment.name.toLowerCase().includes(searchLower) ||
                segment.description?.toLowerCase().includes(searchLower),
        );
    }, [segments, searchTerm]);

    // Filter users based on search term for user selection
    const filteredProfiles = useMemo(() => {
        if (!userSearchTerm.trim()) return profiles;

        const searchLower = userSearchTerm.toLowerCase();
        return profiles.filter(
            (profile) =>
                profile.displayName?.toLowerCase().includes(searchLower) ||
                profile.email?.toLowerCase().includes(searchLower),
        );
    }, [profiles, userSearchTerm]);

    const handleDeleteSegment = async (segmentId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        try {
            // Delete segment and related segment_users
            await db.transact([
                db.tx.segment[segmentId].delete(),
                ...segmentUsers
                    .filter((su) => su.segmentId === segmentId)
                    .map((su) => db.tx.segment_user[su.id].delete()),
            ]);
            toast.success('Segment berhasil dihapus');
        } catch (error) {
            toast.error('Gagal menghapus segment');
        }
    };

    const clearSearch = () => {
        setSearchTerm('');
    };

    const clearUserSearch = () => {
        setUserSearchTerm('');
    };

    const isSelected = (segmentId: string) => {
        return selectedSegmentIds.includes(segmentId);
    };

    const isUserSelected = (userId: string) => {
        return selectedUserIds.includes(userId);
    };

    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
    };

    const selectAllUsers = () => {
        setSelectedUserIds(filteredProfiles.map((profile) => profile.userId));
    };

    const deselectAllUsers = () => {
        setSelectedUserIds([]);
    };

    const handleCreateSegment = async () => {
        if (!newSegment.name.trim()) {
            toast.error('Nama segment harus diisi');
            return;
        }

        if (selectedUserIds.length === 0) {
            toast.error('Pilih minimal satu user untuk segment');
            return;
        }

        setIsCreating(true);
        try {
            const segmentId = id();
            const transactions: any[] = []; // Using any[] for simplicity, but you could create a proper union type

            // Your existing code for creating the segment
            const segmentTransaction = db.tx.segment[segmentId].create({
                name: newSegment.name,
                description: newSegment.description,
                color: newSegment.color,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
            transactions.push(segmentTransaction);

            // Add selected users to segment
            const segmentUserTransactions = selectedUserIds.map((userId) =>
                db.tx.segment_user[id()].create({
                    userId,
                    segmentId: segmentId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                }),
            );
            transactions.push(...segmentUserTransactions);

            await db.transact(transactions);

            toast.success(`Segment berhasil dibuat dengan ${selectedUserIds.length} user`);

            // Reset form
            resetForm();
            setIsCreateDialogOpen(false);
        } catch (error) {
            toast.error('Gagal membuat segment');
            console.error('Create segment error:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const resetForm = () => {
        setNewSegment({
            name: '',
            description: '',
            color: '#3B82F6',
            autoAssignUsers: true,
        });
        setSelectedUserIds([]);
        setUserSearchTerm('');
    };

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
                <div className="relative">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Cari segment berdasarkan nama, atau deskripsi.."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button
                            onClick={clearSearch}
                            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </div>
            </div>

            {/* Segments Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredSegments.map((segment) => (
                    <div
                        key={segment.id}
                        className={`bg-background relative cursor-pointer rounded-lg border-2 p-4 shadow-sm transition-all hover:shadow-md ${
                            isSelected(segment.id)
                                ? 'border-primary bg-primary ring-primary ring-2'
                                : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => onSelectSegment(segment)}
                    >
                        {isSelected(segment.id) && (
                            <>
                                {/* Selection Indicator */}
                                <div className="bg-primary text-background absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full shadow-sm">
                                    <Check className="h-3 w-3" />
                                </div>
                                {/* Delete Button */}
                                <button
                                    onClick={(e) => handleDeleteSegment(segment.id, e)}
                                    className="text-background absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 shadow-sm transition-colors hover:bg-red-600"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </>
                        )}

                        {/* Segment Header */}
                        <div className="mb-3 flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                                <div
                                    className="flex h-6 w-6 items-center justify-center rounded-full"
                                    style={{ backgroundColor: segment.color || '#3B82F6' }}
                                >
                                    <Users className="text-background h-3 w-3" />
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Users className="h-3 w-3" />
                                    <span className="font-medium">
                                        {(segmentUserCounts[segment.id] || 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Segment Content */}
                        <div className="space-y-2">
                            <h4 className="line-clamp-2 font-medium text-gray-900">{segment.name}</h4>
                            {segment.description && (
                                <p className="line-clamp-3 text-sm text-gray-600">{segment.description}</p>
                            )}
                        </div>

                        {/* Segment Footer */}
                        <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs text-gray-500">
                            <span>Segment #{segment.id.slice(-6)}</span>
                            {segment.createdAt && (
                                <span>{new Date(segment.createdAt).toLocaleDateString('id-ID')}</span>
                            )}
                        </div>
                    </div>
                ))}

                {/* Add New Segment Card */}
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <div className="bg-background flex min-h-[200px] cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-4 text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-600">
                            <div className="text-center">
                                <Button size="icon" className="mb-2 rounded-full border" variant="outline">
                                    <Plus />
                                </Button>
                                <p className="text-sm font-medium">Buat Segment Baru</p>
                            </div>
                        </div>
                    </DialogTrigger>
                    <DialogContent className="max-h-[95vh] w-full max-w-6xl overflow-hidden">
                        <DialogHeader>
                            <DialogTitle>Buat Segment Baru</DialogTitle>
                            <DialogDescription>
                                Buat segment user baru dan pilih user yang akan ditambahkan
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex h-full max-h-[75vh] gap-6 overflow-hidden">
                            {/* Form Section */}
                            <div className="w-full overflow-y-auto border-r p-1">
                                <div className="space-y-6">
                                    {/* Basic Info */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                                Nama Segment *
                                            </label>
                                            <input
                                                type="text"
                                                className="focus:ring-primary w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
                                                placeholder="Masukkan nama segment"
                                                value={newSegment.name}
                                                onChange={(e) => setNewSegment({ ...newSegment, name: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                                Deskripsi
                                            </label>
                                            <textarea
                                                className="focus:ring-primary w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2"
                                                rows={3}
                                                placeholder="Deskripsi segment (opsional)"
                                                value={newSegment.description}
                                                onChange={(e) =>
                                                    setNewSegment({
                                                        ...newSegment,
                                                        description: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                                Warna
                                            </label>
                                            <div className="flex flex-wrap gap-2 p-4">
                                                {colorOptions.map((color) => (
                                                    <button
                                                        key={color}
                                                        className={`h-8 w-8 rounded-full border-2 transition-all ${
                                                            newSegment.color === color
                                                                ? 'scale-110 border-gray-900'
                                                                : 'border-gray-300 hover:border-gray-400'
                                                        }`}
                                                        style={{ backgroundColor: color }}
                                                        onClick={() => setNewSegment({ ...newSegment, color })}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Selected Users Summary */}
                                    <div className="bg-primary rounded-lg p-4">
                                        <div className="mb-2 flex items-center gap-2">
                                            <Users className="text-primary h-5 w-5" />
                                            <span className="text-primary font-medium">
                                                {selectedUserIds.length} user dipilih
                                            </span>
                                        </div>
                                    </div>
                                    {/* User Selection Panel */}
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex h-full flex-col">
                                            <div className="mb-4">
                                                {/* User Search */}
                                                <div className="relative">
                                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        placeholder="Cari user berdasarkan nama atau email..."
                                                        value={userSearchTerm}
                                                        onChange={(e) => setUserSearchTerm(e.target.value)}
                                                        className="focus:border-primary focus:ring-primary w-full rounded-lg border border-gray-300 py-2 pr-10 pl-10 text-sm focus:ring-1 focus:outline-none"
                                                    />
                                                    {userSearchTerm && (
                                                        <button
                                                            onClick={clearUserSearch}
                                                            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* User List */}
                                            <div className="flex-1 space-y-2 overflow-y-auto">
                                                <div className="mb-3 flex items-center justify-end">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={selectAllUsers}
                                                            disabled={filteredProfiles.length === 0}
                                                        >
                                                            Pilih Semua ({filteredProfiles.length})
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={deselectAllUsers}
                                                            disabled={selectedUserIds.length === 0}
                                                        >
                                                            Batal Pilih Semua
                                                        </Button>
                                                    </div>
                                                </div>
                                                {filteredProfiles.length > 0 ? (
                                                    filteredProfiles.map((user) => (
                                                        <div
                                                            key={user.id}
                                                            className={`cursor-pointer rounded-lg border p-3 transition-all ${
                                                                isUserSelected(user.userId)
                                                                    ? 'border-primary bg-primary ring-primary ring-2'
                                                                    : 'bg-background border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                            }`}
                                                            onClick={() => toggleUserSelection(user.userId)}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex-shrink-0">
                                                                    <div
                                                                        className={`flex h-4 w-4 items-center justify-center rounded border-2 ${
                                                                            isUserSelected(user.userId)
                                                                                ? 'border-primary bg-primary'
                                                                                : 'border-gray-300'
                                                                        }`}
                                                                    >
                                                                        {isUserSelected(user.userId) && (
                                                                            <Check className="text-background h-3 w-3" />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <Avatar className="h-8 w-8 rounded-full">
                                                                    <AvatarImage
                                                                        src={user.picture}
                                                                        alt={user.displayName}
                                                                    />
                                                                    <AvatarFallback className="rounded-full bg-gray-300 p-2 text-center text-xs">
                                                                        {createInitial(user.displayName)}
                                                                    </AvatarFallback>
                                                                </Avatar>

                                                                <div className="min-w-0 flex-1">
                                                                    <p className="truncate text-sm font-medium text-gray-900">
                                                                        {user.displayName || 'No Name'}
                                                                    </p>
                                                                    <p className="truncate text-xs text-gray-500">
                                                                        {user.email || 'No Email'}
                                                                    </p>
                                                                    <p className="mt-1 text-xs text-gray-400">
                                                                        Joined:{' '}
                                                                        {new Date(user.createdAt).toLocaleDateString(
                                                                            'id-ID',
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="py-8 text-center">
                                                        <Users className="mx-auto h-12 w-12 text-gray-400" />
                                                        <p className="mt-2 text-sm text-gray-500">
                                                            {userSearchTerm
                                                                ? 'Tidak ada user yang cocok dengan pencarian'
                                                                : 'Tidak ada user tersedia'}
                                                        </p>
                                                        {userSearchTerm && (
                                                            <Button
                                                                variant="link"
                                                                size="sm"
                                                                onClick={clearUserSearch}
                                                                className="mt-2"
                                                            >
                                                                Hapus filter pencarian
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex w-full justify-end gap-3 sm:w-auto">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                resetForm();
                                                setIsCreateDialogOpen(false);
                                            }}
                                            disabled={isCreating}
                                            className="flex-1 sm:flex-none"
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            onClick={handleCreateSegment}
                                            disabled={
                                                isCreating || !newSegment.name.trim() || selectedUserIds.length === 0
                                            }
                                            className="flex flex-1 items-center gap-2 sm:flex-none"
                                        >
                                            {isCreating ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Membuat...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-4 w-4" />
                                                    Buat Segment
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Selection Info */}
            {multiSelect && selectedSegmentIds.length > 0 && (
                <div className="border-primary bg-primary mt-4 rounded-lg border p-3">
                    <div className="text-primary flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4" />
                        <span className="font-medium">{selectedSegmentIds.length} segment dipilih</span>
                    </div>
                    <div className="text-primary mt-1 text-xs">
                        Total estimasi user:{' '}
                        {selectedSegmentIds
                            .reduce((total, segmentId) => total + (segmentUserCounts[segmentId] || 0), 0)
                            .toLocaleString()}
                    </div>
                </div>
            )}
        </div>
    );
}
