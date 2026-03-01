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
            // Use the constraining axis so grid never overflows
            const usableW = pageW - margin * 2;
            const usableH = pageH - margin * 2;

            // Try width-first: 3 columns across
            const slotW_byW = (usableW - gap * 2) / 3;
            const slotH_byW = slotW_byW * (3 / 4);
            const totalH_byW = slotH_byW * 3 + gap * 2;

            // If height overflows, constrain by height instead
            let slotW: number, slotH: number;
            if (totalH_byW > usableH) {
                slotH = (usableH - gap * 2) / 3;
                slotW = slotH * (4 / 3);
            } else {
                slotW = slotW_byW;
                slotH = slotH_byW;
            }

            // Center the grid on the page
            const totalGridW = slotW * 3 + gap * 2;
            const totalGridH = slotH * 3 + gap * 2;
            const offsetX = margin + (usableW - totalGridW) / 2;
            const offsetY = margin + (usableH - totalGridH) / 2;

            const col0X = offsetX;
            const col1X = offsetX + slotW + gap;
            const col2X = offsetX + (slotW + gap) * 2;

            const row0Y = offsetY;
            const row1Y = offsetY + slotH + gap;
            const row2Y = offsetY + (slotH + gap) * 2;

            // White background (matches API)
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, pageW, pageH, 'F');

            // Rounded corner radius in mm (~6pt)
            const r = 2;

            // Draw images with rounded corner clip (matches API)
            const drawImage = (img: string | null, x: number, y: number, w: number, h: number) => {
                if (!img) return;
                try {
                    pdf.saveGraphicsState();
                    pdf.roundedRect(x, y, w, h, r, r, 'S');
                    pdf.addImage(img, 'JPEG', x, y, w, h);
                    pdf.restoreGraphicsState();
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

            // Borders are now drawn as rounded rects inside drawImage

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
