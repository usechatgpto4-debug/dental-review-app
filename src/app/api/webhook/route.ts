import { NextRequest, NextResponse } from 'next/server';
import { processImageForSlot } from '@/lib/image-processor';
import { isGoogleDriveUrl, fetchGoogleDriveImage } from '@/lib/gdrive-utils';
import type { SlotType } from '@/lib/constants';
import { SLOT_ORDER } from '@/lib/constants';
import PDFDocument from 'pdfkit';

interface WebhookPayload {
    top?: string;
    center?: string;
    left?: string;
    right?: string;
    bottom?: string;
    pageSize?: 'a4-portrait' | 'a4-landscape' | 'letter-portrait' | 'letter-landscape';
}

const PAGE_CONFIGS = {
    'a4-portrait': { width: 595.28, height: 841.89 },
    'a4-landscape': { width: 841.89, height: 595.28 },
    'letter-portrait': { width: 612, height: 792 },
    'letter-landscape': { width: 792, height: 612 },
} as const;

async function resolveImage(input: string): Promise<Buffer> {
    if (input.startsWith('data:')) {
        const clean = input.replace(/^data:image\/\w+;base64,/, '');
        return Buffer.from(clean, 'base64');
    }

    if (isGoogleDriveUrl(input)) {
        return fetchGoogleDriveImage(input);
    }

    const res = await fetch(input, { redirect: 'follow' });
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
}

export async function POST(request: NextRequest) {
    try {
        const payload: WebhookPayload = await request.json();
        const pageConfig = PAGE_CONFIGS[payload.pageSize || 'a4-portrait'];

        // Process all images
        const processedImages: Partial<Record<SlotType, Buffer>> = {};

        for (const slot of SLOT_ORDER) {
            const input = payload[slot as keyof WebhookPayload] as string | undefined;
            if (!input || typeof input !== 'string') continue;

            const buffer = await resolveImage(input);
            processedImages[slot] = await processImageForSlot(buffer, slot);
        }

        // Generate PDF
        const pdfBuffer = await generatePdf(processedImages, pageConfig);

        return new NextResponse(new Uint8Array(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="dental-review-${Date.now()}.pdf"`,
                'Content-Length': pdfBuffer.length.toString(),
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Webhook processing failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

async function generatePdf(
    images: Partial<Record<SlotType, Buffer>>,
    page: { width: number; height: number }
): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: [page.width, page.height],
            margin: 0,
            info: {
                Title: 'Dental Review',
                Author: 'Dental Review Composer',
            },
        });

        const chunks: Uint8Array[] = [];
        doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const margin = 16;
        const gap = 4;
        const usableW = page.width - margin * 2;
        const usableH = page.height - margin * 2;

        // Dark background
        doc.rect(0, 0, page.width, page.height).fill('#ffffff');

        // Cross layout — tighter proportions
        const topH = usableH * 0.22;
        const midH = usableH * 0.48;
        const botH = usableH * 0.22;

        const centerW = usableW * 0.44;
        const sideW = (usableW - centerW - gap * 2) / 2;

        const topY = margin;
        const midY = margin + topH + gap;
        const botY = midY + midH + gap;
        const centerX = margin + sideW + gap;
        const rightX = centerX + centerW + gap;

        // Draw images at exact dimensions (Sharp already cropped to fit)
        const drawSlot = (slot: SlotType, x: number, y: number, w: number, h: number) => {
            const img = images[slot];
            if (!img) return;

            try {
                doc.save();
                // Rounded corner clip
                const r = 6;
                doc.moveTo(x + r, y)
                    .lineTo(x + w - r, y)
                    .quadraticCurveTo(x + w, y, x + w, y + r)
                    .lineTo(x + w, y + h - r)
                    .quadraticCurveTo(x + w, y + h, x + w - r, y + h)
                    .lineTo(x + r, y + h)
                    .quadraticCurveTo(x, y + h, x, y + h - r)
                    .lineTo(x, y + r)
                    .quadraticCurveTo(x, y, x + r, y)
                    .clip();

                doc.image(img, x, y, { width: w, height: h });
                doc.restore();
            } catch {
                // skip failed images
            }
        };

        // Top (centered)
        drawSlot('top', centerX, topY, centerW, topH);

        // Middle row
        drawSlot('left', margin, midY, sideW, midH);
        drawSlot('center', centerX, midY, centerW, midH);
        drawSlot('right', rightX, midY, sideW, midH);

        // Bottom (centered)
        drawSlot('bottom', centerX, botY, centerW, botH);

        doc.end();
    });
}
