import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import YonLogo from '@/components/yosense/yon-logo';
import { useIsMobile } from '@/hooks/use-mobile';
import { db, NotificationTemplate } from '@/lib/db';
import { id } from '@instantdb/react';
import { Check, FileText, Loader2, Plus, Search, Trash2, Wand2, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import CategorySelect from './category-select';
import UploadImageGallery from './upload-image-galery';

interface NotificationTemplateCardProps {
    templates: NotificationTemplate[];
    onSelectTemplate: (template: NotificationTemplate) => void;
    selectedTemplateId?: string;
    onChange?: (field: keyof NotificationData, value: string) => void;
}
interface NotificationData {
    title: string;
    body: string;
    image: File | null;
    actionUrl: string;
    priority: 'low' | 'normal' | 'high';
    category: string;
}

type NotificationPriority = 'low' | 'normal' | 'high';
type TabMode = 'template' | 'custom';

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
    category: 'custom',
};

export default function NotificationTemplateCard({
    templates,
    onSelectTemplate,
    selectedTemplateId,
    onChange,
}: NotificationTemplateCardProps) {
    const { user } = db.useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const isMobile = useIsMobile();

    // Get current mode from URL params
    const currentMode = (searchParams.get('mode') as TabMode) || 'template';

    const [searchTerm, setSearchTerm] = useState('');
    const [notification, setNotification] = useState<NotificationData>(INITIAL_NOTIFICATION_STATE);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Update URL when mode changes
    const setMode = useCallback(
        (mode: TabMode) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('mode', mode);
            router.push(`?${params.toString()}`);
        },
        [searchParams, router],
    );

    useEffect(() => {
        if (currentMode === 'custom') {
            setNotification(INITIAL_NOTIFICATION_STATE);
            setSelectedImage(null);
        }
    }, [setMode]);

    // Validation helpers
    const isFormValid = useCallback((): boolean => {
        return Boolean(notification.title.trim() && notification.body.trim());
    }, [notification.title, notification.body]);

    // Event handlers
    const handleInputChange = useCallback(
        (field: keyof NotificationData) => {
            return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
                const value = event.target.value;

                onChange?.(field, value);

                setNotification((prev) => ({
                    ...prev,
                    [field]: value,
                }));
            };
        },
        [onChange], // tambahin dependency kalau onChange datang dari props
    );

    // Filter templates based on search term
    const filteredTemplates = useMemo(() => {
        if (!searchTerm.trim()) return templates;

        const searchLower = searchTerm.toLowerCase();
        return templates.filter(
            (template) =>
                template.title.toLowerCase().includes(searchLower) ||
                template.body.toLowerCase().includes(searchLower) ||
                template.priority?.toLowerCase().includes(searchLower) ||
                template.category?.toLowerCase().includes(searchLower) ||
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
                        category: notification.category,
                    }),
                );
                setNotification(INITIAL_NOTIFICATION_STATE);
                setSelectedImage(null);
                toast.success('Template notifikasi berhasil disimpan.');
                // Switch back to template mode after saving
                setMode('template');
            } catch (error) {
                toast.error('Gagal menyimpan template notifikasi. Silakan coba lagi.');
            } finally {
                setIsLoading(false);
            }
        },
        [isFormValid, selectedImage, notification, setMode],
    );

    const clearSearch = () => {
        setSearchTerm('');
    };

    const handleCreateNew = () => {
        setMode('custom');
    };

    const handleSelectTemplate = (template: NotificationTemplate) => {
        // Fill form with template data when switching to custom mode
        setNotification({
            title: template.title,
            body: template.body,
            actionUrl: template.actionUrl || '',
            priority: template.priority as NotificationPriority,
            category: template.category || 'custom',
            image: null,
        });
        setSelectedImage(template.image || null);
        onSelectTemplate(template);
    };

    const renderNotificationPreview = useCallback(
        () => (
            <div className="rounded-lg border p-3 sm:p-4">
                <h3 className="mb-3 text-sm font-medium sm:text-base">Preview Notifikasi</h3>
                <div className="bg-background rounded-lg border p-3 shadow-sm sm:p-4">
                    <div className="flex items-start space-x-2 sm:space-x-3">
                        <div className="flex w-full items-center justify-between">
                            <div className="flex min-w-0 flex-1 flex-col items-start">
                                <p className="w-full truncate text-sm font-medium sm:text-base">
                                    {notification.title.trim() || 'Judul Notifikasi'}
                                </p>
                                <p className="mt-1 mb-2 line-clamp-2 text-xs text-gray-600 sm:text-sm">
                                    {notification.body.trim() || 'Pesan notifikasi akan muncul di sini...'}
                                </p>
                            </div>
                            <div className="ml-2 flex flex-shrink-0 items-center">
                                <YonLogo className="h-6 w-6 sm:h-8 sm:w-8" />
                            </div>
                        </div>
                    </div>
                    <div className="mt-2 min-w-0 flex-1">
                        {selectedImage && (
                            <img
                                src={selectedImage}
                                alt="Push Notification Image"
                                className="h-32 w-full rounded object-cover transition group-hover:opacity-80 sm:h-48"
                            />
                        )}
                        {notification.actionUrl && (
                            <p className="text-primary mt-2 truncate text-xs">🔗 {notification.actionUrl}</p>
                        )}
                    </div>
                </div>
            </div>
        ),
        [notification, selectedImage],
    );

    const renderTemplateMode = () => (
        <>
            {/* Search Bar */}
            <div className="relative mb-4">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Cari template..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="focus:border-primary focus:ring-primary w-full rounded-lg border border-gray-300 py-2.5 pr-10 pl-10 text-sm focus:ring-1 focus:outline-none sm:py-2"
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

            {/* Templates Grid */}
            {templates && templates.length > 0 ? (
                <>
                    {filteredTemplates.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                            {filteredTemplates.map((template) => (
                                <div
                                    key={template.id}
                                    className={`bg-background relative cursor-pointer rounded-lg border-2 p-3 shadow-sm transition-all hover:shadow-md sm:p-4 ${
                                        selectedTemplateId === template.id
                                            ? 'border-primary'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onClick={() => handleSelectTemplate(template)}
                                >
                                    {/* Selection Indicator */}
                                    {selectedTemplateId === template.id && (
                                        <>
                                            <div className="bg-background border-primary absolute -top-2 -left-2 flex h-5 w-5 items-center justify-center rounded-full border shadow-sm sm:h-6 sm:w-6">
                                                <Check className="text-primary h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteTemplate(template.id);
                                                }}
                                                className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 shadow-sm transition-colors hover:bg-red-600 sm:h-6 sm:w-6"
                                            >
                                                <Trash2 className="h-2.5 w-2.5 text-white sm:h-3 sm:w-3" />
                                            </button>
                                        </>
                                    )}

                                    {/* Template Header */}
                                    <div className="mb-2 flex items-start justify-between sm:mb-3">
                                        <div className="flex items-center space-x-1.5 sm:space-x-2">
                                            <span
                                                className={`rounded-full px-1.5 py-0.5 text-xs font-medium sm:px-2 sm:py-1 ${
                                                    template.priority === 'high'
                                                        ? 'bg-red-100 text-red-800'
                                                        : template.priority === 'normal'
                                                          ? 'bg-yellow-100 text-yellow-800'
                                                          : 'bg-green-100 text-green-800'
                                                }`}
                                            >
                                                {template.priority}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Template Content */}
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <h4 className="line-clamp-2 text-sm font-medium sm:text-base">
                                            {template.title}
                                        </h4>
                                        <p className="line-clamp-3 text-xs text-gray-600 sm:text-sm">{template.body}</p>
                                    </div>

                                    {/* Template Image */}
                                    {template.image && (
                                        <div className="mt-2 sm:mt-3">
                                            <img
                                                src={template.image}
                                                alt="Template preview"
                                                className="h-16 w-full rounded object-cover sm:h-20"
                                            />
                                        </div>
                                    )}

                                    {/* Action URL */}
                                    {template.actionUrl && (
                                        <div className="mt-2 sm:mt-3">
                                            <p className="text-primary truncate text-xs">🔗 {template.actionUrl}</p>
                                        </div>
                                    )}

                                    {/* Template Footer */}
                                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500 sm:mt-3">
                                        <span>#{template.id.slice(-6)}</span>
                                        {template.createdAt && (
                                            <span className="hidden sm:inline">
                                                {new Date(template.createdAt).toLocaleDateString('id-ID')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Add New Template Card */}
                            <div
                                onClick={handleCreateNew}
                                className="hover:text-primary flex min-h-[120px] cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-4 text-gray-500 transition-all hover:border-blue-400 hover:shadow-md sm:min-h-[200px] sm:p-6"
                            >
                                <div className="flex flex-col items-center text-center">
                                    <Button
                                        size="sm"
                                        className="mb-2 h-8 w-8 rounded-full border border-gray-300 sm:mb-3 sm:h-10 sm:w-10"
                                        variant="outline"
                                    >
                                        <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                    <p className="text-xs font-medium sm:text-sm">Buat Template Baru</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* No Search Results */
                        <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center sm:p-12">
                            <Search className="mx-auto h-8 w-8 text-gray-400 sm:h-12 sm:w-12" />
                            <h3 className="mt-3 text-sm font-medium sm:mt-4">Tidak ada template yang cocok</h3>
                            <p className="mt-1 text-xs text-gray-500 sm:mt-2 sm:text-sm">
                                Coba ubah kata kunci pencarian atau{' '}
                                <button onClick={clearSearch} className="text-primary hover:text-primary underline">
                                    reset pencarian
                                </button>
                            </p>
                        </div>
                    )}
                </>
            ) : (
                /* No Templates */
                <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center sm:p-12">
                    <h3 className="mt-3 text-sm font-medium sm:mt-4">Belum ada template</h3>
                    <p className="mt-1 text-xs text-gray-500 sm:mt-2 sm:text-sm">
                        Belum ada template notifikasi yang tersedia.
                    </p>
                    <div className="mt-4 sm:mt-6">
                        <Button onClick={handleCreateNew} className="gap-2 text-sm" size="sm">
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                            Buat Template Pertama
                        </Button>
                    </div>
                </div>
            )}
        </>
    );

    const renderCustomMode = () => (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Form Fields */}
            <form onSubmit={handleSaveTemplates} className="space-y-4 sm:space-y-6">
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Judul Notifikasi *</label>
                    <Input
                        type="text"
                        placeholder="Masukkan judul notifikasi..."
                        value={notification.title}
                        onChange={handleInputChange('title')}
                        maxLength={100}
                        required
                        className="text-sm sm:text-base"
                    />
                    <p className="mt-1 text-xs text-gray-500">{notification.title.length}/100 karakter</p>
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Pesan *</label>
                    <textarea
                        className="focus:ring-primary w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-transparent focus:ring-2 sm:px-4 sm:py-3"
                        rows={4}
                        placeholder="Masukkan pesan notifikasi..."
                        value={notification.body}
                        onChange={handleInputChange('body')}
                        maxLength={200}
                        required
                    />
                    <p className="mt-1 text-xs text-gray-500">{notification.body.length}/200 karakter</p>
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">URL Aksi (Opsional)</label>
                    <Input
                        type="url"
                        placeholder="https://example.com"
                        value={notification.actionUrl}
                        onChange={handleInputChange('actionUrl')}
                        className="text-sm sm:text-base"
                    />
                    <p className="mt-1 text-xs text-gray-500">URL yang akan dibuka ketika notifikasi diklik</p>
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Prioritas</label>
                    <Select
                        value={notification.priority}
                        onValueChange={(val) =>
                            setNotification((prev) => ({ ...prev, priority: val as NotificationPriority }))
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih prioritas" />
                        </SelectTrigger>
                        <SelectContent>
                            {PRIORITY_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {isMobile && (
                    <CategorySelect
                        value={notification.category}
                        onChange={(val) => setNotification((prev) => ({ ...prev, category: val }))}
                    />
                )}

                <div className="block lg:hidden">
                    <label className="mb-2 block text-sm font-medium text-gray-700">Gambar Notifikasi (Opsional)</label>
                    <div className="hover: rounded-lg border-2 border-dashed border-gray-300 p-3 text-center transition-all hover:border-blue-400 sm:p-6">
                        <UploadImageGallery onSelect={(url: string) => setSelectedImage(url)} userId={user?.id} />
                    </div>
                </div>

                <div className="block lg:hidden">{renderNotificationPreview()}</div>

                <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:pt-4">
                    <Button className="w-full sm:w-auto" size="sm" type="submit" disabled={isLoading || !isFormValid()}>
                        {isLoading ? (
                            <Loader2 className="mr-2 h-3 w-3 animate-spin sm:h-4 sm:w-4" />
                        ) : (
                            <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                        Simpan sebagai Template
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => setMode('template')}
                    >
                        Kembali ke Template
                    </Button>
                </div>
            </form>

            {/* Desktop Image Upload & Preview */}
            <div className="hidden space-y-6 lg:block">
                {!isMobile && (
                    <CategorySelect
                        value={notification.category}
                        onChange={(val) => setNotification((prev) => ({ ...prev, category: val }))}
                    />
                )}

                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Gambar Notifikasi (Opsional)</label>
                    <div className="hover: rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-all hover:border-blue-400">
                        <UploadImageGallery onSelect={(url: string) => setSelectedImage(url)} userId={user?.id} />
                    </div>
                </div>
                <div>{renderNotificationPreview()}</div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setMode('template')}
                        className={`flex items-center gap-2 border-b-2 px-1 py-2 text-sm font-medium whitespace-nowrap ${
                            currentMode === 'template'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`}
                    >
                        <FileText className="h-4 w-4" />
                        Template ({templates.length})
                    </button>
                    <button
                        onClick={() => setMode('custom')}
                        className={`flex items-center gap-2 border-b-2 px-1 py-2 text-sm font-medium whitespace-nowrap ${
                            currentMode === 'custom'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`}
                    >
                        <Wand2 className="h-4 w-4" />
                        Custom
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {currentMode === 'template' && renderTemplateMode()}
                {currentMode === 'custom' && renderCustomMode()}
            </div>
        </div>
    );
}
