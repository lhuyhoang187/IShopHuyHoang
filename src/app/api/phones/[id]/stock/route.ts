import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const DEFAULT_PHONE_IMAGE =
  'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const phone = await db.queryOne(
      'SELECT * FROM phoneproduct WHERE id = ? OR slug = ?',
      [id, id]
    );

    if (!phone) {
      return NextResponse.json(
        { error: 'Không tìm thấy sản phẩm điện thoại' },
        { status: 404 }
      );
    }

    const dbColors = await db.query(
      'SELECT * FROM phonecolor WHERE phoneId = ? ORDER BY displayOrder ASC',
      [phone.id]
    );
    const dbVariants = await db.query(
      `SELECT v.*, c.name AS colorName, c.hex AS colorHex, c.imageUrl
       FROM phonevariant v
       INNER JOIN phonecolor c ON v.colorId = c.id
       WHERE c.phoneId = ?
       ORDER BY v.price ASC`,
      [phone.id]
    );

    const colors = dbColors.map((c) => {
      const colVars = dbVariants.filter((v) => v.colorId === c.id);
      return {
        id: c.id,
        name: c.name,
        hex: c.hex,
        imageUrl: c.imageUrl || '',
        isOutOfStock: colVars.length > 0 && colVars.every((v) => Boolean(v.isOutOfStock)),
      };
    });

    const capMap = new Map<string, any>();
    for (const v of dbVariants) {
      if (!capMap.has(v.capacity)) {
        capMap.set(v.capacity, {
          size: v.capacity,
          price: Number(v.price || 0),
          originalPrice: Number(v.originalPrice || v.price || 0),
          isOutOfStock: Boolean(v.isOutOfStock),
        });
      } else if (!v.isOutOfStock) {
        capMap.get(v.capacity).isOutOfStock = false;
      }
    }
    const capacities = Array.from(capMap.values());

    // Calculate actual IMEI stock per color and per capacity
    const inStockItems = await db.query(
      'SELECT color, capacity FROM phonestock WHERE phoneId = ? AND status = "in_stock"',
      [phone.id]
    );

    const colorStockCounts: Record<string, number> = {};
    const capacityStockCounts: Record<string, number> = {};
    const variantStockCounts: Record<string, number> = {};

    for (const item of inStockItems) {
      const c = (item.color || '').trim();
      const cap = (item.capacity || '').trim();
      colorStockCounts[c] = (colorStockCounts[c] || 0) + 1;
      capacityStockCounts[cap] = (capacityStockCounts[cap] || 0) + 1;
      const key = `${c}_${cap}`;
      variantStockCounts[key] = (variantStockCounts[key] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: phone.id,
        name: phone.name,
        slug: phone.slug,
        colors,
        capacities,
        colorStockCounts,
        capacityStockCounts,
        variantStockCounts,
        totalInStock: inStockItems.length,
      },
    });
  } catch (error: any) {
    console.error('Phone stock detail GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi truy vấn tồn kho sản phẩm: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { colors, capacities, variantStocks } = body;

    const phone = await db.queryOne(
      'SELECT * FROM phoneproduct WHERE id = ? OR slug = ?',
      [id, id]
    );

    if (!phone) {
      return NextResponse.json(
        { error: 'Không tìm thấy sản phẩm điện thoại' },
        { status: 404 }
      );
    }

    const firstSup = await db.queryOne('SELECT id FROM supplier LIMIT 1');
    const defaultSupplierId = firstSup?.id || null;

    await db.transaction(async (conn) => {
      await conn.execute('UPDATE phoneproduct SET updatedAt = NOW() WHERE id = ?', [phone.id]);

      // Ensure PhoneColor rows exist and sync
      const colorIdByName = new Map<string, string>();
      const [existingColors]: any = await conn.query('SELECT id, name FROM phonecolor WHERE phoneId = ?', [phone.id]);
      for (const ec of existingColors) {
        colorIdByName.set(String(ec.name).trim().toLowerCase(), ec.id);
      }

      if (Array.isArray(colors)) {
        for (let idx = 0; idx < colors.length; idx++) {
          const col = colors[idx];
          if (!col?.name) continue;
          const key = String(col.name).trim().toLowerCase();
          let cid = colorIdByName.get(key);
          if (!cid) {
            cid = 'pc_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
            await conn.execute(
              `INSERT INTO phonecolor (id, phoneId, name, hex, imageUrl, displayOrder, createdAt, updatedAt)
               VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [cid, phone.id, col.name.trim(), col.hex || '#2B2B2B', col.imageUrl || '', idx]
            );
            colorIdByName.set(key, cid);
          } else {
            await conn.execute(
              `UPDATE phonecolor SET hex = ?, imageUrl = ?, updatedAt = NOW() WHERE id = ?`,
              [col.hex || '#2B2B2B', col.imageUrl || '', cid]
            );
          }

          if (col.isOutOfStock || col.stock === 0) {
            await conn.execute(
              `UPDATE phonevariant SET isOutOfStock = 1, updatedAt = NOW() WHERE colorId = ?`,
              [cid]
            );
          }
        }
      }

      // Sync capacity pricing & stock status across phonevariant + phonestock
      if (Array.isArray(capacities)) {
        for (const cap of capacities) {
          if (cap.size && Number(cap.price) > 0) {
            for (const cid of colorIdByName.values()) {
              const [exVar]: any = await conn.query(
                'SELECT id FROM phonevariant WHERE colorId = ? AND capacity = ?',
                [cid, cap.size]
              );
              if (exVar[0]?.id) {
                await conn.execute(
                  `UPDATE phonevariant SET price = ?, originalPrice = ?, isOutOfStock = ?, updatedAt = NOW() WHERE id = ?`,
                  [
                    Number(cap.price),
                    cap.originalPrice ? Number(cap.originalPrice) : null,
                    cap.isOutOfStock || cap.stock === 0 ? 1 : 0,
                    exVar[0].id,
                  ]
                );
              } else {
                const varId = 'var_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
                await conn.execute(
                  `INSERT INTO phonevariant (id, colorId, capacity, price, originalPrice, isOutOfStock, createdAt, updatedAt)
                   VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                  [
                    varId,
                    cid,
                    cap.size,
                    Number(cap.price),
                    cap.originalPrice ? Number(cap.originalPrice) : null,
                    cap.isOutOfStock || cap.stock === 0 ? 1 : 0,
                  ]
                );
              }
            }

            await conn.execute(
              `UPDATE phonestock SET sellingPrice = ?, updatedAt = NOW()
               WHERE phoneId = ? AND capacity = ? AND status = 'in_stock'`,
              [Number(cap.price), phone.id, cap.size]
            );
          }
        }
      }

      if (variantStocks && typeof variantStocks === 'object') {
        for (const [key, conf] of Object.entries(variantStocks) as [string, any][]) {
          const [colorName, capSize] = key.split('_');
          if (!colorName || !capSize) continue;

          const cid = colorIdByName.get(colorName.trim().toLowerCase());
          if (cid) {
            await conn.execute(
              `UPDATE phonevariant SET isOutOfStock = ?, updatedAt = NOW()
               WHERE colorId = ? AND capacity = ?`,
              [conf.isOutOfStock || conf.stock === 0 ? 1 : 0, cid, capSize]
            );
          }

          const [currentStock]: any = await conn.query(
            `SELECT imei FROM phonestock
             WHERE phoneId = ? AND status = 'in_stock' AND color LIKE ? AND capacity LIKE ?`,
            [phone.id, `%${colorName}%`, `%${capSize}%`]
          );

          if (conf.isOutOfStock) {
            for (const item of currentStock) {
              await conn.execute(
                'UPDATE phonestock SET status = "reserved", updatedAt = NOW() WHERE imei = ?',
                [item.imei]
              );
            }
          } else if (typeof conf.stock === 'number') {
            const diff = conf.stock - currentStock.length;
            if (diff > 0) {
              const capObj = capacities?.find((c: any) => c.size === capSize);
              const sellPrice = capObj?.price || 30000000;
              const costPrice = Math.round(sellPrice * 0.85);

              for (let i = 0; i < diff; i++) {
                const imei = `35${Math.floor(1000000000000 + Math.random() * 9000000000000)}`;
                await conn.execute(
                  `INSERT INTO phonestock
                   (imei, phoneId, color, capacity, costPrice, sellingPrice, supplierId, importDate, status, warrantyMonths, createdAt, updatedAt)
                   VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), 'in_stock', 12, NOW(), NOW())`,
                  [imei, phone.id, colorName, capSize, costPrice, sellPrice, defaultSupplierId]
                );
              }
            } else if (diff < 0) {
              const toReserve = currentStock.slice(0, Math.abs(diff));
              for (const item of toReserve) {
                await conn.execute(
                  'UPDATE phonestock SET status = "reserved", updatedAt = NOW() WHERE imei = ?',
                  [item.imei]
                );
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Cập nhật tồn kho và trạng thái biến thể thành công!',
      data: {
        id: phone.id,
        name: phone.name,
        slug: phone.slug,
        colors: colors || [],
        capacities: capacities || [],
      },
    });
  } catch (error: any) {
    console.error('Phone stock update error:', error);
    return NextResponse.json(
      { error: 'Lỗi cập nhật tồn kho biến thể: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
