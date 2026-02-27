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

            // Calculate layout dimensions
            const usableW = pageW - margin * 2;
            const usableH = pageH - margin * 2;

            // Cross layout proportions
            // Middle row = 3 slots (left, center, right), top & bottom row = 1 slot each
            // Heights: top ~25%, middle ~45%, bottom ~25%, gaps ~5%
            const topH = usableH * 0.24;
            const midH = usableH * 0.44;
            const botH = usableH * 0.24;

            const centerW = usableW * 0.42;
            const sideW = (usableW - centerW - gap * 2) / 2;

            const topY = margin;
            const midY = margin + topH + gap;
            const botY = midY + midH + gap;

            const centerX = margin + sideW + gap;

            // background
            pdf.setFillColor(15, 15, 20);
            pdf.rect(0, 0, pageW, pageH, 'F');

            // Draw images with rounded corners simulation
            const drawImage = (img: string | null, x: number, y: number, w: number, h: number) => {
                if (!img) return;
                try {
                    pdf.addImage(img, 'JPEG', x, y, w, h);
                } catch {
                    // skip if image fails
                }
            };

            // Top (centered)
            drawImage(images.top, centerX, topY, centerW, topH);

            // Middle row
            drawImage(images.left, margin, midY, sideW, midH);
            drawImage(images.center, centerX, midY, centerW, midH);
            drawImage(images.right, centerX + centerW + gap, midY, sideW, midH);

            // Bottom (centered)
            drawImage(images.bottom, centerX, botY, centerW, botH);

            // Add subtle border to each image
            pdf.setDrawColor(50, 50, 60);
            pdf.setLineWidth(0.3);
            if (images.top) pdf.rect(centerX, topY, centerW, topH);
            if (images.left) pdf.rect(margin, midY, sideW, midH);
            if (images.center) pdf.rect(centerX, midY, centerW, midH);
            if (images.right) pdf.rect(centerX + centerW + gap, midY, sideW, midH);
            if (images.bottom) pdf.rect(centerX, botY, centerW, botH);

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
