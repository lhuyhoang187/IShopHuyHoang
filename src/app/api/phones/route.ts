import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sanitizeString } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const DEFAULT_PHONE_IMAGE = 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80';

function normalizeSpecs(rawSpecs: any, brand = 'Apple', capacities: any[] = []) {
  const s = typeof rawSpecs === 'object' && rawSpecs !== null ? rawSpecs : {};
  const isApple = String(brand).toLowerCase() === 'apple';
  const capLabel =
    Array.isArray(capacities) && capacities.length > 0
      ? capacities.map((c: any) => c.size).join(' / ')
      : '256GB / 512GB';

  return {
    screen: s.screen || '6.7 inch OLED Super Retina, 120Hz',
    chip: s.chip || (isApple ? 'Apple A20 Pro 6 nhân (2nm)' : 'Snapdragon 8 Gen 3 (4nm)'),
    ram: s.ram || '12 GB LPDDR5X',
    storage: s.storage || capLabel,
    rearCamera: s.rearCamera || 'Chính 48MP + Siêu rộng 48MP + Tele 5x',
    frontCamera: s.frontCamera || '12MP Auto-Focus',
    battery: s.battery || '5.000 mAh',
    charging: s.charging || 'Sạc nhanh 45W, Không dây 25W',
    os: s.os || (isApple ? 'iOS 20 Apple Intelligence' : 'Android 15'),
    sim: s.sim || '1 Nano SIM + 1 eSIM',
    waterResistant: s.waterResistant || 'IP68',
    weight: s.weight || '215 g',
  };
}

function normalizeColors(rawColors: any, variants: any[] = []) {
  const arr = Array.isArray(rawColors) ? rawColors : [];
  if (arr.length > 0) {
    return arr.map((c: any, idx: number) => ({
      id: c.id || `c-${idx + 1}`,
      name: c.name || 'Đen Titan',
      hex: c.hex || '#2B2B2B',
      imageUrl: c.imageUrl || DEFAULT_PHONE_IMAGE,
      stock: c.stock,
      isOutOfStock: c.isOutOfStock,
    }));
  }
  if (Array.isArray(variants) && variants.length > 0) {
    const seen = new Set<string>();
    const fromVar: any[] = [];
    variants.forEach((v: any, idx: number) => {
      const cName = v.colorName || 'Đen Titan';
      if (!seen.has(cName)) {
        seen.add(cName);
        fromVar.push({
          id: `c-${idx + 1}`,
          name: cName,
          hex: v.colorHex || '#2B2B2B',
          imageUrl: v.imageUrl || DEFAULT_PHONE_IMAGE,
          stock: undefined as number | undefined,
          isOutOfStock: Boolean(v.isOutOfStock),
        });
      }
    });
    if (fromVar.length > 0) return fromVar;
  }
  return [
    {
      id: 'c-default',
      name: 'Đen Titan',
      hex: '#2B2B2B',
      imageUrl: DEFAULT_PHONE_IMAGE,
      stock: undefined as number | undefined,
      isOutOfStock: false,
    },
  ];
}

function normalizeCapacities(rawCaps: any) {
  const arr = Array.isArray(rawCaps) ? rawCaps : [];
  if (arr.length > 0) {
    return arr.map((c: any) => {
      const price = Number(c.price) || 25990000;
      return {
        size: c.size || '256GB',
        price,
        originalPrice: Number(c.originalPrice) || Math.round(price * 1.08),
        stock: c.stock as number | undefined,
        isOutOfStock: Boolean(c.isOutOfStock),
      };
    });
  }
  return [
    {
      size: '256GB',
      price: 25990000,
      originalPrice: 27990000,
      stock: undefined as number | undefined,
      isOutOfStock: false,
    },
  ];
}

export async function GET(request: NextRequest) {
  try {
    const phones = await db.query('SELECT * FROM phoneproduct ORDER BY createdAt DESC');
    const allStock = await db.query('SELECT imei, phoneId, color, capacity, sellingPrice, status FROM phonestock');
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
      let rawColors = [];
      let rawCapacities = [];
      let rawSpecs = {};

      try {
        rawColors = typeof p.colors === 'string' ? JSON.parse(p.colors) : p.colors || [];
      } catch (e) {
        rawColors = [];
      }

      try {
        rawCapacities = typeof p.capacities === 'string' ? JSON.parse(p.capacities) : p.capacities || [];
      } catch (e) {
        rawCapacities = [];
      }

      try {
        rawSpecs = typeof p.specs === 'string' ? JSON.parse(p.specs) : p.specs || {};
      } catch (e) {
        rawSpecs = {};
      }

      const pStock = stockByPhone[p.id] || [];
      const inStockItems = pStock.filter((s) => s.status === 'in_stock');
      const inStockCount = inStockItems.length;
      const variants = variantsByPhone[p.id] || [];
      const pUpdatedTime = p.updatedAt ? new Date(p.updatedAt).getTime() : 0;

      const capacities = normalizeCapacities(rawCapacities).map((cap) => {
        const capNorm = String(cap.size).toLowerCase().replace(/\s+/g, '');
        const matchingVar = variants.find(
          (v) => String(v.capacity || '').toLowerCase().replace(/\s+/g, '') === capNorm
        );
        const varUpdatedTime = matchingVar?.updatedAt ? new Date(matchingVar.updatedAt).getTime() : 0;
        const useVarPrice = matchingVar && varUpdatedTime > pUpdatedTime && Number(matchingVar.price) > 0;

        return {
          ...cap,
          price: useVarPrice ? Number(matchingVar.price) : cap.price,
          originalPrice:
            useVarPrice && Number(matchingVar.originalPrice) > 0
              ? Number(matchingVar.originalPrice)
              : cap.originalPrice,
        };
      });

      const colors = normalizeColors(rawColors, variants);
      const specs = normalizeSpecs(rawSpecs, p.brand, capacities);

      const variantStocks: Record<string, { stock: number; isOutOfStock?: boolean }> = {};
      colors.forEach((col: any) => {
        capacities.forEach((cap: any) => {
          const key = `${col.name}_${cap.size}`;
          const colNorm = String(col.name).toLowerCase().trim();
          const capNorm = String(cap.size).toLowerCase().replace(/\s+/g, '');
          const matchedInStock = inStockItems.filter((s) => {
            const sc = String(s.color || '').toLowerCase().trim();
            const scap = String(s.capacity || '').toLowerCase().replace(/\s+/g, '');
            return (sc === colNorm || sc.includes(colNorm) || colNorm.includes(sc)) && scap === capNorm;
          }).length;

          const matchedVar = variants.find(
            (v) =>
              String(v.colorName || '').toLowerCase().trim() === colNorm &&
              String(v.capacity || '').toLowerCase().replace(/\s+/g, '') === capNorm
          );
          const isOut = Boolean(
            col.isOutOfStock ||
              cap.isOutOfStock ||
              matchedVar?.isOutOfStock ||
              col.stock === 0 ||
              cap.stock === 0
          );

          if (matchedInStock > 0 || isOut || matchedVar) {
            variantStocks[key] = {
              stock: isOut ? 0 : matchedInStock,
              isOutOfStock: isOut,
            };
          }
        });
      });

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        brand: p.brand,
        description: p.description || `Sản phẩm chính hãng ${p.brand}`,
        rating: Number(p.rating || 5.0),
        reviewCount: Number(p.reviewCount || 0),
        isHot: Boolean(p.isHot),
        isNew: Boolean(p.isNew),
        colors,
        capacities,
        variants,
        variantStocks,
        specs,
        warrantyInfo: p.warrantyInfo || 'Bảo hành 12 tháng chính hãng.',
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
    const parsedColorsInput = typeof colors === 'string' ? JSON.parse(colors) : colors;
    const parsedCapsInput = typeof capacities === 'string' ? JSON.parse(capacities) : capacities;
    const parsedSpecsInput = typeof specs === 'string' ? JSON.parse(specs) : specs;

    const normalizedCaps = normalizeCapacities(parsedCapsInput);
    const normalizedColors = normalizeColors(parsedColorsInput);
    const normalizedSpecs = normalizeSpecs(parsedSpecsInput, cleanBrand, normalizedCaps);

    const colorsStr = JSON.stringify(normalizedColors);
    const capacitiesStr = JSON.stringify(normalizedCaps);
    const specsStr = JSON.stringify(normalizedSpecs);

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

    // Upsert 3NF PhoneVariants & sync in_stock PhoneStock sellingPrice
    try {
      for (const cap of normalizedCaps) {
        const capacitySize = cap.size || '256GB';
        const capPrice = Number(cap.price) || 20000000;
        await db.execute(
          `UPDATE phonestock SET sellingPrice = ?, updatedAt = NOW()
           WHERE phoneId = ? AND capacity = ? AND status = 'in_stock'`,
          [capPrice, targetId, capacitySize]
        );

        for (const col of normalizedColors) {
          const colorName = col.name || 'Đen Titan';
          const existingVariant = await db.queryOne(
            'SELECT id FROM phonevariant WHERE phoneId = ? AND colorName = ? AND capacity = ?',
            [targetId, colorName, capacitySize]
          );

          const isOut = col.isOutOfStock || cap.isOutOfStock || col.stock === 0 || cap.stock === 0 ? 1 : 0;

          if (existingVariant) {
            await db.execute(
              `UPDATE phonevariant SET 
                 price = ?, originalPrice = ?, colorHex = ?, imageUrl = ?, isOutOfStock = ?, updatedAt = NOW()
               WHERE id = ?`,
              [
                capPrice,
                cap.originalPrice ? Number(cap.originalPrice) : null,
                col.hex || '#2B2B2B',
                col.imageUrl || DEFAULT_PHONE_IMAGE,
                isOut,
                existingVariant.id,
              ]
            );
          } else {
            const varId = 'var_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
            await db.execute(
              `INSERT INTO phonevariant 
               (id, phoneId, colorName, colorHex, imageUrl, capacity, price, originalPrice, isOutOfStock, createdAt, updatedAt)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [
                varId,
                targetId,
                colorName,
                col.hex || '#2B2B2B',
                col.imageUrl || DEFAULT_PHONE_IMAGE,
                capacitySize,
                capPrice,
                cap.originalPrice ? Number(cap.originalPrice) : null,
                isOut,
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id')?.trim();
    const brand = searchParams.get('brand')?.trim();

    if (!id && !brand) {
      return NextResponse.json({ error: 'Vui lòng cung cấp ID hoặc Tên hãng cần xóa' }, { status: 400 });
    }

    if (id) {
      await db.execute('DELETE FROM phonevariant WHERE phoneId = ?', [id]);
      await db.execute('DELETE FROM phonestock WHERE phoneId = ?', [id]);
      await db.execute('DELETE FROM phoneproduct WHERE id = ?', [id]);
    } else if (brand) {
      const targetPhones = await db.query('SELECT id FROM phoneproduct WHERE brand = ?', [brand]);
      for (const p of targetPhones) {
        await db.execute('DELETE FROM phonevariant WHERE phoneId = ?', [p.id]);
        await db.execute('DELETE FROM phonestock WHERE phoneId = ?', [p.id]);
      }
      await db.execute('DELETE FROM phoneproduct WHERE brand = ?', [brand]);
    }

    return NextResponse.json({
      success: true,
      message: 'Đã xóa sản phẩm điện thoại thành công',
    });
  } catch (error: any) {
    console.error('API /api/phones DELETE error:', error);
    return NextResponse.json(
      { error: 'Lỗi xóa sản phẩm điện thoại: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
