'use client';

import { useState } from 'react';
import { PAGE_SIZES } from '@/lib/constants';

type FaceSlot = 'left' | 'center' | 'right';

interface FacePdfControlsProps {
    images: Record<FaceSlot, string | null>;
}

export default function FacePdfControls({ images }: FacePdfControlsProps) {
    const [pageSize, setPageSize] = useState('a4-landscape');
    const [isGenerating, setIsGenerating] = useState(false);

    const filledSlots = Object.values(images).filter(Boolean).length;
    const canGenerate = filledSlots >= 1;

    async function generatePdf() {
        if (!canGenerate) return;
        setIsGenerating(true);

        try {
            // Build payload matching the webhook-face API format
            const payload: Record<string, string> = { pageSize };
            const slots: FaceSlot[] = ['left', 'center', 'right'];
            for (const slot of slots) {
                if (images[slot]) {
                    payload[slot] = images[slot]!;
                }
            }

            const res = await fetch('/api/webhook-face', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('PDF generation failed');

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            if (isMobile) {
                // Mobile: open in browser's PDF viewer (supports save/share)
                window.open(url, '_blank');
            } else {
                // Desktop: direct download
                const a = document.createElement('a');
                a.href = url;
                const timestamp = new Date().toISOString().slice(0, 10);
                a.download = `face-review-${timestamp}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('PDF generation failed:', error);
        } finally {
            setIsGenerating(false);
        }
    }

    return (
        <div className="pdf-controls">
            <div className="pdf-controls__options">
                <div className="pdf-controls__field">
                    <label htmlFor="pageSize">Page Size</label>
                    <select
                        id="pageSize"
                        value={pageSize}
                        onChange={(e) => setPageSize(e.target.value)}
                    >
                        {Object.entries(PAGE_SIZES).map(([key, size]) => (
                            <option key={key} value={key}>{size.label}</option>
                        ))}
                    </select>
                </div>

                <div className="pdf-controls__info">
                    <span className="pdf-controls__count">
                        {filledSlots}/3 images loaded
                    </span>
                </div>
            </div>

            <button
                className={`btn btn--lg btn--primary ${isGenerating ? 'btn--loading' : ''}`}
                onClick={generatePdf}
                disabled={!canGenerate || isGenerating}
            >
                {isGenerating ? (
                    <>
                        <span className="spinner spinner--sm" />
                        Generating...
                    </>
                ) : (
                    <>📄 Generate PDF</>
                )}
            </button>
        </div>
    );
}
