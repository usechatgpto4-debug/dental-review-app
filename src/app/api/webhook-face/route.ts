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
    'a3-portrait': { width: 841.89, height: 1190.55 },
    'a3-landscape': { width: 1190.55, height: 841.89 },
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
            // All 3 face images get the same 9:16 portrait ratio, stretched to fill
            processedImages[slot] = await processImageForSlot(buffer, 'center', {
                bgColor: { r: 255, g: 255, b: 255 },
                width: 360,
                height: 640,
                fit: 'fill',
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

        // 3 images side by side — 9:16 portrait ratio, vertically centered
        const imgW = (usableW - gap * 2) / 3;
        const imgH_byW = imgW * (16 / 9); // 9:16 ratio

        // Constrain by height if needed
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

        const slots: FaceSlot[] = ['left', 'center', 'right'];

        slots.forEach((slot, i) => {
            const img = images[slot];
            if (!img) return;

            const x = startX + i * (finalW + gap);

            try {
                doc.save();
                // Rounded corner clip
                const r = 8;
                doc.moveTo(x + r, topY)
                    .lineTo(x + finalW - r, topY)
                    .quadraticCurveTo(x + finalW, topY, x + finalW, topY + r)
                    .lineTo(x + finalW, topY + imgH - r)
                    .quadraticCurveTo(x + finalW, topY + imgH, x + finalW - r, topY + imgH)
                    .lineTo(x + r, topY + imgH)
                    .quadraticCurveTo(x, topY + imgH, x, topY + imgH - r)
                    .lineTo(x, topY + r)
                    .quadraticCurveTo(x, topY, x + r, topY)
                    .clip();

                doc.image(img, x, topY, { width: finalW, height: imgH });
                doc.restore();
            } catch {
                // skip failed images
            }
        });

        doc.end();
    });
}
