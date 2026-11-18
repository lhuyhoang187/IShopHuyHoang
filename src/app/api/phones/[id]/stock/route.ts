import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

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

    const colors = phone.colors ? JSON.parse(phone.colors) : [];
    const capacities = phone.capacities ? JSON.parse(phone.capacities) : [];

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

    const setClauses: string[] = ['updatedAt = NOW()'];
    const sqlParams: any[] = [];

    if (colors && Array.isArray(colors)) {
      setClauses.push('colors = ?');
      sqlParams.push(JSON.stringify(colors));
    }
    if (capacities && Array.isArray(capacities)) {
      setClauses.push('capacities = ?');
      sqlParams.push(JSON.stringify(capacities));
    }

    sqlParams.push(phone.id);

    // Atomic transaction: Update PhoneProduct + sync PhoneStock in MySQL
    await db.transaction(async (conn) => {
      await conn.execute(
        `UPDATE phoneproduct SET ${setClauses.join(', ')} WHERE id = ?`,
        sqlParams
      );

      // Synchronize PhoneVariant & PhoneStock items if variantStocks or capacities/colors are specified
      if (Array.isArray(capacities)) {
        for (const cap of capacities) {
          if (cap.size && Number(cap.price) > 0) {
            await conn.execute(
              `UPDATE phonevariant SET price = ?, originalPrice = ?, isOutOfStock = ?, updatedAt = NOW()
               WHERE phoneId = ? AND capacity = ?`,
              [
                Number(cap.price),
                cap.originalPrice ? Number(cap.originalPrice) : null,
                cap.isOutOfStock || cap.stock === 0 ? 1 : 0,
                phone.id,
                cap.size,
              ]
            );
            await conn.execute(
              `UPDATE phonestock SET sellingPrice = ?, updatedAt = NOW()
               WHERE phoneId = ? AND capacity = ? AND status = 'in_stock'`,
              [Number(cap.price), phone.id, cap.size]
            );
          }
        }
      }

      if (Array.isArray(colors)) {
        for (const col of colors) {
          if (col.name && (col.isOutOfStock || col.stock === 0)) {
            await conn.execute(
              `UPDATE phonevariant SET isOutOfStock = 1, updatedAt = NOW()
               WHERE phoneId = ? AND colorName = ?`,
              [phone.id, col.name]
            );
          }
        }
      }

      if (variantStocks && typeof variantStocks === 'object') {
        for (const [key, conf] of Object.entries(variantStocks) as [string, any][]) {
          const [colorName, capSize] = key.split('_');
          if (!colorName || !capSize) continue;

          await conn.execute(
            `UPDATE phonevariant SET isOutOfStock = ?, updatedAt = NOW()
             WHERE phoneId = ? AND colorName = ? AND capacity = ?`,
            [conf.isOutOfStock || conf.stock === 0 ? 1 : 0, phone.id, colorName, capSize]
          );

          const [currentStock]: any = await conn.query(
            `SELECT imei FROM phonestock 
             WHERE phoneId = ? AND status = 'in_stock' AND color LIKE ? AND capacity LIKE ?`,
            [phone.id, `%${colorName}%`, `%${capSize}%`]
          );

          if (conf.isOutOfStock) {
            // Mark existing in_stock as reserved / out of stock
            for (const item of currentStock) {
              await conn.execute(
                'UPDATE phonestock SET status = "reserved", updatedAt = NOW() WHERE imei = ?',
                [item.imei]
              );
            }
          } else if (typeof conf.stock === 'number') {
            const diff = conf.stock - currentStock.length;
            if (diff > 0) {
              // Add new stock items
              const capObj = capacities?.find((c: any) => c.size === capSize);
              const sellPrice = capObj?.price || 30000000;
              const costPrice = Math.round(sellPrice * 0.85);

              for (let i = 0; i < diff; i++) {
                const imei = `35${Math.floor(1000000000000 + Math.random() * 9000000000000)}`;
                await conn.execute(
                  `INSERT INTO phonestock 
                   (imei, phoneId, phoneName, color, capacity, costPrice, sellingPrice, supplierId, supplierName, importDate, status, warrantyMonths, createdAt, updatedAt)
                   VALUES (?, ?, ?, ?, ?, ?, ?, 'sup-1', 'Apple Authorized Distributor VN', CURDATE(), 'in_stock', 12, NOW(), NOW())`,
                  [imei, phone.id, phone.name, colorName, capSize, costPrice, sellPrice]
                );
              }
            } else if (diff < 0) {
              // Mark excess items as reserved
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

    const updated = await db.queryOne('SELECT * FROM phoneproduct WHERE id = ?', [phone.id]);

    return NextResponse.json({
      success: true,
      message: 'Cập nhật tồn kho và trạng thái biến thể thành công!',
      data: {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        colors: colors || JSON.parse(updated.colors),
        capacities: capacities || JSON.parse(updated.capacities),
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
