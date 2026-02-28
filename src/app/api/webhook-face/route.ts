import { NextRequest, NextResponse } from 'next/server';
import { processImageForSlot } from '@/lib/image-processor';
import { isGoogleDriveUrl, fetchGoogleDriveImage } from '@/lib/gdrive-utils';
import PDFDocument from 'pdfkit';

interface FacePayload {
    left?: string;
    center?: string;
    right?: string;
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

type FaceSlot = 'left' | 'center' | 'right';

export async function POST(request: NextRequest) {
    try {
        const payload: FacePayload = await request.json();
        const pageConfig = PAGE_CONFIGS[payload.pageSize || 'a4-landscape'];

        const slots: FaceSlot[] = ['left', 'center', 'right'];
        const processedImages: Partial<Record<FaceSlot, Buffer>> = {};

        for (const slot of slots) {
            const input = payload[slot];
            if (!input || typeof input !== 'string') continue;

            const buffer = await resolveImage(input);
            // All 3 face images get the same 2:3 portrait ratio and white bg padding
            processedImages[slot] = await processImageForSlot(buffer, 'center', {
                bgColor: { r: 255, g: 255, b: 255 },
                width: 400,
                height: 600,
            });
        }

        const pdfBuffer = await generateFacePdf(processedImages, pageConfig);

        return new NextResponse(new Uint8Array(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="face-review-${Date.now()}.pdf"`,
                'Content-Length': pdfBuffer.length.toString(),
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Face review processing failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

async function generateFacePdf(
    images: Partial<Record<FaceSlot, Buffer>>,
    page: { width: number; height: number }
): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: [page.width, page.height],
            margin: 0,
            info: {
                Title: 'Face Review',
                Author: 'Dental Review Composer',
            },
        });

        const chunks: Uint8Array[] = [];
        doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const margin = 20;
        const gap = 6;
        const usableW = page.width - margin * 2;
        const usableH = page.height - margin * 2;

        // White background
        doc.rect(0, 0, page.width, page.height).fill('#ffffff');

        // 3 images side by side — 2:3 portrait ratio, vertically centered
        const imgW = (usableW - gap * 2) / 3;
        const imgH = imgW * (3 / 2); // 2:3 ratio
        const topY = margin + (usableH - imgH) / 2;

        const slots: FaceSlot[] = ['left', 'center', 'right'];

        slots.forEach((slot, i) => {
            const img = images[slot];
            if (!img) return;

            const x = margin + i * (imgW + gap);

            try {
                doc.save();
                // Rounded corner clip
                const r = 8;
                doc.moveTo(x + r, topY)
                    .lineTo(x + imgW - r, topY)
                    .quadraticCurveTo(x + imgW, topY, x + imgW, topY + r)
                    .lineTo(x + imgW, topY + imgH - r)
                    .quadraticCurveTo(x + imgW, topY + imgH, x + imgW - r, topY + imgH)
                    .lineTo(x + r, topY + imgH)
                    .quadraticCurveTo(x, topY + imgH, x, topY + imgH - r)
                    .lineTo(x, topY + r)
                    .quadraticCurveTo(x, topY, x + r, topY)
                    .clip();

                doc.image(img, x, topY, { width: imgW, height: imgH });
                doc.restore();
            } catch {
                // skip failed images
            }
        });

        doc.end();
    });
}
