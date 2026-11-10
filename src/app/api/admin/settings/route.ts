import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sanitizeString } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    let settings = await prisma.storeSetting.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await prisma.storeSetting.create({
        data: {
          id: 'default',
          storeName: 'iShop Huy Hoàng - Apple & Smartphone Premium',
          hotline: '0909.123.456',
          address: '45 Lê Văn Việt, TP. Thủ Đức, TP.HCM',
          email: 'contact@ishophuyhoang.vn',
          bankId: 'MB',
          bankAccountNo: '0988888999',
          bankAccountName: 'NGUYEN HUY HOANG',
          defaultWarrantyNote: 'Bảo hành điện tử chính hãng 12 tháng tại hệ thống iShop Huy Hoàng.',
          returnPolicy: 'Bảo hành 12 tháng máy mới / 1 đổi 1 trong 30 ngày đầu.',
          receiptFooter: 'Cảm ơn quý khách đã tin tưởng và ủng hộ iShop Huy Hoàng!',
        },
      });
    }

    return NextResponse.json({
      success: true,
      source: 'mysql_database',
      data: settings,
    });
  } catch (error: any) {
    console.error('Settings API GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi truy vấn cấu hình cửa hàng: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      storeName,
      hotline,
      address,
      email,
      bankId,
      bankAccountNo,
      bankAccountName,
      defaultWarrantyNote,
      returnPolicy,
      receiptFooter,
      posDiscountRequiresApproval,
    } = body;

    const updated = await prisma.storeSetting.upsert({
      where: { id: 'default' },
      update: {
        storeName: storeName ? sanitizeString(storeName, 150) : undefined,
        hotline: hotline ? sanitizeString(hotline, 20) : undefined,
        address: address ? sanitizeString(address, 191) : undefined,
        email: email ? sanitizeString(email, 100).toLowerCase() : undefined,
        bankId: bankId ? sanitizeString(bankId, 20) : undefined,
        bankAccountNo: bankAccountNo ? sanitizeString(bankAccountNo, 50) : undefined,
        bankAccountName: bankAccountName ? sanitizeString(bankAccountName, 100) : undefined,
        defaultWarrantyNote: defaultWarrantyNote ? sanitizeString(defaultWarrantyNote, 500) : undefined,
        returnPolicy: returnPolicy ? sanitizeString(returnPolicy, 500) : undefined,
        receiptFooter: receiptFooter ? sanitizeString(receiptFooter, 500) : undefined,
        posDiscountRequiresApproval: posDiscountRequiresApproval !== undefined ? Boolean(posDiscountRequiresApproval) : undefined,
      },
      create: {
        id: 'default',
        storeName: sanitizeString(storeName || 'iShop Huy Hoàng', 150),
        hotline: sanitizeString(hotline || '0909.123.456', 20),
        address: sanitizeString(address || '45 Lê Văn Việt, TP. Thủ Đức', 191),
        email: sanitizeString(email || 'contact@ishophuyhoang.vn', 100).toLowerCase(),
        bankId: sanitizeString(bankId || 'MB', 20),
        bankAccountNo: sanitizeString(bankAccountNo || '0988888999', 50),
        bankAccountName: sanitizeString(bankAccountName || 'NGUYEN HUY HOANG', 100),
        defaultWarrantyNote: sanitizeString(defaultWarrantyNote || 'Bảo hành chính hãng 12 tháng.', 500),
        returnPolicy: sanitizeString(returnPolicy || 'Bảo hành 12 tháng máy mới.', 500),
        receiptFooter: sanitizeString(receiptFooter || 'Cảm ơn quý khách!', 500),
        posDiscountRequiresApproval: posDiscountRequiresApproval !== undefined ? Boolean(posDiscountRequiresApproval) : true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Cập nhật cấu hình cửa hàng thành công vào CSDL',
      data: updated,
    });
  } catch (error: any) {
    console.error('Settings API POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi cập nhật cấu hình cửa hàng: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

