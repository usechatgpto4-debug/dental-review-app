import sharp from 'sharp';
import type { SlotType } from './constants';
import { SLOT_CONFIGS } from './constants';

const PDF_SCALE = 2; // 2x for crisp PDF output

interface ProcessOptions {
    bgColor?: { r: number; g: number; b: number };
    width?: number;
    height?: number;
    fit?: 'contain' | 'cover' | 'fill';
}

export async function processImageForSlot(
    imageBuffer: Buffer,
    slotType: SlotType,
    options?: ProcessOptions
): Promise<Buffer> {
    const config = SLOT_CONFIGS[slotType];
    const targetWidth = (options?.width ?? config.width) * PDF_SCALE;
    const targetHeight = (options?.height ?? config.height) * PDF_SCALE;
    const bg = options?.bgColor ?? { r: 255, g: 255, b: 255 };
    const fitMode = options?.fit ?? 'contain';

    // Normalize any exotic format (HEIF, WebP, AVIF) → PNG first
    let normalizedBuffer: Buffer;
    try {
        normalizedBuffer = await sharp(imageBuffer)
            .toFormat('png')
            .toBuffer();
    } catch {
        normalizedBuffer = imageBuffer;
    }

    return sharp(normalizedBuffer)
        .resize(targetWidth, targetHeight, {
            fit: fitMode,
            background: { ...bg, alpha: 1 },
        })
        .jpeg({ quality: 92 })
        .toBuffer();
}

export async function processImageFromBase64(
    base64: string,
    slotType: SlotType
): Promise<string> {
    const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const processed = await processImageForSlot(buffer, slotType);
    return `data:image/jpeg;base64,${processed.toString('base64')}`;
}

export async function processImageFromUrl(
    url: string,
    slotType: SlotType
): Promise<string> {
    const response = await fetch(url, { redirect: 'follow' });
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const processed = await processImageForSlot(buffer, slotType);
    return `data:image/jpeg;base64,${processed.toString('base64')}`;
}
