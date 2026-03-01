'use client';

import { useState } from 'react';
import { PAGE_SIZES, DEFAULT_PAGE_SIZE } from '@/lib/constants';

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
            const { jsPDF } = await import('jspdf');
            const config = PAGE_SIZES[pageSize];
            const pdf = new jsPDF({
                orientation: config.width > config.height ? 'landscape' : 'portrait',
                unit: 'mm',
                format: [config.width, config.height],
            });

            const pageW = config.width;
            const pageH = config.height;
            const margin = 7;  // ~20pt in PDF points → ~7mm
            const gap = 2;     // ~6pt in PDF points → ~2mm

            const usableW = pageW - margin * 2;
            const usableH = pageH - margin * 2;

            // White background (matches API)
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, pageW, pageH, 'F');

            // 3 images side by side — 9:16 portrait ratio, vertically centered
            const imgW = (usableW - gap * 2) / 3;
            const imgH_byW = imgW * (16 / 9);

            let imgH: number, finalW: number;
            if (imgH_byW > usableH) {
                imgH = usableH;
                finalW = imgH * (9 / 16);
            } else {
                imgH = imgH_byW;
                finalW = imgW;
            }

            const totalW = finalW * 3 + gap * 2;
            const startX = margin + (usableW - totalW) / 2;
            const topY = margin + (usableH - imgH) / 2;

            const r = 3; // rounded corner radius in mm (~8pt)

            const slots: FaceSlot[] = ['left', 'center', 'right'];

            slots.forEach((slot, i) => {
                const img = images[slot];
                if (!img) return;

                const x = startX + i * (finalW + gap);

                try {
                    // Draw rounded rectangle clip path
                    pdf.saveGraphicsState();
                    roundedRect(pdf, x, topY, finalW, imgH, r);
                    pdf.addImage(img, 'JPEG', x, topY, finalW, imgH);
                    pdf.restoreGraphicsState();
                } catch {
                    // skip failed images
                }
            });

            const timestamp = new Date().toISOString().slice(0, 10);
            pdf.save(`face-review-${timestamp}.pdf`);
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

function roundedRect(pdf: InstanceType<typeof import('jspdf').jsPDF>, x: number, y: number, w: number, h: number, r: number) {
    pdf.roundedRect(x, y, w, h, r, r, 'S');
}
