'use client';

import { useState } from 'react';
import { PAGE_SIZES, DEFAULT_PAGE_SIZE } from '@/lib/constants';
import type { SlotType } from '@/lib/constants';

interface PdfControlsProps {
    images: Record<SlotType, string | null>;
}

export default function PdfControls({ images }: PdfControlsProps) {
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [isGenerating, setIsGenerating] = useState(false);

    const filledSlots = Object.values(images).filter(Boolean).length;
    const canGenerate = filledSlots >= 1;

    async function generatePdf() {
        if (!canGenerate) return;
        setIsGenerating(true);

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        // iOS Safari: must open window BEFORE async operations (user gesture context)
        let pdfWindow: Window | null = null;
        if (isMobile) {
            pdfWindow = window.open('', '_blank');
            if (pdfWindow) {
                pdfWindow.document.write('<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#f5f5f5;margin:0"><p style="font-size:18px;color:#333">⏳ Generating PDF...</p></body></html>');
            }
        }

        try {
            const payload: Record<string, string> = { pageSize };
            const slots: SlotType[] = ['top', 'left', 'center', 'right', 'bottom'];
            for (const slot of slots) {
                if (images[slot]) {
                    payload[slot] = images[slot]!;
                }
            }

            const res = await fetch('/api/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('PDF generation failed');

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);

            if (isMobile && pdfWindow) {
                pdfWindow.location.href = url;
            } else {
                const a = document.createElement('a');
                a.href = url;
                const timestamp = new Date().toISOString().slice(0, 10);
                a.download = `dental-review-${timestamp}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('PDF generation failed:', error);
            if (pdfWindow) pdfWindow.close();
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
                        {filledSlots}/5 images loaded
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
