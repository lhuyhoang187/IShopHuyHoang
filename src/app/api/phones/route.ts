import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sanitizeString } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const DEFAULT_PHONE_IMAGE =
  'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80';

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

function normalizeColorsInput(rawColors: any) {
  const arr = Array.isArray(rawColors) ? rawColors : [];
  if (arr.length > 0) {
    return arr.map((c: any, idx: number) => ({
      id: c.id || `c-${idx + 1}`,
      name: sanitizeString(c.name || 'Đen Titan', 100),
      hex: sanitizeString(c.hex || '#2B2B2B', 30),
      imageUrl: c.imageUrl || DEFAULT_PHONE_IMAGE,
      stock: c.stock as number | undefined,
      isOutOfStock: Boolean(c.isOutOfStock),
    }));
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

function normalizeCapacitiesInput(rawCaps: any) {
  const arr = Array.isArray(rawCaps) ? rawCaps : [];
  if (arr.length > 0) {
    return arr.map((c: any) => {
      const price = c.price !== undefined && c.price !== null ? Math.max(0, Number(c.price) || 0) : 0;
      const orig = c.originalPrice !== undefined && c.originalPrice !== null && Number(c.originalPrice) > 0
        ? Number(c.originalPrice)
        : price;
      return {
        size: sanitizeString(c.size || '256GB', 50),
        price,
        originalPrice: orig,
        stock: c.stock as number | undefined,
        isOutOfStock: Boolean(c.isOutOfStock),
      };
    });
  }
  return [
    {
      size: '256GB',
      price: 0,
      originalPrice: 0,
      stock: undefined as number | undefined,
      isOutOfStock: false,
    },
  ];
}

export async function GET(request: NextRequest) {
  try {
    const phones = await db.query(
      `SELECT p.*, b.name AS brandName
       FROM phoneproduct p
       LEFT JOIN phonebrand b ON p.brandId = b.id
       ORDER BY p.createdAt DESC`
    );

    const allColors = await db.query(
      'SELECT * FROM phonecolor ORDER BY displayOrder ASC, createdAt ASC'
    );

    const allVariants = await db.query(
      `SELECT v.*, c.phoneId, c.name AS colorName, c.hex AS colorHex, c.imageUrl
       FROM phonevariant v
       INNER JOIN phonecolor c ON v.colorId = c.id
       ORDER BY v.price ASC`
    );

    const allStock = await db.query(
      'SELECT imei, phoneId, color, capacity, sellingPrice, status FROM phonestock'
    );

    const colorsByPhone: Record<string, any[]> = {};
    for (const c of allColors) {
      if (!colorsByPhone[c.phoneId]) colorsByPhone[c.phoneId] = [];
      colorsByPhone[c.phoneId].push(c);
    }

    const variantsByPhone: Record<string, any[]> = {};
    for (const v of allVariants) {
      if (!variantsByPhone[v.phoneId]) variantsByPhone[v.phoneId] = [];
      variantsByPhone[v.phoneId].push({
        id: v.id,
        phoneId: v.phoneId,
        colorId: v.colorId,
        colorName: v.colorName,
        colorHex: v.colorHex,
        imageUrl: v.imageUrl,
        capacity: v.capacity,
        price: Number(v.price || 0),
        originalPrice: v.originalPrice != null ? Number(v.originalPrice) : null,
        isOutOfStock: Boolean(v.isOutOfStock),
        updatedAt: v.updatedAt,
      });
    }

    const stockByPhone: Record<string, any[]> = {};
    for (const s of allStock) {
      if (!stockByPhone[s.phoneId]) stockByPhone[s.phoneId] = [];
      stockByPhone[s.phoneId].push(s);
    }

    const parsed = phones.map((p) => {
      const brand = p.brandName || 'Apple';
      const pColors = colorsByPhone[p.id] || [];
      const variants = variantsByPhone[p.id] || [];
      const pStock = stockByPhone[p.id] || [];
      const inStockItems = pStock.filter((s) => s.status === 'in_stock');
      const inStockCount = inStockItems.length;

      // Reconstruct unique capacities list from 3NF phonevariant table
      const capMap = new Map<string, { size: string; price: number; originalPrice: number; isOutOfStock: boolean }>();
      for (const v of variants) {
        const key = String(v.capacity || '256GB').trim();
        const existing = capMap.get(key);
        if (!existing) {
          capMap.set(key, {
            size: key,
            price: Number(v.price || 25990000),
            originalPrice: Number(v.originalPrice || Math.round(Number(v.price || 25990000) * 1.08)),
            isOutOfStock: Boolean(v.isOutOfStock),
          });
        } else if (!v.isOutOfStock) {
          existing.isOutOfStock = false;
        }
      }
      const capacities =
        capMap.size > 0
          ? Array.from(capMap.values())
          : [{ size: '256GB', price: 25990000, originalPrice: 27990000, isOutOfStock: false }];

      // Reconstruct colors list from 3NF phonecolor table
      const colors =
        pColors.length > 0
          ? pColors.map((c) => {
              const colVars = variants.filter((v) => v.colorId === c.id);
              const allOut = colVars.length > 0 && colVars.every((v) => v.isOutOfStock);
              return {
                id: c.id,
                name: c.name,
                hex: c.hex || '#2B2B2B',
                imageUrl: c.imageUrl || DEFAULT_PHONE_IMAGE,
                isOutOfStock: allOut,
              };
            })
          : [
              {
                id: 'c-default',
                name: 'Đen Titan',
                hex: '#2B2B2B',
                imageUrl: DEFAULT_PHONE_IMAGE,
                isOutOfStock: false,
              },
            ];

      const specs = normalizeSpecs(
        {
          screen: p.specScreen,
          chip: p.specChip,
          ram: p.specRam,
          storage: p.specStorage,
          rearCamera: p.specRearCamera,
          frontCamera: p.specFrontCamera,
          battery: p.specBattery,
          charging: p.specCharging,
          os: p.specOs,
          sim: p.specSim,
          waterResistant: p.specWaterResistant,
          weight: p.specWeight,
        },
        brand,
        capacities
      );

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
          const isOut = Boolean(matchedVar?.isOutOfStock || col.isOutOfStock || cap.isOutOfStock);

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
        brandId: p.brandId,
        brand,
        description: p.description || `Sản phẩm chính hãng ${brand}`,
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

    const normalizedCaps = normalizeCapacitiesInput(parsedCapsInput);
    const normalizedColors = normalizeColorsInput(parsedColorsInput);
    const normalizedSpecs = normalizeSpecs(parsedSpecsInput, cleanBrand, normalizedCaps);

    const brandSlug = cleanBrand
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // Resolve or create PhoneBrand (FK target)
    let brandRow = await db.queryOne('SELECT id FROM phonebrand WHERE name = ? OR slug = ?', [cleanBrand, brandSlug]);
    let brandId = brandRow?.id;
    if (!brandId) {
      brandId = 'brand_' + Date.now();
      await db.execute(
        `INSERT INTO phonebrand (id, name, slug, displayOrder, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, 99, 1, NOW(), NOW())`,
        [brandId, cleanBrand, brandSlug]
      );
    }

    const existing = await db.queryOne('SELECT id FROM phoneproduct WHERE id = ? OR slug = ?', [phoneId, cleanSlug]);
    const targetId = existing?.id || phoneId;

    await db.transaction(async (conn) => {
      if (existing) {
        await conn.execute(
          `UPDATE phoneproduct SET
             name = ?, brandId = ?, description = ?,
             specScreen = ?, specChip = ?, specRam = ?, specStorage = ?,
             specRearCamera = ?, specFrontCamera = ?, specBattery = ?, specCharging = ?,
             specOs = ?, specSim = ?, specWaterResistant = ?, specWeight = ?,
             warrantyInfo = ?, updatedAt = NOW()
           WHERE id = ?`,
          [
            cleanName,
            brandId,
            description || `Sản phẩm chính hãng ${cleanBrand}`,
            normalizedSpecs.screen,
            normalizedSpecs.chip,
            normalizedSpecs.ram,
            normalizedSpecs.storage,
            normalizedSpecs.rearCamera,
            normalizedSpecs.frontCamera,
            normalizedSpecs.battery,
            normalizedSpecs.charging,
            normalizedSpecs.os,
            normalizedSpecs.sim,
            normalizedSpecs.waterResistant,
            normalizedSpecs.weight,
            warrantyInfo || 'Bảo hành 12 tháng chính hãng.',
            targetId,
          ]
        );
      } else {
        await conn.execute(
          `INSERT INTO phoneproduct
           (id, name, slug, brandId, description, rating, reviewCount, isHot, isNew,
            specScreen, specChip, specRam, specStorage, specRearCamera, specFrontCamera,
            specBattery, specCharging, specOs, specSim, specWaterResistant, specWeight,
            warrantyInfo, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            targetId,
            cleanName,
            cleanSlug,
            brandId,
            description || `Sản phẩm chính hãng ${cleanBrand}`,
            Number(rating) || 5.0,
            Number(reviewCount) || 1,
            isHot ? 1 : 0,
            isNew !== undefined ? (isNew ? 1 : 0) : 1,
            normalizedSpecs.screen,
            normalizedSpecs.chip,
            normalizedSpecs.ram,
            normalizedSpecs.storage,
            normalizedSpecs.rearCamera,
            normalizedSpecs.frontCamera,
            normalizedSpecs.battery,
            normalizedSpecs.charging,
            normalizedSpecs.os,
            normalizedSpecs.sim,
            normalizedSpecs.waterResistant,
            normalizedSpecs.weight,
            warrantyInfo || 'Bảo hành 12 tháng chính hãng.',
          ]
        );
      }

      // Upsert 3NF PhoneColor rows
      const activeColorIds: string[] = [];
      for (let idx = 0; idx < normalizedColors.length; idx++) {
        const col = normalizedColors[idx];
        const [exCols]: any = await conn.query(
          'SELECT id FROM phonecolor WHERE phoneId = ? AND name = ?',
          [targetId, col.name]
        );
        let colorId = exCols[0]?.id;
        if (colorId) {
          await conn.execute(
            `UPDATE phonecolor SET hex = ?, imageUrl = ?, displayOrder = ?, updatedAt = NOW() WHERE id = ?`,
            [col.hex, col.imageUrl, idx, colorId]
          );
        } else {
          colorId = 'pc_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
          await conn.execute(
            `INSERT INTO phonecolor (id, phoneId, name, hex, imageUrl, displayOrder, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [colorId, targetId, col.name, col.hex, col.imageUrl, idx]
          );
        }
        activeColorIds.push(colorId);

        // Upsert 3NF PhoneVariant rows for each capacity under this color
        for (const cap of normalizedCaps) {
          const capSize = cap.size || '256GB';
          const capPrice = Number(cap.price) || 0;
          const isOut = col.isOutOfStock || cap.isOutOfStock || col.stock === 0 || cap.stock === 0 ? 1 : 0;

          const [exVars]: any = await conn.query(
            'SELECT id FROM phonevariant WHERE colorId = ? AND capacity = ?',
            [colorId, capSize]
          );
          if (exVars[0]?.id) {
            await conn.execute(
              `UPDATE phonevariant SET price = ?, originalPrice = ?, isOutOfStock = ?, updatedAt = NOW() WHERE id = ?`,
              [capPrice, cap.originalPrice ? Number(cap.originalPrice) : capPrice, isOut, exVars[0].id]
            );
          } else {
            const varId = 'var_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
            await conn.execute(
              `INSERT INTO phonevariant (id, colorId, capacity, price, originalPrice, isOutOfStock, createdAt, updatedAt)
               VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [varId, colorId, capSize, capPrice, cap.originalPrice ? Number(cap.originalPrice) : capPrice, isOut]
            );
          }
        }
      }

      // Remove deleted colors (and their cascaded variants) from MySQL 3NF phonecolor table
      if (activeColorIds.length > 0) {
        const placeholders = activeColorIds.map(() => '?').join(',');
        await conn.execute(
          `DELETE FROM phonecolor WHERE phoneId = ? AND id NOT IN (${placeholders})`,
          [targetId, ...activeColorIds]
        );
      }

      // Sync in_stock PhoneStock sellingPrice per capacity
      for (const cap of normalizedCaps) {
        await conn.execute(
          `UPDATE phonestock SET sellingPrice = ?, updatedAt = NOW()
           WHERE phoneId = ? AND capacity = ? AND status = 'in_stock'`,
          [Number(cap.price) || 20000000, targetId, cap.size || '256GB']
        );
      }
    });

    const product = await db.queryOne(
      `SELECT p.*, b.name AS brand FROM phoneproduct p LEFT JOIN phonebrand b ON p.brandId = b.id WHERE p.id = ?`,
      [targetId]
    );

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

    await db.transaction(async (conn) => {
      if (id) {
        await conn.execute('DELETE FROM phonestock WHERE phoneId = ?', [id]);
        await conn.execute('DELETE FROM phoneproduct WHERE id = ?', [id]);
      } else if (brand) {
        const [targetPhones]: any = await conn.query(
          `SELECT p.id FROM phoneproduct p INNER JOIN phonebrand b ON p.brandId = b.id WHERE b.name = ?`,
          [brand]
        );
        for (const p of targetPhones) {
          await conn.execute('DELETE FROM phonestock WHERE phoneId = ?', [p.id]);
          await conn.execute('DELETE FROM phoneproduct WHERE id = ?', [p.id]);
        }
      }
    });

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
