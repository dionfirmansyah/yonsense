'use client';

import { Bell, Upload, X } from 'lucide-react';
import { useState } from 'react';

interface FormProps {
    notification: any;
}

export default function Form({ notification }: FormProps) {
    const [notification, setNotification] = useState({
        title: '',
        message: '',
        image: null,
        actionUrl: '',
        priority: 'normal',
    });

    const [previewImage, setPreviewImage] = useState(null);

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviewImage(e.target.result);
                setNotification((prev) => ({ ...prev, image: file }));
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setPreviewImage(null);
        setNotification((prev) => ({ ...prev, image: null }));
        document.getElementById('image-upload').value = '';
    };

    return (
        <div>
            {/* Form Section */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
                <h2 className="mb-6 flex items-center space-x-2 text-xl font-semibold text-gray-900">
                    <Bell className="h-5 w-5" />
                    <span>Buat Notifikasi Baru</span>
                </h2>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Form Fields */}
                    <div className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Judul Notifikasi *</label>
                            <input
                                type="text"
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                placeholder="Masukkan judul notifikasi..."
                                value={notification.title}
                                onChange={(e) => setNotification((prev) => ({ ...prev, title: e.target.value }))}
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Pesan *</label>
                            <textarea
                                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                rows={4}
                                placeholder="Masukkan pesan notifikasi..."
                                value={notification.message}
                                onChange={(e) => setNotification((prev) => ({ ...prev, message: e.target.value }))}
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">URL Aksi (Opsional)</label>
                            <input
                                type="url"
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                placeholder="https://example.com"
                                value={notification.actionUrl}
                                onChange={(e) => setNotification((prev) => ({ ...prev, actionUrl: e.target.value }))}
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Prioritas</label>
                            <select
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                value={notification.priority}
                                onChange={(e) => setNotification((prev) => ({ ...prev, priority: e.target.value }))}
                            >
                                <option value="low">Rendah</option>
                                <option value="normal">Normal</option>
                                <option value="high">Tinggi</option>
                            </select>
                        </div>
                    </div>

                    {/* Image Upload & Preview */}
                    <div className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Gambar Notifikasi (Opsional)
                            </label>
                            <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-blue-400">
                                {previewImage ? (
                                    <div className="relative">
                                        <img
                                            src={previewImage}
                                            alt="Preview"
                                            className="mx-auto h-48 max-w-full rounded-lg object-cover"
                                        />
                                        <button
                                            onClick={removeImage}
                                            className="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white transition-colors hover:bg-red-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                        <div>
                                            <p className="text-gray-600">Upload gambar untuk notifikasi</p>
                                            <p className="text-sm text-gray-400">PNG, JPG hingga 2MB</p>
                                        </div>
                                        <input
                                            id="image-upload"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageUpload}
                                        />
                                        <label
                                            htmlFor="image-upload"
                                            className="inline-flex cursor-pointer items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                                        >
                                            <Upload className="mr-2 h-4 w-4" />
                                            Pilih Gambar
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Notification Preview */}
                        <div className="rounded-lg border bg-gray-50 p-4">
                            <h3 className="mb-3 font-medium text-gray-900">Preview Notifikasi</h3>
                            <div className="rounded-lg border bg-white p-4 shadow-sm">
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
                                            <Bell className="h-4 w-4 text-white" />
                                        </div>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-gray-900">
                                            {notification.title || 'Judul Notifikasi'}
                                        </p>
                                        <p className="mt-1 text-sm text-gray-600">
                                            {notification.message || 'Pesan notifikasi akan muncul di sini...'}
                                        </p>
                                        {previewImage && (
                                            <img
                                                src={previewImage}
                                                alt="Preview"
                                                className="mt-2 h-24 max-w-full rounded object-cover"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
