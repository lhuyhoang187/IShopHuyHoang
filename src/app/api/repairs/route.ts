import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ServerStore } from '@/lib/serverStore';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code')?.trim();

  try {
    if (code) {
      // 1. Search MySQL by ticketCode, phone, or IMEI
      const repair = await prisma.repairTicket.findFirst({
        where: {
          OR: [
            { ticketCode: code },
            { customerPhone: code },
            { imeiOrSerial: code },
          ],
        },
      });

      if (repair) {
        return NextResponse.json({
          success: true,
          source: 'mysql_database',
          data: {
            ...repair,
            statusHistory: repair.statusHistory ? JSON.parse(repair.statusHistory) : [],
            partsUsed: repair.partsUsed ? JSON.parse(repair.partsUsed) : [],
          },
        });
      }

      // Fallback
      const fallback = ServerStore.getRepairByCode(code);
      if (!fallback) {
        return NextResponse.json(
          { error: 'Không tìm thấy phiếu sửa chữa' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, source: 'fallback_store', data: fallback });
    }

    // List all
    const repairs = await prisma.repairTicket.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const parsed = repairs.map((r) => ({
      ...r,
      statusHistory: r.statusHistory ? JSON.parse(r.statusHistory) : [],
      partsUsed: r.partsUsed ? JSON.parse(r.partsUsed) : [],
    }));

    return NextResponse.json({
      success: true,
      source: 'mysql_database',
      total: parsed.length,
      data: parsed,
    });
  } catch (error: any) {
    console.error('Repairs GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi truy vấn phiếu sửa chữa: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.customerName || !body.customerPhone || !body.deviceModel || !body.issueDescription) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp tên, số điện thoại, dòng máy và mô tả lỗi' },
        { status: 400 }
      );
    }

    const count = await prisma.repairTicket.count();
    const ticketCode = `SC-2608-${String(count + 1).padStart(3, '0')}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const initialHistory = [
      {
        step: 'received',
        label: 'Tiếp nhận máy tại quầy',
        time: now,
        note: 'Biên nhận sửa chữa K80 được tạo tự động và lưu vào CSDL MySQL.',
        actor: 'Lễ tân tiếp nhận',
      },
    ];

    // 1. Ensure Customer exists (Toàn vẹn khóa ngoại)
    await prisma.customer.upsert({
      where: { phone: body.customerPhone.trim() },
      update: {
        name: body.customerName.trim(),
        repairCount: { increment: 1 },
      },
      create: {
        id: 'cust-' + Date.now(),
        name: body.customerName.trim(),
        phone: body.customerPhone.trim(),
        address: body.customerAddress || null,
        totalSpent: 0,
        purchaseCount: 0,
        repairCount: 1,
        points: 10,
      },
    });

    // 2. Create RepairTicket in MySQL
    const newTicket = await prisma.repairTicket.create({
      data: {
        id: 'rep-' + Date.now(),
        ticketCode,
        customerName: body.customerName,
        customerPhone: body.customerPhone.trim(),
        customerAddress: body.customerAddress || 'Khách đặt online',
        deviceModel: body.deviceModel,
        imeiOrSerial: body.imeiOrSerial || 'OL-' + Math.floor(100000 + Math.random() * 900000),
        unlockPasscode: body.unlockPasscode || 'Chưa cung cấp',
        appearanceCondition: body.appearanceCondition || 'Tiếp nhận đặt hẹn online',
        accessoriesIncluded: body.accessoriesIncluded || 'Khách tự mang máy đến',
        issueDescription: body.issueDescription,
        technicianNotes: body.technicianNotes || '',
        status: 'received',
        statusHistory: JSON.stringify(initialHistory),
        partsUsed: JSON.stringify([]),
        laborFee: Number(body.laborFee || 150000),
        totalAmount: Number(body.laborFee || 150000),
        estimatedDeliveryDate: body.estimatedDeliveryDate || `${now.split(' ')[0]} 18:00:00`,
        receivedAt: now,
        technicianId: 'ktv-1',
        technicianName: 'Trần Trọng Nghĩa',
        warrantyPeriod: 'Bảo hành 12 tháng linh kiện',
      },
    });

    // Also sync in-memory
    ServerStore.createRepair({
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerAddress: body.customerAddress,
      deviceModel: body.deviceModel,
      imeiOrSerial: newTicket.imeiOrSerial,
      unlockPasscode: newTicket.unlockPasscode,
      issueDescription: body.issueDescription,
      laborFee: newTicket.laborFee,
    });

    return NextResponse.json(
      {
        success: true,
        source: 'mysql_database',
        message: 'Tiếp nhận yêu cầu sửa chữa thành công',
        data: {
          ...newTicket,
          statusHistory: initialHistory,
          partsUsed: [],
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Repairs POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi tiếp nhận sửa chữa: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
