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

        try {
            const { jsPDF } = await import('jspdf');
            const config = PAGE_SIZES[pageSize];
            const pdf = new jsPDF({
                orientation: config.width > config.height ? 'landscape' : 'portrait',
                unit: 'mm',
                format: [config.width, config.height],
            });

            const pageW = config.width;
            const pageH = config.height;
            const margin = 8;
            const gap = 3;

            // Calculate layout dimensions — all 5 slots equal 4:3
            const usableW = pageW - margin * 2;
            const usableH = pageH - margin * 2;

            // Each slot is 4:3 ratio. Fit 3 columns across.
            const slotW = (usableW - gap * 2) / 3;
            const slotH = slotW * (3 / 4); // 4:3 ratio

            // Total height = 3 rows + 2 gaps
            const totalGridH = slotH * 3 + gap * 2;
            const offsetY = margin + (usableH - totalGridH) / 2;

            const col0X = margin;
            const col1X = margin + slotW + gap;
            const col2X = margin + (slotW + gap) * 2;

            const row0Y = offsetY;
            const row1Y = offsetY + slotH + gap;
            const row2Y = offsetY + (slotH + gap) * 2;

            // background
            pdf.setFillColor(15, 15, 20);
            pdf.rect(0, 0, pageW, pageH, 'F');

            // Draw images
            const drawImage = (img: string | null, x: number, y: number, w: number, h: number) => {
                if (!img) return;
                try {
                    pdf.addImage(img, 'JPEG', x, y, w, h);
                } catch {
                    // skip if image fails
                }
            };

            // Top (center column, row 0)
            drawImage(images.top, col1X, row0Y, slotW, slotH);

            // Middle row (all 3 columns, row 1)
            drawImage(images.left, col0X, row1Y, slotW, slotH);
            drawImage(images.center, col1X, row1Y, slotW, slotH);
            drawImage(images.right, col2X, row1Y, slotW, slotH);

            // Bottom (center column, row 2)
            drawImage(images.bottom, col1X, row2Y, slotW, slotH);

            // Add subtle border to each image
            pdf.setDrawColor(50, 50, 60);
            pdf.setLineWidth(0.3);
            if (images.top) pdf.rect(col1X, row0Y, slotW, slotH);
            if (images.left) pdf.rect(col0X, row1Y, slotW, slotH);
            if (images.center) pdf.rect(col1X, row1Y, slotW, slotH);
            if (images.right) pdf.rect(col2X, row1Y, slotW, slotH);
            if (images.bottom) pdf.rect(col1X, row2Y, slotW, slotH);

            const timestamp = new Date().toISOString().slice(0, 10);
            pdf.save(`dental-review-${timestamp}.pdf`);
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
