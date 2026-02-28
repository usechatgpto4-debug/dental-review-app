'use client';

import { useCallback, useRef, useState } from 'react';
import type { SlotType } from '@/lib/constants';
import { SLOT_CONFIGS } from '@/lib/constants';

interface ImageSlotProps {
    slotType: SlotType;
    image: string | null;
    layout?: 'dental' | 'face';
    onImageSet: (slotType: SlotType, imageDataUrl: string) => void;
    onImageRemove: (slotType: SlotType) => void;
}

export default function ImageSlot({ slotType, image, layout, onImageSet, onImageRemove }: ImageSlotProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [urlValue, setUrlValue] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const config = SLOT_CONFIGS[slotType];

    const processFile = useCallback(async (file: File) => {
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('slotType', slotType);
            if (layout) formData.append('layout', layout);

            const res = await fetch('/api/process-image', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.image) onImageSet(slotType, data.image);
        } catch {
            console.error('Failed to process image');
        } finally {
            setIsLoading(false);
        }
    }, [slotType, onImageSet]);

    const processUrl = useCallback(async () => {
        if (!urlValue.trim()) return;
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('url', urlValue.trim());
            formData.append('slotType', slotType);
            if (layout) formData.append('layout', layout);

            const res = await fetch('/api/process-image', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.image) {
                onImageSet(slotType, data.image);
                setUrlValue('');
                setShowUrlInput(false);
            }
        } catch {
            console.error('Failed to load image from URL');
        } finally {
            setIsLoading(false);
        }
    }, [urlValue, slotType, onImageSet]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file?.type.startsWith('image/')) processFile(file);
    }, [processFile]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    }, [processFile]);

    return (
        <div
            className={`image-slot image-slot--${slotType} ${isDragging ? 'image-slot--dragging' : ''} ${image ? 'image-slot--filled' : ''}`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
        >
            {isLoading && (
                <div className="image-slot__loader">
                    <div className="spinner" />
                    <span>Processing...</span>
                </div>
            )}

            {image ? (
                <div className="image-slot__preview">
                    <img src={image} alt={config.label} />
                    <button
                        className="image-slot__remove"
                        onClick={() => onImageRemove(slotType)}
                        title="Remove"
                    >
                        ✕
                    </button>
                </div>
            ) : !isLoading && (
                <div className="image-slot__empty">
                    <div className="image-slot__label">{config.labelTh}</div>
                    <div className="image-slot__sublabel">{config.label}</div>
                    <div className="image-slot__actions">
                        <button
                            className="btn btn--sm"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            📁 Upload
                        </button>
                        <button
                            className="btn btn--sm btn--outline"
                            onClick={() => setShowUrlInput(!showUrlInput)}
                        >
                            🔗 URL
                        </button>
                    </div>
                    {showUrlInput && (
                        <div className="image-slot__url-input">
                            <input
                                type="text"
                                placeholder="Paste image URL or Google Drive link..."
                                value={urlValue}
                                onChange={(e) => setUrlValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && processUrl()}
                            />
                            <button className="btn btn--sm btn--accent" onClick={processUrl}>
                                Go
                            </button>
                        </div>
                    )}
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />
        </div>
    );
}
