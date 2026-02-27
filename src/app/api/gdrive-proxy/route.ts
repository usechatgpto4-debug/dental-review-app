import { NextRequest, NextResponse } from 'next/server';
import { extractDriveFileId, getDirectDownloadUrl } from '@/lib/gdrive-utils';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const driveUrl = searchParams.get('url');
        const fileId = searchParams.get('id');

        let resolvedId: string | null = null;

        if (fileId) {
            resolvedId = fileId;
        } else if (driveUrl) {
            resolvedId = extractDriveFileId(driveUrl);
        }

        if (!resolvedId) {
            return NextResponse.json(
                { error: 'Provide a valid Google Drive url or file id' },
                { status: 400 }
            );
        }

        const downloadUrl = getDirectDownloadUrl(resolvedId);
        const response = await fetch(downloadUrl, { redirect: 'follow' });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Google Drive fetch failed: ${response.statusText}` },
                { status: 502 }
            );
        }

        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const arrayBuffer = await response.arrayBuffer();

        return new NextResponse(arrayBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=3600',
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Proxy failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
