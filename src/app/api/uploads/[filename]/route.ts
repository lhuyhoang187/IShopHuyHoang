import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

const EXT_TO_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await context.params;
    // Prevent directory traversal
    const baseName = path.basename(filename);
    if (!baseName || baseName !== filename || !/^[a-zA-Z0-9._-]+$/.test(baseName)) {
      return new NextResponse('Invalid filename', { status: 400 });
    }

    const ext = path.extname(baseName).toLowerCase();
    const contentType = EXT_TO_MIME[ext];
    if (!contentType) {
      return new NextResponse('Unsupported file type', { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'public', 'uploads', baseName);
    const buffer = await readFile(filePath);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse('Image not found', { status: 404 });
  }
}
