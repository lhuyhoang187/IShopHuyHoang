import { NextResponse } from 'next/server';
import { db, SERVER_BOOT_ID } from '@/ThuVien/CoSoDuLieu';
import {
  normalizePhone,
  isStrictVietnamPhone,
  isValidEmail,
  sanitizeString,
} from '@/ThuVien/KiemTraHopLe';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mode = 'login', name, phone, email, password, avatar, birthday, gender, city, address } = body;

    const normalizedPhone = phone ? normalizePhone(phone) : '';
    const cleanEmail = email ? sanitizeString(email, 100).toLowerCase() : '';

    if (!normalizedPhone && !cleanEmail) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng cung cấp số điện thoại hoặc email' },
        { status: 400 }
      );
    }

    if (mode === 'signup') {
      if (!normalizedPhone) {
        return NextResponse.json(
          { success: false, error: 'Vui lòng nhập số điện thoại (10 chữ số Việt Nam) để đăng ký tài khoản!' },
          { status: 400 }
        );
      }
      if (!isStrictVietnamPhone(normalizedPhone)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Số điện thoại phải gồm đúng 10 chữ số theo định dạng Việt Nam (bắt đầu bằng 03, 05, 07, 08, 09)!',
          },
          { status: 400 }
        );
      }
    } else if (normalizedPhone && !isStrictVietnamPhone(normalizedPhone)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Số điện thoại phải gồm đúng 10 chữ số theo định dạng Việt Nam (bắt đầu bằng 03, 05, 07, 08, 09)!',
        },
        { status: 400 }
      );
    }

    if (cleanEmail && !isValidEmail(cleanEmail)) {
      return NextResponse.json(
        { success: false, error: 'Địa chỉ email không đúng định dạng hợp lệ' },
        { status: 400 }
      );
    }

    let customer: any = null;
    if (normalizedPhone) {
      customer = await db.queryOne('SELECT * FROM KhachHang WHERE SoDienThoai = ?', [normalizedPhone]);
    }

    if (!customer && cleanEmail) {
      customer = await db.queryOne('SELECT * FROM KhachHang WHERE LOWER(Email) = ?', [cleanEmail]);
    }

    if (mode === 'login') {
      if (!customer) {
        return NextResponse.json(
          {
            success: false,
            error: 'Tài khoản khách hàng chưa tồn tại trên hệ thống. Vui lòng chuyển sang tab Đăng ký (Sign up) để tạo tài khoản mới!',
          },
          { status: 401 }
        );
      }

      if (customer.MatKhau) {
        if (!password || customer.MatKhau !== String(password)) {
          return NextResponse.json(
            { success: false, error: 'Mật khẩu đăng nhập không chính xác!' },
            { status: 401 }
          );
        }
      }
    } else if (mode === 'signup') {
      if (customer && customer.MatKhau) {
        return NextResponse.json(
          {
            success: false,
            error: 'Email hoặc số điện thoại này đã được đăng ký tài khoản. Vui lòng chuyển sang Đăng nhập!',
          },
          { status: 409 }
        );
      }
    }

    if (!customer) {
      const customerName = name ? sanitizeString(name, 100) : (cleanEmail ? cleanEmail.split('@')[0] : 'Khách Hàng');
      // Avoid UNIQUE constraint collision on SoDienThoai when signing in via social email without phone yet
      const customerPhone = normalizedPhone || `CHUA_CAP_NHAT_${Date.now().toString(36).slice(-6)}`;
      const customerId = 'cust-' + Date.now();

      await db.execute(
        `INSERT INTO KhachHang
         (MaKhachHang, HoTen, SoDienThoai, Email, MatKhau, AnhDaiDien, NgaySinh, GioiTinh, ThanhPho, DiaChi, DiemTichLuy, TongChiTieu, SoLanMua, SoLanSuaChua, HangThanhVien, LoaiKhachHang, NgayTao, NgayCapNhat)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 'Chưa xếp hạng', 'Khách lẻ', NOW(), NOW())`,
        [
          customerId,
          customerName,
          customerPhone,
          cleanEmail || null,
          password ? String(password) : null,
          avatar || null,
          birthday || null,
          gender || 'male',
          city || null,
          address ? sanitizeString(address, 191) : null,
        ]
      );

      customer = await db.queryOne('SELECT * FROM KhachHang WHERE MaKhachHang = ?', [customerId]);
    } else if (mode !== 'login') {
      const setClauses: string[] = [];
      const params: any[] = [];

      if (name) {
        setClauses.push('HoTen = ?');
        params.push(sanitizeString(name, 100));
      }
      if (cleanEmail && !customer.Email) {
        setClauses.push('Email = ?');
        params.push(cleanEmail);
      }
      if (password) {
        setClauses.push('MatKhau = ?');
        params.push(String(password));
      }
      if (avatar !== undefined) {
        setClauses.push('AnhDaiDien = ?');
        params.push(avatar);
      }
      if (birthday !== undefined) {
        setClauses.push('NgaySinh = ?');
        params.push(birthday);
      }
      if (gender !== undefined) {
        setClauses.push('GioiTinh = ?');
        params.push(gender);
      }
      if (city !== undefined) {
        setClauses.push('ThanhPho = ?');
        params.push(city);
      }
      if (address !== undefined) {
        setClauses.push('DiaChi = ?');
        params.push(sanitizeString(address, 191));
      }

      if (setClauses.length > 0) {
        setClauses.push('NgayCapNhat = NOW()');
        params.push(customer.MaKhachHang);
        await db.execute(
          `UPDATE KhachHang SET ${setClauses.join(', ')} WHERE MaKhachHang = ?`,
          params
        );
        customer = await db.queryOne('SELECT * FROM KhachHang WHERE MaKhachHang = ?', [customer.MaKhachHang]);
      }
    }

    return NextResponse.json({
      success: true,
      bootId: SERVER_BOOT_ID,
      message: 'Đăng nhập / Đồng bộ thông tin khách hàng thành công',
      data: {
        id: customer.MaKhachHang,
        name: customer.HoTen,
        phone: customer.SoDienThoai,
        email: customer.Email,
        membershipTier: customer.HangThanhVien,
        points: customer.DiemTichLuy,
        totalSpent: customer.TongChiTieu,
        purchaseCount: customer.SoLanMua,
        repairCount: customer.SoLanSuaChua,
        avatar: customer.AnhDaiDien,
        birthday: customer.NgaySinh,
        gender: customer.GioiTinh,
        city: customer.ThanhPho,
        address: customer.DiaChi,
      },
    });
  } catch (error: any) {
    console.error('Customer auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi xác thực khách hàng: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
