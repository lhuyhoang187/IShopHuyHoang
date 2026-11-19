import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

const MAX_BYTES = 15 * 1024 * 1024; // 15MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng chọn tập tin ảnh cần tải lên!' },
        { status: 400 }
      );
    }

    const ext = ALLOWED_MIME[file.type];
    if (!ext) {
      return NextResponse.json(
        { success: false, error: 'Định dạng ảnh không hỗ trợ. Vui lòng chọn JPG, PNG, WebP hoặc GIF!' },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { success: false, error: 'Dung lượng ảnh vượt quá 15MB. Vui lòng chọn ảnh nhỏ hơn!' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const safeName = `img-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const fullPath = path.join(uploadDir, safeName);
    await writeFile(fullPath, buffer);

    return NextResponse.json({
      success: true,
      url: `/api/uploads/${safeName}`,
      filename: safeName,
    });
  } catch (error: any) {
    console.error('Upload image error:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi tải ảnh lên máy chủ: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
