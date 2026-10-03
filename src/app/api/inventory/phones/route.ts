import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  try {
    const whereClause: any = {};
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const items = await prisma.phoneStock.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    const inStockCount = items.filter((i) => i.status === 'in_stock').length;
    const soldCount = items.filter((i) => i.status === 'sold').length;

    return NextResponse.json({
      success: true,
      source: 'mysql_database',
      total: items.length,
      inStockCount,
      soldCount,
      data: items,
    });
  } catch (error: any) {
    console.error('Phone stock GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi truy vấn kho máy: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.imei || !body.phoneName || !body.color || !body.capacity || !body.sellingPrice) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đầy đủ thông tin IMEI, tên máy, màu sắc, dung lượng và giá bán' },
        { status: 400 }
      );
    }

    const exists = await prisma.phoneStock.findUnique({
      where: { imei: body.imei },
    });

    if (exists) {
      return NextResponse.json(
        { error: 'Số IMEI này đã tồn tại trong hệ thống kho!' },
        { status: 409 }
      );
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newItem = await prisma.phoneStock.create({
      data: {
        imei: body.imei,
        phoneId: body.phoneId || 'p-custom',
        phoneName: body.phoneName,
        color: body.color,
        capacity: body.capacity,
        costPrice: Number(body.costPrice || 0),
        sellingPrice: Number(body.sellingPrice),
        supplierId: body.supplierId || 'sup-1',
        supplierName: body.supplierName || 'Apple Authorized Distributor VN',
        importDate: body.importDate || now.split(' ')[0],
        status: 'in_stock',
        warrantyMonths: Number(body.warrantyMonths || 12),
      },
    });

    return NextResponse.json(
      {
        success: true,
        source: 'mysql_database',
        message: 'Nhập máy vào kho thành công',
        data: newItem,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Phone stock POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi nhập kho: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
