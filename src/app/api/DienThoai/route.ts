import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/ThuVien/CoSoDuLieu';
import { sanitizeString } from '@/ThuVien/KiemTraHopLe';

export const dynamic = 'force-dynamic';

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
      imageUrl: typeof c.imageUrl === 'string' ? c.imageUrl.trim() : '',
      stock: c.stock as number | undefined,
      isOutOfStock: Boolean(c.isOutOfStock),
    }));
  }
  return [
    {
      id: 'c-default',
      name: 'Đen (Black)',
      hex: '#222222',
      imageUrl: '',
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
      const orig =
        c.originalPrice !== undefined && c.originalPrice !== null && Number(c.originalPrice) > 0
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
      `SELECT p.MaDienThoai AS id, p.TenDienThoai AS name, p.DuongDan AS slug,
              p.MaThuongHieu AS brandId, p.MoTa AS description, p.DanhGia AS rating,
              p.SoLuotDanhGia AS reviewCount, p.SanPhamNoiBat AS isHot, p.SanPhamMoi AS isNew,
              p.ManHinh AS specScreen, p.ChipXuLy AS specChip, p.Ram AS specRam,
              p.BoNhoTrong AS specStorage, p.CameraSau AS specRearCamera,
              p.CameraTruoc AS specFrontCamera, p.DungLuongPin AS specBattery,
              p.CongNgheSac AS specCharging, p.HeDieuHanh AS specOs, p.Sim AS specSim,
              p.KhangNuoc AS specWaterResistant, p.TrongLuong AS specWeight,
              p.ThongTinBaoHanh AS warrantyInfo, p.NgayTao AS createdAt, p.NgayCapNhat AS updatedAt,
              b.TenThuongHieu AS brandName
       FROM SanPhamDienThoai p
       LEFT JOIN ThuongHieuDienThoai b ON p.MaThuongHieu = b.MaThuongHieu
       ORDER BY p.NgayTao DESC`
    );

    const allColors = await db.query(
      `SELECT MaMauSac AS id, MaDienThoai AS phoneId, TenMau AS name,
              MaMauHex AS hex, HinhAnh AS imageUrl, ThuTuHienThi AS displayOrder,
              NgayTao AS createdAt, NgayCapNhat AS updatedAt
       FROM MauSacDienThoai
       ORDER BY ThuTuHienThi ASC, NgayTao ASC`
    );

    const allVariants = await db.query(
      `SELECT v.MaBienThe AS id, v.MaMauSac AS colorId, v.DungLuong AS capacity,
              v.GiaBan AS price, v.GiaGoc AS originalPrice, v.HetHang AS isOutOfStock,
              v.NgayCapNhat AS updatedAt,
              c.MaDienThoai AS phoneId, c.TenMau AS colorName, c.MaMauHex AS colorHex, c.HinhAnh AS imageUrl
       FROM BienTheDienThoai v
       INNER JOIN MauSacDienThoai c ON v.MaMauSac = c.MaMauSac
       ORDER BY v.GiaBan ASC`
    );

    const allStock = await db.query(
      `SELECT SoIMEI AS imei, MaDienThoai AS phoneId, MauSac AS color,
              DungLuong AS capacity, GiaBan AS sellingPrice, TrangThai AS status
       FROM KhoDienThoai`
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

      const capMap = new Map<string, { size: string; price: number; originalPrice: number; isOutOfStock: boolean }>();
      for (const v of variants) {
        const key = String(v.capacity || '256GB').trim();
        const vPrice = Number(v.price || 0);
        const vOrig = v.originalPrice != null && Number(v.originalPrice) > 0 ? Number(v.originalPrice) : vPrice;
        const existing = capMap.get(key);
        if (!existing) {
          capMap.set(key, {
            size: key,
            price: vPrice,
            originalPrice: vOrig,
            isOutOfStock: Boolean(v.isOutOfStock),
          });
        } else {
          if (vPrice > 0 && (existing.price === 0 || vPrice < existing.price)) {
            existing.price = vPrice;
            existing.originalPrice = vOrig;
          }
          if (!v.isOutOfStock) {
            existing.isOutOfStock = false;
          }
        }
      }
      const capacities =
        capMap.size > 0
          ? Array.from(capMap.values())
          : [{ size: '256GB', price: 0, originalPrice: 0, isOutOfStock: false }];

      const colors =
        pColors.length > 0
          ? pColors.map((c) => {
              const colVars = variants.filter((v) => v.colorId === c.id);
              const allOut = colVars.length > 0 && colVars.every((v) => v.isOutOfStock);
              return {
                id: c.id,
                name: c.name,
                hex: c.hex || '#222222',
                imageUrl: c.imageUrl || '',
                isOutOfStock: allOut,
              };
            })
          : [];

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
    console.error('API /Api/DienThoai GET error:', error);
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
      syncDeleteColors,
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

    let brandRow = await db.queryOne(
      'SELECT MaThuongHieu AS id FROM ThuongHieuDienThoai WHERE TenThuongHieu = ? OR DuongDan = ?',
      [cleanBrand, brandSlug]
    );
    let brandId = brandRow?.id;
    if (!brandId) {
      brandId = 'brand_' + Date.now();
      await db.execute(
        `INSERT INTO ThuongHieuDienThoai (MaThuongHieu, TenThuongHieu, DuongDan, ThuTuHienThi, DangHoatDong, NgayTao, NgayCapNhat)
         VALUES (?, ?, ?, 99, 1, NOW(), NOW())`,
        [brandId, cleanBrand, brandSlug]
      );
    }

    const existing = await db.queryOne(
      'SELECT MaDienThoai AS id FROM SanPhamDienThoai WHERE MaDienThoai = ? OR DuongDan = ?',
      [phoneId, cleanSlug]
    );
    const targetId = existing?.id || phoneId;

    await db.transaction(async (conn) => {
      if (existing) {
        await conn.execute(
          `UPDATE SanPhamDienThoai SET
             TenDienThoai = ?, MaThuongHieu = ?, MoTa = ?,
             ManHinh = ?, ChipXuLy = ?, Ram = ?, BoNhoTrong = ?,
             CameraSau = ?, CameraTruoc = ?, DungLuongPin = ?, CongNgheSac = ?,
             HeDieuHanh = ?, Sim = ?, KhangNuoc = ?, TrongLuong = ?,
             ThongTinBaoHanh = ?, NgayCapNhat = NOW()
           WHERE MaDienThoai = ?`,
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
          `INSERT INTO SanPhamDienThoai
           (MaDienThoai, TenDienThoai, DuongDan, MaThuongHieu, MoTa, DanhGia, SoLuotDanhGia, SanPhamNoiBat, SanPhamMoi,
            ManHinh, ChipXuLy, Ram, BoNhoTrong, CameraSau, CameraTruoc,
            DungLuongPin, CongNgheSac, HeDieuHanh, Sim, KhangNuoc, TrongLuong,
            ThongTinBaoHanh, NgayTao, NgayCapNhat)
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

      const activeColorIds: string[] = [];
      for (let idx = 0; idx < normalizedColors.length; idx++) {
        const col = normalizedColors[idx];
        const [exCols]: any = await conn.query(
          'SELECT MaMauSac AS id, HinhAnh AS imageUrl FROM MauSacDienThoai WHERE MaDienThoai = ? AND LOWER(TenMau) = LOWER(?) LIMIT 1',
          [targetId, col.name]
        );
        let colorId = exCols[0]?.id;
        if (colorId) {
          const finalImg = col.imageUrl !== '' ? col.imageUrl : (exCols[0]?.imageUrl || '');
          await conn.execute(
            `UPDATE MauSacDienThoai SET TenMau = ?, MaMauHex = ?, HinhAnh = ?, ThuTuHienThi = ?, NgayCapNhat = NOW() WHERE MaMauSac = ?`,
            [col.name, col.hex, finalImg, idx, colorId]
          );
        } else {
          colorId = 'pc_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
          await conn.execute(
            `INSERT INTO MauSacDienThoai (MaMauSac, MaDienThoai, TenMau, MaMauHex, HinhAnh, ThuTuHienThi, NgayTao, NgayCapNhat)
             VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [colorId, targetId, col.name, col.hex, col.imageUrl || '', idx]
          );
        }
        activeColorIds.push(colorId);

        for (const cap of normalizedCaps) {
          const capSize = cap.size || '256GB';
          const capPrice = Number(cap.price) || 0;
          const isOut = col.isOutOfStock || cap.isOutOfStock || col.stock === 0 || cap.stock === 0 ? 1 : 0;

          const [exVars]: any = await conn.query(
            'SELECT MaBienThe AS id, GiaBan AS price, GiaGoc AS originalPrice FROM BienTheDienThoai WHERE MaMauSac = ? AND DungLuong = ?',
            [colorId, capSize]
          );
          if (exVars[0]?.id) {
            const nextPrice = capPrice > 0 ? capPrice : Number(exVars[0].price || 0);
            const nextOrig = cap.originalPrice ? Number(cap.originalPrice) : (Number(exVars[0].originalPrice || 0) || nextPrice);
            await conn.execute(
              `UPDATE BienTheDienThoai SET GiaBan = ?, GiaGoc = ?, HetHang = ?, NgayCapNhat = NOW() WHERE MaBienThe = ?`,
              [nextPrice, nextOrig, isOut, exVars[0].id]
            );
          } else {
            const varId = 'var_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
            await conn.execute(
              `INSERT INTO BienTheDienThoai (MaBienThe, MaMauSac, DungLuong, GiaBan, GiaGoc, HetHang, NgayTao, NgayCapNhat)
               VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [varId, colorId, capSize, capPrice, cap.originalPrice ? Number(cap.originalPrice) : capPrice, isOut]
            );
          }
        }
      }

      if (syncDeleteColors && activeColorIds.length > 0) {
        const placeholders = activeColorIds.map(() => '?').join(',');
        await conn.execute(
          `DELETE FROM MauSacDienThoai WHERE MaDienThoai = ? AND MaMauSac NOT IN (${placeholders})`,
          [targetId, ...activeColorIds]
        );
      }

      for (const cap of normalizedCaps) {
        await conn.execute(
          `UPDATE KhoDienThoai SET GiaBan = ?, NgayCapNhat = NOW()
           WHERE MaDienThoai = ? AND DungLuong = ? AND TrangThai = 'in_stock'`,
          [Number(cap.price) || 20000000, targetId, cap.size || '256GB']
        );
      }
    });

    const product = await db.queryOne(
      `SELECT p.MaDienThoai AS id, p.TenDienThoai AS name, p.DuongDan AS slug,
              p.MaThuongHieu AS brandId, b.TenThuongHieu AS brand,
              p.MoTa AS description, p.DanhGia AS rating, p.SoLuotDanhGia AS reviewCount,
              p.SanPhamNoiBat AS isHot, p.SanPhamMoi AS isNew,
              p.ThongTinBaoHanh AS warrantyInfo, p.NgayTao AS createdAt, p.NgayCapNhat AS updatedAt
       FROM SanPhamDienThoai p
       LEFT JOIN ThuongHieuDienThoai b ON p.MaThuongHieu = b.MaThuongHieu
       WHERE p.MaDienThoai = ?`,
      [targetId]
    );

    return NextResponse.json({
      success: true,
      message: 'Đã lưu sản phẩm điện thoại thành công',
      data: product,
    });
  } catch (error: any) {
    console.error('API /Api/DienThoai POST error:', error);
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
        await conn.execute('DELETE FROM KhoDienThoai WHERE MaDienThoai = ?', [id]);
        await conn.execute('DELETE FROM SanPhamDienThoai WHERE MaDienThoai = ?', [id]);
      } else if (brand) {
        const [targetPhones]: any = await conn.query(
          `SELECT p.MaDienThoai AS id
           FROM SanPhamDienThoai p
           INNER JOIN ThuongHieuDienThoai b ON p.MaThuongHieu = b.MaThuongHieu
           WHERE b.TenThuongHieu = ?`,
          [brand]
        );
        for (const p of targetPhones) {
          await conn.execute('DELETE FROM KhoDienThoai WHERE MaDienThoai = ?', [p.id]);
          await conn.execute('DELETE FROM SanPhamDienThoai WHERE MaDienThoai = ?', [p.id]);
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Đã xóa sản phẩm điện thoại thành công',
    });
  } catch (error: any) {
    console.error('API /Api/DienThoai DELETE error:', error);
    return NextResponse.json(
      { error: 'Lỗi xóa sản phẩm điện thoại: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
