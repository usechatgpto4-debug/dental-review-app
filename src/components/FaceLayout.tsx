'use client';

import ImageSlot from './ImageSlot';
import type { SlotType } from '@/lib/constants';

type FaceSlot = 'left' | 'center' | 'right';

interface FaceLayoutProps {
    images: Record<FaceSlot, string | null>;
    onImageSet: (slotType: SlotType, imageDataUrl: string) => void;
    onImageRemove: (slotType: SlotType) => void;
}

export default function FaceLayout({ images, onImageSet, onImageRemove }: FaceLayoutProps) {
    return (
        <div className="face-layout">
            <ImageSlot slotType="left" image={images.left} onImageSet={onImageSet} onImageRemove={onImageRemove} />
            <ImageSlot slotType="center" image={images.center} onImageSet={onImageSet} onImageRemove={onImageRemove} />
            <ImageSlot slotType="right" image={images.right} onImageSet={onImageSet} onImageRemove={onImageRemove} />
        </div>
    );
}
