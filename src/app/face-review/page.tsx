'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import FaceLayout from '@/components/FaceLayout';
import FacePdfControls from '@/components/FacePdfControls';
import type { SlotType } from '@/lib/constants';

type FaceSlot = 'left' | 'center' | 'right';
type FaceImagesState = Record<FaceSlot, string | null>;

const initialImages: FaceImagesState = {
    left: null,
    center: null,
    right: null,
};

export default function FaceReviewPage() {
    const [images, setImages] = useState<FaceImagesState>(initialImages);

    const handleImageSet = useCallback((slotType: SlotType, imageDataUrl: string) => {
        if (slotType in initialImages) {
            setImages((prev) => ({ ...prev, [slotType]: imageDataUrl }));
        }
    }, []);

    const handleImageRemove = useCallback((slotType: SlotType) => {
        if (slotType in initialImages) {
            setImages((prev) => ({ ...prev, [slotType]: null }));
        }
    }, []);

    const handleClearAll = useCallback(() => {
        setImages(initialImages);
    }, []);

    const filledCount = Object.values(images).filter(Boolean).length;

    return (
        <main className="app">
            <header className="app-header">
                <div className="app-header__brand">
                    <div className="app-header__icon">😊</div>
                    <div>
                        <h1 className="app-header__title">Face Review Composer</h1>
                        <p className="app-header__subtitle">3-angle face review • Left · Front · Right</p>
                    </div>
                </div>
                <div className="app-header__actions">
                    <Link href="/" className="btn btn--sm btn--ghost">🦷 Dental Review</Link>
                    {filledCount > 0 && (
                        <button className="btn btn--sm btn--ghost" onClick={handleClearAll}>
                            🗑️ Clear All
                        </button>
                    )}
                </div>
            </header>

            <section className="composer">
                <FaceLayout
                    images={images}
                    onImageSet={handleImageSet}
                    onImageRemove={handleImageRemove}
                />
            </section>

            <section className="controls-section">
                <FacePdfControls images={images} />
            </section>

            <footer className="app-footer">
                <p>Drag & drop images or paste URLs • Supports Google Drive links</p>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <Link href="/" className="app-footer__link">🦷 Dental Review</Link>
                    <Link href="/api-guide" className="app-footer__link">📖 API Guide</Link>
                </div>
            </footer>
        </main>
    );
}
