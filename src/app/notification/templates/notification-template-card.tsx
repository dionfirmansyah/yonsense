import { Button } from '@/components/ui/button';
import { db, NotificationTemplate } from '@/lib/db';
import { Bell, Check, Plus, Search, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface NotificationTemplateCardProps {
    templates: NotificationTemplate[];
    onSelectTemplate: (template: NotificationTemplate) => void;
    selectedTemplateId?: string;
}

export default function NotificationTemplateCard({
    templates,
    onSelectTemplate,
    selectedTemplateId,
}: NotificationTemplateCardProps) {
    const [searchTerm, setSearchTerm] = useState('');

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

    const clearSearch = () => {
        setSearchTerm('');
    };

    return (
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
                                            <p className="truncate text-xs text-blue-600">🔗 {template.actionUrl}</p>
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
                            <Link
                                href="/notification/custom"
                                className="flex min-h-[200px] items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-white p-4 text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-600"
                            >
                                <div className="text-center">
                                    <Button size="icon" className="mb-2 rounded-full border" variant="outline">
                                        <Plus />
                                    </Button>
                                    <p className="text-sm font-medium">Create new Template</p>
                                </div>
                            </Link>
                        </div>
                    ) : (
                        /* No Search Results */
                        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                            <Search className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-4 text-sm font-medium text-gray-900">Tidak ada template yang cocok</h3>
                            <p className="mt-2 text-sm text-gray-500">
                                Coba ubah kata kunci pencarian atau{' '}
                                <button onClick={clearSearch} className="text-blue-600 underline hover:text-blue-500">
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
    );
}
