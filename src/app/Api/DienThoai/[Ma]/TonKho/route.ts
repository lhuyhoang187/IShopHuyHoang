import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/ThuVien/CoSoDuLieu';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ Ma: string }> }
) {
  try {
    const { Ma: id } = await params;
    const phone = await db.queryOne(
      'SELECT MaDienThoai AS id, TenDienThoai AS name, DuongDan AS slug FROM SanPhamDienThoai WHERE MaDienThoai = ? OR DuongDan = ?',
      [id, id]
    );

    if (!phone) {
      return NextResponse.json(
        { error: 'Không tìm thấy sản phẩm điện thoại' },
        { status: 404 }
      );
    }

    const dbColors = await db.query(
      `SELECT MaMauSac AS id, TenMau AS name, MaMauHex AS hex, HinhAnh AS imageUrl, ThuTuHienThi AS displayOrder
       FROM MauSacDienThoai
       WHERE MaDienThoai = ?
       ORDER BY ThuTuHienThi ASC`,
      [phone.id]
    );
    const dbVariants = await db.query(
      `SELECT v.MaBienThe AS id, v.MaMauSac AS colorId, v.DungLuong AS capacity,
              v.GiaBan AS price, v.GiaGoc AS originalPrice, v.HetHang AS isOutOfStock,
              c.TenMau AS colorName, c.MaMauHex AS colorHex, c.HinhAnh AS imageUrl
       FROM BienTheDienThoai v
       INNER JOIN MauSacDienThoai c ON v.MaMauSac = c.MaMauSac
       WHERE c.MaDienThoai = ?
       ORDER BY v.GiaBan ASC`,
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

    const inStockItems = await db.query(
      `SELECT MauSac AS color, DungLuong AS capacity
       FROM KhoDienThoai
       WHERE MaDienThoai = ? AND TrangThai = 'in_stock'`,
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
  { params }: { params: Promise<{ Ma: string }> }
) {
  try {
    const { Ma: id } = await params;
    const body = await request.json();
    const { colors, capacities, variantStocks } = body;

    const phone = await db.queryOne(
      'SELECT MaDienThoai AS id, TenDienThoai AS name, DuongDan AS slug FROM SanPhamDienThoai WHERE MaDienThoai = ? OR DuongDan = ?',
      [id, id]
    );

    if (!phone) {
      return NextResponse.json(
        { error: 'Không tìm thấy sản phẩm điện thoại' },
        { status: 404 }
      );
    }

    const firstSup = await db.queryOne('SELECT MaNhaCungCap AS id FROM NhaCungCap LIMIT 1');
    const defaultSupplierId = firstSup?.id || null;

    await db.transaction(async (conn) => {
      await conn.execute('UPDATE SanPhamDienThoai SET NgayCapNhat = NOW() WHERE MaDienThoai = ?', [phone.id]);

      const colorIdByName = new Map<string, string>();
      const [existingColors]: any = await conn.query(
        'SELECT MaMauSac AS id, TenMau AS name FROM MauSacDienThoai WHERE MaDienThoai = ?',
        [phone.id]
      );
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
              `INSERT INTO MauSacDienThoai (MaMauSac, MaDienThoai, TenMau, MaMauHex, HinhAnh, ThuTuHienThi, NgayTao, NgayCapNhat)
               VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [cid, phone.id, col.name.trim(), col.hex || '#2B2B2B', col.imageUrl || '', idx]
            );
            colorIdByName.set(key, cid);
          } else {
            await conn.execute(
              `UPDATE MauSacDienThoai SET MaMauHex = ?, HinhAnh = ?, NgayCapNhat = NOW() WHERE MaMauSac = ?`,
              [col.hex || '#2B2B2B', col.imageUrl || '', cid]
            );
          }

          if (col.isOutOfStock || col.stock === 0) {
            await conn.execute(
              `UPDATE BienTheDienThoai SET HetHang = 1, NgayCapNhat = NOW() WHERE MaMauSac = ?`,
              [cid]
            );
          } else if (col.isOutOfStock === false) {
            await conn.execute(
              `UPDATE BienTheDienThoai SET HetHang = 0, NgayCapNhat = NOW() WHERE MaMauSac = ?`,
              [cid]
            );
          }
        }
      }

      if (Array.isArray(capacities)) {
        for (const cap of capacities) {
          if (cap.size) {
            const capPrice = Number(cap.price || 0);
            for (const cid of colorIdByName.values()) {
              const [exVar]: any = await conn.query(
                'SELECT MaBienThe AS id, GiaBan AS price, GiaGoc AS originalPrice FROM BienTheDienThoai WHERE MaMauSac = ? AND DungLuong = ?',
                [cid, cap.size]
              );
              if (exVar[0]?.id) {
                const nextPrice = capPrice > 0 ? capPrice : Number(exVar[0].price || 0);
                const nextOrig = cap.originalPrice ? Number(cap.originalPrice) : exVar[0].originalPrice;
                await conn.execute(
                  `UPDATE BienTheDienThoai SET GiaBan = ?, GiaGoc = ?, HetHang = ?, NgayCapNhat = NOW() WHERE MaBienThe = ?`,
                  [
                    nextPrice,
                    nextOrig,
                    cap.isOutOfStock || cap.stock === 0 ? 1 : 0,
                    exVar[0].id,
                  ]
                );
              } else {
                const varId = 'var_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
                await conn.execute(
                  `INSERT INTO BienTheDienThoai (MaBienThe, MaMauSac, DungLuong, GiaBan, GiaGoc, HetHang, NgayTao, NgayCapNhat)
                   VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                  [
                    varId,
                    cid,
                    cap.size,
                    capPrice,
                    cap.originalPrice ? Number(cap.originalPrice) : null,
                    cap.isOutOfStock || cap.stock === 0 ? 1 : 0,
                  ]
                );
              }
            }

            if (capPrice > 0) {
              await conn.execute(
                `UPDATE KhoDienThoai SET GiaBan = ?, NgayCapNhat = NOW()
                 WHERE MaDienThoai = ? AND DungLuong = ? AND TrangThai = 'in_stock'`,
                [capPrice, phone.id, cap.size]
              );
            }
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
              `UPDATE BienTheDienThoai SET HetHang = ?, NgayCapNhat = NOW()
               WHERE MaMauSac = ? AND DungLuong = ?`,
              [conf.isOutOfStock || conf.stock === 0 ? 1 : 0, cid, capSize]
            );
          }

          const [currentStock]: any = await conn.query(
            `SELECT SoIMEI AS imei FROM KhoDienThoai
             WHERE MaDienThoai = ? AND TrangThai = 'in_stock' AND MauSac LIKE ? AND DungLuong LIKE ?`,
            [phone.id, `%${colorName}%`, `%${capSize}%`]
          );

          if (conf.isOutOfStock) {
            for (const item of currentStock) {
              await conn.execute(
                `UPDATE KhoDienThoai SET TrangThai = 'reserved', NgayCapNhat = NOW() WHERE SoIMEI = ?`,
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
                  `INSERT INTO KhoDienThoai
                   (SoIMEI, MaDienThoai, MauSac, DungLuong, GiaVon, GiaBan, MaNhaCungCap, NgayNhap, TrangThai, SoThangBaoHanh, NgayTao, NgayCapNhat)
                   VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), 'in_stock', 12, NOW(), NOW())`,
                  [imei, phone.id, colorName, capSize, costPrice, sellPrice, defaultSupplierId]
                );
              }
            } else if (diff < 0) {
              const toReserve = currentStock.slice(0, Math.abs(diff));
              for (const item of toReserve) {
                await conn.execute(
                  `UPDATE KhoDienThoai SET TrangThai = 'reserved', NgayCapNhat = NOW() WHERE SoIMEI = ?`,
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
