import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sanitizeString } from '@/lib/validation';

export async function GET() {
  try {
    const brands = await prisma.phoneBrand.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: brands,
    });
  } catch (error: any) {
    console.error('Phone brands GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi tải danh mục thương hiệu: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, country, description, logoUrl, displayOrder } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Tên thương hiệu không được để trống' }, { status: 400 });
    }

    const cleanName = sanitizeString(name, 50);
    const cleanSlug = sanitizeString(
      slug ||
        cleanName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, ''),
      50
    );

    const brand = await prisma.phoneBrand.upsert({
      where: { slug: cleanSlug },
      update: {
        name: cleanName,
        country: country ? sanitizeString(country, 50) : null,
        description: description || null,
        logoUrl: logoUrl || null,
        displayOrder: Number(displayOrder) || 0,
        isActive: true,
      },
      create: {
        name: cleanName,
        slug: cleanSlug,
        country: country ? sanitizeString(country, 50) : null,
        description: description || null,
        logoUrl: logoUrl || null,
        displayOrder: Number(displayOrder) || 0,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Đã lưu thương hiệu thành công',
      data: brand,
    });
  } catch (error: any) {
    console.error('Phone brands POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi lưu thương hiệu: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

