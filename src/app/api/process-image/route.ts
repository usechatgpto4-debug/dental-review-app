import { NextRequest, NextResponse } from 'next/server';
import { processImageForSlot } from '@/lib/image-processor';
import { isGoogleDriveUrl, fetchGoogleDriveImage } from '@/lib/gdrive-utils';
import type { SlotType } from '@/lib/constants';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const slotType = formData.get('slotType') as SlotType;
        const layout = formData.get('layout') as string | null;

        if (!slotType) {
            return NextResponse.json({ error: 'slotType is required' }, { status: 400 });
        }

        let imageBuffer: Buffer;

        const file = formData.get('file') as File | null;
        const url = formData.get('url') as string | null;
        const base64 = formData.get('base64') as string | null;

        if (file) {
            const arrayBuffer = await file.arrayBuffer();
            imageBuffer = Buffer.from(arrayBuffer);
        } else if (url) {
            if (isGoogleDriveUrl(url)) {
                imageBuffer = await fetchGoogleDriveImage(url);
            } else {
                const res = await fetch(url, { redirect: 'follow' });
                if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
                const ab = await res.arrayBuffer();
                imageBuffer = Buffer.from(ab);
            }
        } else if (base64) {
            const clean = base64.replace(/^data:image\/\w+;base64,/, '');
            imageBuffer = Buffer.from(clean, 'base64');
        } else {
            return NextResponse.json(
                { error: 'Provide file, url, or base64' },
                { status: 400 }
            );
        }

        // Face layout uses 9:16 portrait ratio, stretched to fill
        const options = layout === 'face'
            ? { width: 360, height: 640, bgColor: { r: 255, g: 255, b: 255 }, fit: 'fill' as const }
            : undefined;

        const processed = await processImageForSlot(imageBuffer, slotType, options);
        const resultBase64 = `data:image/jpeg;base64,${processed.toString('base64')}`;

        return NextResponse.json({ image: resultBase64 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Processing failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
