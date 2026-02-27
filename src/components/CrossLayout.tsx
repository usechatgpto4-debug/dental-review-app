'use client';

import ImageSlot from './ImageSlot';
import type { SlotType } from '@/lib/constants';

interface CrossLayoutProps {
    images: Record<SlotType, string | null>;
    onImageSet: (slotType: SlotType, imageDataUrl: string) => void;
    onImageRemove: (slotType: SlotType) => void;
}

export default function CrossLayout({ images, onImageSet, onImageRemove }: CrossLayoutProps) {
    return (
        <div className="cross-layout">
            <div className="cross-layout__row cross-layout__row--top">
                <ImageSlot slotType="top" image={images.top} onImageSet={onImageSet} onImageRemove={onImageRemove} />
            </div>
            <div className="cross-layout__row cross-layout__row--middle">
                <ImageSlot slotType="left" image={images.left} onImageSet={onImageSet} onImageRemove={onImageRemove} />
                <ImageSlot slotType="center" image={images.center} onImageSet={onImageSet} onImageRemove={onImageRemove} />
                <ImageSlot slotType="right" image={images.right} onImageSet={onImageSet} onImageRemove={onImageRemove} />
            </div>
            <div className="cross-layout__row cross-layout__row--bottom">
                <ImageSlot slotType="bottom" image={images.bottom} onImageSet={onImageSet} onImageRemove={onImageRemove} />
            </div>
        </div>
    );
}
