'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/db';
import { id } from '@instantdb/react';
import { AlertCircle, CheckIcon, Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';

interface UploadImageGalleryProps {
    userId?: string | undefined;
    onSelect: (imageUrl: string) => void; // callback ke parent (form notif)
    selectedImage?: string; // Optional: untuk sync dengan parent state
    maxFileSize?: number; // Optional: dalam MB, default 5MB
}

export default function UploadImageGallery({
    onSelect,
    userId,
    selectedImage,
    maxFileSize = 4,
}: UploadImageGalleryProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

    const { data, isLoading, error } = db.useQuery({
        image_push_notifications: {
            $: {
                where: {
                    userId: userId,
                },
                order: {
                    serverCreatedAt: 'desc',
                },
            },
            image: {},
        },
    });

    const validateFile = (file: File): string | null => {
        // Check file size
        if (file.size > maxFileSize * 1024 * 1024) {
            return `File size must be less than ${maxFileSize}MB`;
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
            return 'Please select a valid image file';
        }

        // Check specific image formats
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return 'Only JPEG, PNG, WebP and GIF files are allowed';
        }

        return null;
    };

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Clear previous errors
        setUploadError(null);

        // Validate file
        const validationError = validateFile(file);
        if (validationError) {
            setUploadError(validationError);
            event.target.value = ''; // Clear input
            return;
        }

        setIsUploading(true);

        try {
            const imageId = id();

            // Create the record first
            await db.transact(
                db.tx.image_push_notifications[imageId].create({
                    userId,
                    createdAt: new Date().toISOString(),
                }),
            );

            // Upload file
            const { data: fileData } = await db.storage.uploadFile(file.name, file);

            await db.transact(
                db.tx.image_push_notifications[imageId].link({
                    image: fileData.id,
                }),
            );

            autoSelectImage(imageId);
        } catch (err) {
            console.error('Upload error:', err);
            setUploadError(err instanceof Error ? err.message : 'Failed to upload image');
        } finally {
            setIsUploading(false);
            event.target.value = ''; // Clear input
        }
    };

    const handleDelete = async (imageId: string, imagePath?: string) => {
        if (!confirm(`Are you sure you want to delete "${imagePath || 'this image'}"?`)) {
            return;
        }

        try {
            await db.transact(db.tx.image_push_notifications[imageId].delete());

            if (selectedImageId === imageId) {
                setSelectedImageId(null);
            }
        } catch (err) {
            console.error('Delete error:', err);
            setUploadError(err instanceof Error ? err.message : 'Failed to delete image');
        }
    };

    const handleImageSelect = (imageUrl: string, imageId: string) => {
        setSelectedImageId(imageId);
        onSelect(imageUrl);
    };

    const autoSelectImage = (imageId: string) => {
        const image = data?.image_push_notifications?.find((image) => image.id === imageId);
        console.log('', data?.image_push_notifications);

        if (image) {
            onSelect(image.image?.url || '');
        }
    };

    // Loading state

    const loadingState = () => {
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="h-28 rounded-lg bg-gray-200"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Error state
    if (error) {
        return (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                <AlertCircle size={16} />
                <span className="text-sm">Failed to load images. Please try again.</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Gallery */}
            {isLoading ? (
                loadingState()
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {data?.image_push_notifications?.map((file) => {
                        const imageUrl = file.image?.url;
                        if (!imageUrl) return null;

                        const isSelected = selectedImageId === file.id || selectedImage === imageUrl;

                        return (
                            <div
                                key={file.id}
                                className={`group relative cursor-pointer overflow-hidden rounded-lg border-2 transition-all duration-200 hover:shadow-lg ${
                                    isSelected
                                        ? 'border-blue-500 shadow-md ring-2 ring-blue-500 ring-offset-2'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => handleImageSelect(imageUrl, file.id)}
                            >
                                {/* Selected Indicator */}
                                {isSelected && (
                                    <div className="absolute top-1 left-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm">
                                        <CheckIcon size={14} />
                                    </div>
                                )}

                                {/* Delete Button */}

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(file.id, file.image?.path);
                                    }}
                                    className="border-border absolute top-1 right-1 z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-white/95 text-red-500 shadow-sm transition-all duration-200 hover:bg-red-50 hover:text-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-1 focus:outline-none"
                                >
                                    <Trash2 size={12} />
                                </button>

                                {/* Image */}
                                <img
                                    src={imageUrl}
                                    alt={file.image?.path || 'Push notification image'}
                                    className={`h-28 w-full object-cover transition-all duration-200 ${
                                        isSelected ? 'opacity-90' : 'group-hover:opacity-80'
                                    }`}
                                    loading="lazy"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src =
                                            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgcnk9IjIiLz48Y2lyY2xlIGN4PSI5IiBjeT0iOSIgcj0iMiIvPjxwYXRoIGQ9Im0yMSAxNS01LTUtNSA1Ii8+PC9zdmc+';
                                        target.alt = 'Image failed to load';
                                    }}
                                />

                                {/* Image Info Overlay */}
                                <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2">
                                    <div className="flex items-center justify-between text-[10px] text-white">
                                        <span className="truncate pr-1 font-medium" title={file.image?.path}>
                                            {file.image?.path || 'Untitled'}
                                        </span>
                                        <ImageIcon className="h-3 w-3 flex-shrink-0 opacity-75" />
                                    </div>
                                </div>

                                {/* Upload Status Overlay */}
                                {isUploading && file.id === selectedImageId && (
                                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Empty State */}
                    {(!data?.image_push_notifications || data.image_push_notifications.length === 0) && !isLoading && (
                        <div className="col-span-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-12 text-gray-500">
                            <ImageIcon className="mb-3 h-12 w-12 opacity-50" />
                            <p className="mb-1 text-sm font-medium">No images uploaded yet</p>
                            <p className="text-xs text-gray-400">Upload your first image to get started</p>
                        </div>
                    )}
                </div>
            )}

            {/* Upload Section */}
            <div className="space-y-2">
                <div className="flex justify-center gap-3">
                    <label
                        className={`flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm transition-colors ${
                            isUploading
                                ? 'cursor-not-allowed border-gray-300 bg-gray-50 text-gray-400'
                                : 'border-gray-400 text-gray-600 hover:border-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        <Upload className="h-4 w-4" />
                        {isUploading ? 'Uploading...' : 'Upload Image'}
                        <Input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={handleUpload}
                            disabled={isUploading}
                        />
                    </label>
                    {selectedImageId && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSelectedImageId(null);
                                onSelect('');
                            }}
                        >
                            cancle
                        </Button>
                    )}
                </div>

                {/* Upload Error */}
                {uploadError && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                        <AlertCircle size={14} />
                        <span>{uploadError}</span>
                    </div>
                )}

                {/* Upload Info */}
                <p className="text-xs text-gray-500">Max file size: {maxFileSize}MB. Supports JPEG, PNG, WebP, GIF</p>
            </div>

            {/* Image Count Info */}
            {data?.image_push_notifications && data.image_push_notifications.length > 0 && (
                <div className="text-center text-xs text-gray-500">
                    {data.image_push_notifications.length} image{data.image_push_notifications.length !== 1 ? 's' : ''}{' '}
                    uploaded
                </div>
            )}
        </div>
    );
}
