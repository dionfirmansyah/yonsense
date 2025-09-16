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
import YonLogo from '@/components/yosense/yon-logo';
import { db, NotificationTemplate } from '@/lib/db';
import { id } from '@instantdb/react';
import { Bell, Check, Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { ChangeEvent, useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import UploadImageGallery from '../upload-image-galery';

interface NotificationTemplateCardProps {
    templates: NotificationTemplate[];
    onSelectTemplate: (template: NotificationTemplate) => void;
    selectedTemplateId?: string;
}
interface NotificationData {
    title: string;
    body: string;
    image: File | null;
    actionUrl: string;
    priority: 'low' | 'normal' | 'high';
}

type NotificationPriority = 'low' | 'normal' | 'high';

const PRIORITY_OPTIONS: { value: NotificationPriority; label: string }[] = [
    { value: 'low', label: 'Rendah' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'Tinggi' },
];

const INITIAL_NOTIFICATION_STATE: NotificationData = {
    title: '',
    body: '',
    image: null,
    actionUrl: '',
    priority: 'normal',
};

export default function NotificationTemplateCard({
    templates,
    onSelectTemplate,
    selectedTemplateId,
}: NotificationTemplateCardProps) {
    const { user } = db.useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    const [notification, setNotification] = useState<NotificationData>(INITIAL_NOTIFICATION_STATE);

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Validation helpers
    const isFormValid = useCallback((): boolean => {
        return Boolean(notification.title.trim() && notification.body.trim());
    }, [notification.title, notification.body]);

    // Event handlers
    const handleInputChange = useCallback((field: keyof NotificationData) => {
        return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
            const value = event.target.value;
            setNotification((prev) => ({ ...prev, [field]: value }));
        };
    }, []);

    // Filter templates based on search term
    const filteredTemplates = useMemo(() => {
        if (!searchTerm.trim()) return templates;

        const searchLower = searchTerm.toLowerCase();
        return templates.filter(
            (template) =>
                template.title.toLowerCase().includes(searchLower) ||
                template.body.toLowerCase().includes(searchLower) ||
                template.priority?.toLowerCase().includes(searchLower) ||
                template.actionUrl?.toLowerCase().includes(searchLower),
        );
    }, [templates, searchTerm]);

    const handleDeleteTemplate = (templateId: string) => {
        try {
            db.transact(db.tx.notificationTemplates[templateId].delete());
            toast.success('Template berhasil dihapus');
        } catch (error) {
            toast.error('Gagal menghapus template');
        }
    };
    const handleSaveTemplates = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            if (!isFormValid) return;

            setIsLoading(true);
            try {
                await db.transact(
                    db.tx.notificationTemplates[id()].create({
                        title: notification.title,
                        body: notification.body,
                        priority: notification.priority,
                        actionUrl: notification.actionUrl,
                        image: selectedImage,
                    }),
                );
                setNotification(INITIAL_NOTIFICATION_STATE);
                setSelectedImage(null);
                toast.success('Template notifikasi berhasil disimpan.');
            } catch (error) {
                toast.error('Gagal menyimpan template notifikasi. Silakan coba lagi.');
            } finally {
                setIsLoading(false);
            }
        },
        [handleInputChange, selectedImage, notification],
    );

    const clearSearch = () => {
        setSearchTerm('');
    };
    const renderNotificationPreview = useCallback(
        () => (
            <div className="rounded-lg border bg-gray-50 p-4">
                <h3 className="mb-3 font-medium text-gray-900">Preview Notifikasi</h3>
                <div className="rounded-lg border bg-white p-4 shadow-sm">
                    <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
                                <Bell className="h-4 w-4 text-white" />
                            </div>
                        </div>
                        <div className="flex w-full items-center justify-between">
                            <div className="flex flex-col items-start">
                                <p className="font-medium text-gray-900">
                                    {notification.title.trim() || 'Judul Notifikasi'}
                                </p>
                                <p className="mt-1 mb-2 text-sm text-gray-600">
                                    {notification.body.trim() || 'Pesan notifikasi akan muncul di sini...'}
                                </p>
                            </div>
                            <div className="flex items-center">
                                <YonLogo className="h-8 w-8" />
                            </div>
                        </div>
                    </div>
                    <div className="min-w-0 flex-1">
                        {selectedImage && (
                            <img
                                src={selectedImage}
                                alt="Push Notification Image"
                                className="h-[300px] w-full object-cover transition group-hover:opacity-80"
                            />
                        )}
                        {notification.actionUrl && (
                            <p className="mt-1 text-xs text-blue-600">🔗 {notification.actionUrl}</p>
                        )}
                    </div>
                </div>
            </div>
        ),
        [notification, selectedImage],
    );

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">Pilih Template Notifikasi</h3>
                    <span className="text-sm text-gray-500">
                        {filteredTemplates.length} dari {templates.length} template
                    </span>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <div className="relative">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari template berdasarkan judul, isi, atau prioritas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 py-2 pr-10 pl-10 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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

                {/* Templates Grid */}
                {templates && templates.length > 0 ? (
                    <>
                        {filteredTemplates.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {filteredTemplates.map((template) => (
                                    <div
                                        key={template.id}
                                        className={`relative cursor-pointer rounded-lg border-2 bg-white p-4 shadow-sm transition-all hover:shadow-md ${
                                            selectedTemplateId === template.id
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                        onClick={() => onSelectTemplate(template)}
                                    >
                                        {/* Selection Indicator */}
                                        {selectedTemplateId === template.id && (
                                            <>
                                                <div className="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm">
                                                    <Check className="h-3 w-3" />
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteTemplate(template.id);
                                                    }}
                                                    className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition-colors hover:bg-red-600"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </>
                                        )}

                                        {/* Template Header */}
                                        <div className="mb-3 flex items-start justify-between">
                                            <div className="flex items-center space-x-2">
                                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
                                                    <Bell className="h-3 w-3 text-white" />
                                                </div>
                                                <span
                                                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                                                        template.priority === 'high'
                                                            ? 'bg-red-100 text-red-800'
                                                            : template.priority === 'medium'
                                                              ? 'bg-yellow-100 text-yellow-800'
                                                              : 'bg-green-100 text-green-800'
                                                    }`}
                                                >
                                                    {template.priority}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Template Content */}
                                        <div className="space-y-2">
                                            <h4 className="line-clamp-2 font-medium text-gray-900">{template.title}</h4>
                                            <p className="line-clamp-3 text-sm text-gray-600">{template.body}</p>
                                        </div>

                                        {/* Template Image */}
                                        {template.image && (
                                            <div className="mt-3">
                                                <img
                                                    src={template.image}
                                                    alt="Template preview"
                                                    className="h-20 w-full rounded object-cover"
                                                />
                                            </div>
                                        )}

                                        {/* Action URL */}
                                        {template.actionUrl && (
                                            <div className="mt-3">
                                                <p className="truncate text-xs text-blue-600">
                                                    🔗 {template.actionUrl}
                                                </p>
                                            </div>
                                        )}

                                        {/* Template Footer */}
                                        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                                            <span>Template #{template.id.slice(-6)}</span>
                                            {template.createdAt && (
                                                <span>{new Date(template.createdAt).toLocaleDateString('id-ID')}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Add New Template Card */}
                                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                                    <DialogTrigger asChild>
                                        <div className="flex min-h-[200px] cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-gray-500 transition-all hover:border-blue-400 hover:text-blue-600 hover:shadow-md">
                                            <div className="flex flex-col items-center">
                                                <Button
                                                    size="icon"
                                                    className="mb-3 rounded-full border border-gray-300"
                                                    variant="outline"
                                                >
                                                    <Plus />
                                                </Button>
                                                <p className="text-sm font-medium">Buat Template Baru</p>
                                            </div>
                                        </div>
                                    </DialogTrigger>

                                    <DialogContent className="max-h-[90vh] w-full overflow-y-auto rounded-2xl p-0 sm:max-w-5xl">
                                        <DialogHeader className="px-6 pt-6">
                                            <DialogTitle className="text-xl font-semibold">
                                                Buat Template Baru
                                            </DialogTitle>
                                            <DialogDescription>
                                                Buat template notifikasi baru dan pilih user yang akan ditambahkan.
                                            </DialogDescription>
                                        </DialogHeader>

                                        {/* Body */}
                                        <div className="p-6">
                                            <div className="mb-6 flex items-center justify-between">
                                                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                                                    <Bell className="h-5 w-5 text-blue-500" />
                                                    <span>Create Notification</span>
                                                </h2>
                                            </div>

                                            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                                                {/* Form Fields */}
                                                <form onSubmit={handleSaveTemplates} className="space-y-6">
                                                    <div>
                                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                                            Judul Notifikasi *
                                                        </label>
                                                        <Input
                                                            type="text"
                                                            placeholder="Masukkan judul notifikasi..."
                                                            value={notification.title}
                                                            onChange={handleInputChange('title')}
                                                            maxLength={100}
                                                            required
                                                        />
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            {notification.title.length}/100 karakter
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                                            Pesan *
                                                        </label>
                                                        <textarea
                                                            className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                                            rows={4}
                                                            placeholder="Masukkan pesan notifikasi..."
                                                            value={notification.body}
                                                            onChange={handleInputChange('body')}
                                                            maxLength={200}
                                                            required
                                                        />
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            {notification.body.length}/200 karakter
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                                            URL Aksi (Opsional)
                                                        </label>
                                                        <Input
                                                            type="url"
                                                            placeholder="https://example.com"
                                                            value={notification.actionUrl}
                                                            onChange={handleInputChange('actionUrl')}
                                                        />
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            URL yang akan dibuka ketika notifikasi diklik
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                                            Prioritas
                                                        </label>
                                                        <select
                                                            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                                            value={notification.priority}
                                                            onChange={handleInputChange('priority')}
                                                        >
                                                            {PRIORITY_OPTIONS.map((option) => (
                                                                <option key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="pt-4">
                                                        {isFormValid() && (
                                                            <Button
                                                                className="w-full lg:w-auto"
                                                                size="sm"
                                                                type="submit"
                                                                disabled={isLoading}
                                                            >
                                                                {isLoading ? (
                                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Plus className="mr-2 h-4 w-4" />
                                                                )}
                                                                Save as Template
                                                            </Button>
                                                        )}
                                                    </div>
                                                </form>

                                                {/* Image Upload & Preview */}
                                                <div className="space-y-6">
                                                    <div>
                                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                                            Gambar Notifikasi (Opsional)
                                                        </label>
                                                        <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-all hover:border-blue-400 hover:bg-blue-50">
                                                            <UploadImageGallery
                                                                onSelect={(url: string) => setSelectedImage(url)}
                                                                userId={user?.id}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>{renderNotificationPreview()}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        ) : (
                            /* No Search Results */
                            <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                                <Search className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-4 text-sm font-medium text-gray-900">
                                    Tidak ada template yang cocok
                                </h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Coba ubah kata kunci pencarian atau{' '}
                                    <button
                                        onClick={clearSearch}
                                        className="text-blue-600 underline hover:text-blue-500"
                                    >
                                        reset pencarian
                                    </button>
                                </p>
                            </div>
                        )}
                    </>
                ) : (
                    /* No Templates */
                    <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                        <Bell className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-sm font-medium text-gray-900">Belum ada template</h3>
                        <p className="mt-2 text-sm text-gray-500">Belum ada template notifikasi yang tersedia.</p>
                        <div className="mt-6">
                            <Link href="/notification/custom">
                                <Button className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Buat Template Pertama
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
