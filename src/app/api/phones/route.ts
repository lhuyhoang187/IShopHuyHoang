import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sanitizeString } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const phones = await db.query('SELECT * FROM phoneproduct ORDER BY createdAt DESC');
    const allStock = await db.query('SELECT imei, phoneId, status FROM phonestock');
    const allVariants = await db.query('SELECT * FROM phonevariant');

    const stockByPhone: Record<string, any[]> = {};
    for (const s of allStock) {
      if (!stockByPhone[s.phoneId]) stockByPhone[s.phoneId] = [];
      stockByPhone[s.phoneId].push(s);
    }

    const variantsByPhone: Record<string, any[]> = {};
    for (const v of allVariants) {
      if (!variantsByPhone[v.phoneId]) variantsByPhone[v.phoneId] = [];
      variantsByPhone[v.phoneId].push({
        ...v,
        isOutOfStock: Boolean(v.isOutOfStock),
      });
    }

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

      const pStock = stockByPhone[p.id] || [];
      const inStockCount = pStock.filter((s) => s.status === 'in_stock').length;
      const variants = variantsByPhone[p.id] || [];

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        brand: p.brand,
        description: p.description,
        rating: Number(p.rating || 5.0),
        reviewCount: Number(p.reviewCount || 0),
        isHot: Boolean(p.isHot),
        isNew: Boolean(p.isNew),
        colors,
        capacities,
        variants,
        specs,
        warrantyInfo: p.warrantyInfo,
        inStockCount,
        totalStock: pStock.length,
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

    const existingBrand = await db.queryOne('SELECT id FROM phonebrand WHERE name = ? OR slug = ?', [cleanBrand, brandSlug]);

    if (!existingBrand) {
      try {
        await db.execute(
          `INSERT INTO phonebrand (id, name, slug, displayOrder, isActive, createdAt, updatedAt)
           VALUES (?, ?, ?, 99, 1, NOW(), NOW())`,
          ['brand_' + Date.now(), cleanBrand, brandSlug]
        );
      } catch (e) {
        console.warn('Auto create PhoneBrand error:', e);
      }
    }

    const existing = await db.queryOne('SELECT id FROM phoneproduct WHERE id = ? OR slug = ?', [phoneId, cleanSlug]);

    let targetId = existing?.id || phoneId;
    if (existing) {
      await db.execute(
        `UPDATE phoneproduct SET 
           name = ?, brand = ?, description = ?, colors = ?, capacities = ?, specs = ?, warrantyInfo = ?, updatedAt = NOW()
         WHERE id = ?`,
        [
          cleanName,
          cleanBrand,
          description || 'Sản phẩm chính hãng ' + cleanBrand,
          colorsStr,
          capacitiesStr,
          specsStr,
          warrantyInfo || 'Bảo hành 12 tháng chính hãng.',
          targetId,
        ]
      );
    } else {
      await db.execute(
        `INSERT INTO phoneproduct 
         (id, name, slug, brand, description, rating, reviewCount, isHot, isNew, colors, capacities, specs, warrantyInfo, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          phoneId,
          cleanName,
          cleanSlug,
          cleanBrand,
          description || `Sản phẩm chính hãng ${cleanBrand}`,
          Number(rating) || 5.0,
          Number(reviewCount) || 1,
          isHot ? 1 : 0,
          isNew !== undefined ? (isNew ? 1 : 0) : 1,
          colorsStr,
          capacitiesStr,
          specsStr,
          warrantyInfo || 'Bảo hành 12 tháng chính hãng.',
        ]
      );
    }

    // Upsert 3NF PhoneVariants
    try {
      const parsedColors = typeof colors === 'string' ? JSON.parse(colors) : colors || [{ name: 'Mặc định', hex: '#333333' }];
      const parsedCaps = typeof capacities === 'string' ? JSON.parse(capacities) : capacities || [{ size: '128GB', price: 20000000 }];

      for (const cap of parsedCaps) {
        for (const col of parsedColors) {
          const colorName = col.name || 'Mặc định';
          const capacitySize = cap.size || '128GB';
          const existingVariant = await db.queryOne(
            'SELECT id FROM phonevariant WHERE phoneId = ? AND colorName = ? AND capacity = ?',
            [targetId, colorName, capacitySize]
          );

          if (existingVariant) {
            await db.execute(
              `UPDATE phonevariant SET 
                 price = ?, originalPrice = ?, colorHex = ?, imageUrl = ?, updatedAt = NOW()
               WHERE id = ?`,
              [
                Number(cap.price) || 20000000,
                cap.originalPrice ? Number(cap.originalPrice) : null,
                col.hex || '#333333',
                col.imageUrl || null,
                existingVariant.id,
              ]
            );
          } else {
            const varId = 'var_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
            await db.execute(
              `INSERT INTO phonevariant 
               (id, phoneId, colorName, colorHex, imageUrl, capacity, price, originalPrice, isOutOfStock, createdAt, updatedAt)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`,
              [
                varId,
                targetId,
                colorName,
                col.hex || '#333333',
                col.imageUrl || null,
                capacitySize,
                Number(cap.price) || 20000000,
                cap.originalPrice ? Number(cap.originalPrice) : null,
              ]
            );
          }
        }
      }
    } catch (variantErr) {
      console.warn('PhoneVariant sync error:', variantErr);
    }

    const product = await db.queryOne('SELECT * FROM phoneproduct WHERE id = ?', [targetId]);

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
