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

    const existing = await prisma.phoneBrand.findFirst({
      where: {
        OR: [{ name: cleanName }, { slug: cleanSlug }],
      },
    });

    let brand;
    if (existing) {
      brand = await prisma.phoneBrand.update({
        where: { id: existing.id },
        data: {
          name: cleanName,
          country: country ? sanitizeString(country, 50) : existing.country,
          description: description || existing.description,
          logoUrl: logoUrl || existing.logoUrl,
          displayOrder: displayOrder !== undefined ? Number(displayOrder) : existing.displayOrder,
          isActive: true,
        },
      });
    } else {
      brand = await prisma.phoneBrand.create({
        data: {
          name: cleanName,
          slug: cleanSlug,
          country: country ? sanitizeString(country, 50) : null,
          description: description || null,
          logoUrl: logoUrl || null,
          displayOrder: Number(displayOrder) || 0,
          isActive: true,
        },
      });
    }

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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    let name = searchParams.get('name');

    if (!id && !name) {
      try {
        const body = await request.json();
        id = body.id;
        name = body.name;
      } catch (e) {
        // ignore parse error if no body
      }
    }

    if (!id && !name) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp ID hoặc Tên thương hiệu cần xóa' },
        { status: 400 }
      );
    }

    const cleanName = name ? sanitizeString(name, 50) : undefined;

    const target = await prisma.phoneBrand.findFirst({
      where: {
        OR: [
          id ? { id } : {},
          cleanName ? { name: cleanName } : {},
        ],
      },
    });

    if (!target) {
      return NextResponse.json(
        { error: 'Không tìm thấy thương hiệu cần xóa' },
        { status: 404 }
      );
    }

    await prisma.phoneBrand.delete({
      where: { id: target.id },
    });

    return NextResponse.json({
      success: true,
      message: `Đã xóa thương hiệu "${target.name}" thành công`,
      data: target,
    });
  } catch (error: any) {
    console.error('Phone brands DELETE error:', error);
    return NextResponse.json(
      { error: 'Lỗi xóa thương hiệu: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

