import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sanitizeString } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const phones = await prisma.phoneProduct.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        phoneStocks: true,
        variants: true,
      },
    });

    const parsed = phones.map((p) => {
      let colors = [];
      let capacities = [];
      let specs = {};

      try {
        colors = typeof p.colors === 'string' ? JSON.parse(p.colors) : p.colors || [];
      } catch (e) {
        colors = [];
      }

      try {
        capacities = typeof p.capacities === 'string' ? JSON.parse(p.capacities) : p.capacities || [];
      } catch (e) {
        capacities = [];
      }

      try {
        specs = typeof p.specs === 'string' ? JSON.parse(p.specs) : p.specs || {};
      } catch (e) {
        specs = {};
      }

      // If variants exist in 3NF table, ensure capacities/colors can be computed
      const variants = p.variants || [];

      // Calculate in_stock units from physical stock
      const inStockUnits = (p.phoneStocks || []).filter((s) => s.status === 'in_stock');
      const inStockCount = inStockUnits.length;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        brand: p.brand,
        description: p.description,
        rating: p.rating,
        reviewCount: p.reviewCount,
        isHot: p.isHot,
        isNew: p.isNew,
        colors,
        capacities,
        variants,
        specs,
        warrantyInfo: p.warrantyInfo,
        inStockCount,
        totalStock: (p.phoneStocks || []).length,
      };
    });

    return NextResponse.json({
      success: true,
      total: parsed.length,
      data: parsed,
    });
  } catch (error: any) {
    console.error('API /api/phones GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi truy vấn danh sách điện thoại: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      slug,
      brand,
      description,
      rating,
      reviewCount,
      isHot,
      isNew,
      colors,
      capacities,
      specs,
      warrantyInfo,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Tên điện thoại không được để trống' }, { status: 400 });
    }
    if (!brand || !brand.trim()) {
      return NextResponse.json({ error: 'Thương hiệu không được để trống' }, { status: 400 });
    }

    const cleanName = sanitizeString(name, 191);
    const cleanBrand = sanitizeString(brand, 50);
    const cleanSlug = sanitizeString(
      slug ||
        `${cleanBrand}-${cleanName}`
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, ''),
      191
    );

    const phoneId = id ? sanitizeString(id, 50) : `p-${Date.now()}`;
    const colorsStr = typeof colors === 'string' ? colors : JSON.stringify(colors || []);
    const capacitiesStr = typeof capacities === 'string' ? capacities : JSON.stringify(capacities || []);
    const specsStr = typeof specs === 'string' ? specs : JSON.stringify(specs || {});

    // Ensure PhoneBrand exists in database
    const brandSlug = cleanBrand
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const existingBrand = await prisma.phoneBrand.findFirst({
      where: {
        OR: [{ name: cleanBrand }, { slug: brandSlug }],
      },
    });

    if (!existingBrand) {
      try {
        await prisma.phoneBrand.create({
          data: {
            name: cleanBrand,
            slug: brandSlug,
            displayOrder: 99,
            isActive: true,
          },
        });
      } catch (e) {
        console.warn('Auto create PhoneBrand error:', e);
      }
    }

    const existing = await prisma.phoneProduct.findFirst({
      where: {
        OR: [{ id: phoneId }, { slug: cleanSlug }],
      },
    });

    let product;
    if (existing) {
      product = await prisma.phoneProduct.update({
        where: { id: existing.id },
        data: {
          name: cleanName,
          brand: cleanBrand,
          description: description || existing.description,
          colors: colorsStr,
          capacities: capacitiesStr,
          specs: specsStr,
          warrantyInfo: warrantyInfo || existing.warrantyInfo,
        },
      });
    } else {
      product = await prisma.phoneProduct.create({
        data: {
          id: phoneId,
          name: cleanName,
          slug: cleanSlug,
          brand: cleanBrand,
          description: description || `Sản phẩm chính hãng ${cleanBrand}`,
          rating: Number(rating) || 5.0,
          reviewCount: Number(reviewCount) || 1,
          isHot: Boolean(isHot),
          isNew: isNew !== undefined ? Boolean(isNew) : true,
          colors: colorsStr,
          capacities: capacitiesStr,
          specs: specsStr,
          warrantyInfo: warrantyInfo || 'Bảo hành 12 tháng chính hãng.',
        },
      });
    }

    // Upsert 3NF PhoneVariants
    try {
      const parsedColors = typeof colors === 'string' ? JSON.parse(colors) : colors || [{ name: 'Mặc định', hex: '#333333' }];
      const parsedCaps = typeof capacities === 'string' ? JSON.parse(capacities) : capacities || [{ size: '128GB', price: 20000000 }];

      for (const cap of parsedCaps) {
        for (const col of parsedColors) {
          const colorName = col.name || 'Mặc định';
          const capacitySize = cap.size || '128GB';
          const existingVariant = await prisma.phoneVariant.findFirst({
            where: {
              phoneId: product.id,
              colorName,
              capacity: capacitySize,
            },
          });
          if (existingVariant) {
            await prisma.phoneVariant.update({
              where: { id: existingVariant.id },
              data: {
                price: Number(cap.price) || 20000000,
                originalPrice: cap.originalPrice ? Number(cap.originalPrice) : null,
                colorHex: col.hex || '#333333',
                imageUrl: col.imageUrl || null,
              },
            });
          } else {
            await prisma.phoneVariant.create({
              data: {
                phoneId: product.id,
                colorName,
                colorHex: col.hex || '#333333',
                imageUrl: col.imageUrl || null,
                capacity: capacitySize,
                price: Number(cap.price) || 20000000,
                originalPrice: cap.originalPrice ? Number(cap.originalPrice) : null,
                isOutOfStock: false,
              },
            });
          }
        }
      }
    } catch (variantErr) {
      console.warn('PhoneVariant sync error:', variantErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Đã lưu sản phẩm điện thoại thành công',
      data: product,
    });
  } catch (error: any) {
    console.error('API /api/phones POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi lưu sản phẩm: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
