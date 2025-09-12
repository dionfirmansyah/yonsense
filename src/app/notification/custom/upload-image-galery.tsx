'use client';

import { db } from '@/lib/db';
import { id } from '@instantdb/react';
import { Image as ImageIcon, Upload } from 'lucide-react';
import { useState } from 'react';

interface UploadImageGalleryProps {
    onSelect: (imageUrl: string) => void; // callback ke parent (form notif)
}

export default function UploadImageGallery({ onSelect }: UploadImageGalleryProps) {
    const [isUploading, setIsUploading] = useState(false);

    const { data } = db.useQuery({
        image_push_notifications: {
            image: {},
        },
    });

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setIsUploading(true);

        try {
            const imageId = id();

            await db.transact(
                db.tx.image_push_notifications[imageId].create({
                    createdAt: new Date().toDateString(),
                }),
            );

            const { data: fileData } = await db.storage.uploadFile(file.name, file);

            await db.transact(
                db.tx.image_push_notifications[imageId].link({
                    image: fileData.id,
                }),
            );
        } catch (err) {
            console.error('Upload error:', err);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Upload button */}
            <div>
                <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-400 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                    <Upload className="h-4 w-4" />
                    {isUploading ? 'Uploading...' : 'Upload Image'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                </label>
            </div>

            {/* Gallery */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {data?.image_push_notifications.map((file) => {
                    const imageUrl = file.image?.url; // bisa undefined

                    if (!imageUrl) return null; // kalau undefined, skip aja

                    return (
                        <div
                            key={file.id}
                            className="group relative cursor-pointer overflow-hidden rounded-lg border"
                            onClick={() => onSelect(imageUrl)}
                        >
                            {/* Pakai next/image lebih baik */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={imageUrl}
                                alt="Push Notification Image"
                                className="h-28 w-full object-cover transition group-hover:opacity-80"
                            />
                            <div className="absolute right-1 bottom-1 left-1 flex items-center justify-between rounded bg-black/60 px-1 py-0.5 text-[10px] text-white">
                                <span className="truncate">{imageUrl}</span>
                                <ImageIcon className="h-3 w-3" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
