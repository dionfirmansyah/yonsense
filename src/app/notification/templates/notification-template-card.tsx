import { Button } from '@/components/ui/button';
import { db, NotificationTemplate } from '@/lib/db';
import { Bell, Check, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface NotificationTemplateCardProps {
    templates: NotificationTemplate[];
    onSelectTemplate: (template: NotificationTemplate) => void;
    selectedTemplateId?: string;
}

const PRIORITY_LABELS = {
    low: 'Rendah',
    normal: 'Normal',
    high: 'Tinggi',
};

const PRIORITY_COLORS = {
    low: 'bg-green-400 text-white',
    normal: 'bg-blue-500 text-white',
    high: 'bg-red-500 text-white',
};

export default function NotificationTemplateCard({
    templates,
    onSelectTemplate,
    selectedTemplateId,
}: NotificationTemplateCardProps) {
    const handleDeleteTemplate = (templateId: string) => {
        try {
            db.transact(db.tx.notificationTemplates[templateId].delete());
            toast.success('Template berhasil dihapus');
        } catch (error) {
            toast.error('Gagal menghapus template');
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Pilih Template Notifikasi</h3>

            {templates && templates.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map((template) => (
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
                                        onClick={() => handleDeleteTemplate(template.id)}
                                        className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-sm"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </>
                            )}

                            {/* Template Header */}
                            <div className="mb-3 flex items-start justify-between">
                                <div className="flex items-center space-x-2">
                                    <div
                                        className={`flex h-6 w-6 items-center justify-center rounded-full ${PRIORITY_COLORS[template.priority!]} `}
                                    >
                                        <Bell className="h-3 w-3 text-white" />
                                    </div>
                                    <span className={`rounded-full px-2 py-1 text-xs font-medium`}>
                                        {PRIORITY_LABELS[template.priority!]}
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

                    <Link
                        href="/notification/custom"
                        className="flex items-center justify-center gap-2 border-gray-200"
                    >
                        <Button size="icon" className="rounded-full border" variant="outline">
                            <Plus />
                        </Button>
                        Create new Template
                    </Link>
                </div>
            ) : (
                <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                    <Bell className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-sm font-medium text-gray-900">Belum ada template</h3>
                    <p className="mt-2 text-sm text-gray-500">Belum ada template notifikasi yang tersedia.</p>
                </div>
            )}
        </div>
    );
}
