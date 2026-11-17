import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sanitizeString } from '@/lib/validation';

export async function GET() {
  try {
    const branches = await db.query(
      `SELECT * FROM storebranch 
       WHERE isActive = 1 
       ORDER BY isMainBranch DESC, code ASC`
    );

    const mapped = branches.map((b) => ({
      ...b,
      isMainBranch: Boolean(b.isMainBranch),
      isActive: Boolean(b.isActive),
    }));

    return NextResponse.json({
      success: true,
      data: mapped,
    });
  } catch (error: any) {
    console.error('Store branches GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi tải danh sách chi nhánh: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, phone, address, district, city, openingHours, isMainBranch, mapUrl } = body;

    if (!code || !name || !address) {
      return NextResponse.json({ error: 'Mã, tên và địa chỉ chi nhánh không được để trống' }, { status: 400 });
    }

    const cleanCode = sanitizeString(code, 50).toUpperCase();
    const cleanName = sanitizeString(name, 150);
    const cleanPhone = sanitizeString(phone || '', 20);
    const cleanAddress = sanitizeString(address, 191);
    const cleanDistrict = district ? sanitizeString(district, 100) : null;
    const cleanCity = city ? sanitizeString(city, 100) : 'TP. Hồ Chí Minh';
    const cleanHours = openingHours ? sanitizeString(openingHours, 100) : '08:00 - 21:30';
    const boolMain = isMainBranch ? 1 : 0;
    const cleanMap = mapUrl || null;

    const existing = await db.queryOne('SELECT id FROM storebranch WHERE code = ?', [cleanCode]);

    let branchId = existing?.id;
    if (existing) {
      await db.execute(
        `UPDATE storebranch SET 
           name = ?, phone = ?, address = ?, district = ?, city = ?, 
           openingHours = ?, isMainBranch = ?, mapUrl = ?, isActive = 1, updatedAt = NOW()
         WHERE id = ?`,
        [cleanName, cleanPhone, cleanAddress, cleanDistrict, cleanCity, cleanHours, boolMain, cleanMap, branchId]
      );
    } else {
      branchId = 'branch_' + Date.now();
      await db.execute(
        `INSERT INTO storebranch 
         (id, code, name, phone, address, district, city, openingHours, isMainBranch, mapUrl, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [branchId, cleanCode, cleanName, cleanPhone, cleanAddress, cleanDistrict, cleanCity, cleanHours, boolMain, cleanMap]
      );
    }

    const branch = await db.queryOne('SELECT * FROM storebranch WHERE id = ?', [branchId]);

    return NextResponse.json({
      success: true,
      message: 'Đã lưu chi nhánh thành công',
      data: branch ? { ...branch, isMainBranch: Boolean(branch.isMainBranch), isActive: Boolean(branch.isActive) } : null,
    });
  } catch (error: any) {
    console.error('Store branches POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi lưu chi nhánh: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
