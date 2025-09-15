import { Button } from '@/components/ui/button';
import { NotificationTemplate } from '@/lib/db';
import { Bell, Check, Plus } from 'lucide-react';
import Link from 'next/link';

interface NotificationTemplateCardProps {
    templates: any[];
    onSelectTemplate: (template: NotificationTemplate) => void;
    selectedTemplateId?: string;
}

const PRIORITY_LABELS = {
    low: 'Rendah',
    normal: 'Normal',
    high: 'Tinggi',
};

const PRIORITY_COLORS = {
    low: 'bg-gray-100 text-gray-800',
    normal: 'bg-blue-100 text-blue-800',
    high: 'bg-red-100 text-red-800',
};

export default function NotificationTemplateCard({
    templates,
    onSelectTemplate,
    selectedTemplateId,
}: NotificationTemplateCardProps) {
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
                                <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm">
                                    <Check className="h-3 w-3" />
                                </div>
                            )}

                            {/* Template Header */}
                            <div className="mb-3 flex items-start justify-between">
                                <div className="flex items-center space-x-2">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600">
                                        <Bell className="h-3 w-3 text-white" />
                                    </div>
                                    <span className={`rounded-full px-2 py-1 text-xs font-medium`}>
                                        {template.priority!}
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
