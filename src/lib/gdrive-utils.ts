/**
 * Extract Google Drive file ID from various URL formats:
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 * - Direct file ID string
 */
export function extractDriveFileId(input: string): string | null {
    if (!input) return null;

    const patterns = [
        /\/file\/d\/([a-zA-Z0-9_-]+)/,
        /[?&]id=([a-zA-Z0-9_-]+)/,
        /\/d\/([a-zA-Z0-9_-]+)/,
    ];

    for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match) return match[1];
    }

    if (/^[a-zA-Z0-9_-]{20,}$/.test(input)) {
        return input;
    }

    return null;
}

export function isGoogleDriveUrl(url: string): boolean {
    return url.includes('drive.google.com') || url.includes('docs.google.com');
}

export function getDirectDownloadUrl(fileId: string): string {
    return `https://lh3.googleusercontent.com/d/${fileId}=s2048`;
}

/**
 * Fetches an image from Google Drive using multiple strategies:
 * 1. Google Drive API direct media export (most reliable)
 * 2. Fallback: lh3.googleusercontent.com thumbnail (large size)
 * 3. Fallback: uc?export=download with cookie handling
 */
export async function fetchGoogleDriveImage(input: string): Promise<Buffer> {
    const fileId = extractDriveFileId(input);
    if (!fileId) throw new Error('Invalid Google Drive URL or file ID');

    // Strategy 1: Use lh3 thumbnail URL (works for public images, no size limit issues)
    const strategies = [
        `https://lh3.googleusercontent.com/d/${fileId}=s2048`,
        `https://drive.google.com/uc?export=download&id=${fileId}`,
        `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`,
    ];

    let lastError: Error | null = null;

    for (const url of strategies) {
        try {
            const response = await fetch(url, {
                redirect: 'follow',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
            });

            if (!response.ok) continue;

            const contentType = response.headers.get('content-type') || '';

            // If we got HTML back, it's a confirmation page — skip
            if (contentType.includes('text/html')) continue;

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Verify it's actually image data (not HTML)
            if (buffer.length < 1000 || isHtml(buffer)) continue;

            return buffer;
        } catch (err) {
            lastError = err instanceof Error ? err : new Error('Unknown error');
        }
    }

    throw lastError || new Error('Failed to download image from Google Drive. Make sure the file is publicly shared.');
}

function isHtml(buffer: Buffer): boolean {
    const head = buffer.subarray(0, 100).toString('utf-8').toLowerCase();
    return head.includes('<!doctype') || head.includes('<html');
}
