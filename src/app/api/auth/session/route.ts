import { NextRequest, NextResponse } from 'next/server';
import { db, SERVER_BOOT_ID } from '@/lib/db';
import { sanitizeString } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = sanitizeString(searchParams.get('staffId') || '', 64);
    const staffUsername = sanitizeString(searchParams.get('staffUsername') || '', 64).toLowerCase();
    const customerId = sanitizeString(searchParams.get('customerId') || '', 64);
    const customerPhone = sanitizeString(searchParams.get('customerPhone') || '', 30);
    const customerEmail = sanitizeString(searchParams.get('customerEmail') || '', 100).toLowerCase();

    let staffValid = false;
    let staffUser: any = null;

    if (staffId || staffUsername) {
      let row: any = null;
      if (staffId) {
        row = await db.queryOne(
          'SELECT id, username, name, role, avatar, isActive FROM user WHERE id = ?',
          [staffId]
        );
      }
      if (!row && staffUsername) {
        row = await db.queryOne(
          'SELECT id, username, name, role, avatar, isActive FROM user WHERE LOWER(username) = ?',
          [staffUsername]
        );
      }
      if (row && Number(row.isActive) === 1 && row.role !== 'pending') {
        staffValid = true;
        staffUser = {
          id: row.id,
          username: row.username,
          name: row.name,
          role: row.role,
          avatar: row.avatar || undefined,
        };
      }
    }

    let customerValid = false;
    let customerUser: any = null;

    if (customerId || customerPhone || customerEmail) {
      let row: any = null;
      if (customerId) {
        row = await db.queryOne('SELECT * FROM customer WHERE id = ?', [customerId]);
      }
      if (!row && customerPhone) {
        row = await db.queryOne('SELECT * FROM customer WHERE phone = ?', [customerPhone]);
      }
      if (!row && customerEmail) {
        row = await db.queryOne('SELECT * FROM customer WHERE LOWER(email) = ?', [customerEmail]);
      }
      if (row) {
        customerValid = true;
        customerUser = {
          id: row.id,
          name: row.name,
          phone: row.phone,
          email: row.email || undefined,
          membershipTier: row.membershipTier,
          points: Number(row.points || 0),
          totalSpent: Number(row.totalSpent || 0),
          purchaseCount: Number(row.purchaseCount || 0),
          repairCount: Number(row.repairCount || 0),
          avatar: row.avatar || undefined,
          birthday: row.birthday || undefined,
          gender: row.gender || undefined,
          city: row.city || undefined,
          address: row.address || undefined,
        };
      }
    }

    return NextResponse.json({
      success: true,
      bootId: SERVER_BOOT_ID,
      staffValid,
      staffUser,
      customerValid,
      customerUser,
    });
  } catch (error: any) {
    console.error('Session verification error:', error);
    return NextResponse.json(
      {
        success: false,
        bootId: SERVER_BOOT_ID,
        error: 'Lỗi kiểm tra phiên đăng nhập: ' + (error?.message || ''),
      },
      { status: 500 }
    );
  }
}
