'use client';

import { useState, useCallback } from 'react';
import CrossLayout from '@/components/CrossLayout';
import PdfControls from '@/components/PdfControls';
import type { SlotType } from '@/lib/constants';

type ImagesState = Record<SlotType, string | null>;

const initialImages: ImagesState = {
  top: null,
  center: null,
  left: null,
  right: null,
  bottom: null,
};

export default function Home() {
  const [images, setImages] = useState<ImagesState>(initialImages);

  const handleImageSet = useCallback((slotType: SlotType, imageDataUrl: string) => {
    setImages((prev) => ({ ...prev, [slotType]: imageDataUrl }));
  }, []);

  const handleImageRemove = useCallback((slotType: SlotType) => {
    setImages((prev) => ({ ...prev, [slotType]: null }));
  }, []);

  const handleClearAll = useCallback(() => {
    setImages(initialImages);
  }, []);

  const filledCount = Object.values(images).filter(Boolean).length;

  return (
    <main className="app">
      <header className="app-header">
        <div className="app-header__brand">
          <div className="app-header__icon">🦷</div>
          <div>
            <h1 className="app-header__title">Dental Review Composer</h1>
            <p className="app-header__subtitle">Create professional dental review images</p>
          </div>
        </div>
        <div className="app-header__actions">
          <a href="/face-review" className="btn btn--sm btn--outline">😊 Face Review</a>
          {filledCount > 0 && (
            <button className="btn btn--sm btn--ghost" onClick={handleClearAll}>
              🗑️ Clear All
            </button>
          )}
        </div>
      </header>

      <section className="composer">
        <CrossLayout
          images={images}
          onImageSet={handleImageSet}
          onImageRemove={handleImageRemove}
        />
      </section>

      <section className="controls-section">
        <PdfControls images={images} />
      </section>

      <footer className="app-footer">
        <p>Drag & drop images or paste URLs • Supports Google Drive links</p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <a href="/face-review" className="app-footer__link">😊 Face Review</a>
          <a href="/api-guide" className="app-footer__link">📖 API Guide</a>
        </div>
      </footer>
    </main>
  );
}
