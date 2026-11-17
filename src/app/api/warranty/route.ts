import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ServerStore } from '@/lib/serverStore';
import { normalizePhone } from '@/lib/validation';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (
    searchParams.get('q') ||
    searchParams.get('query') ||
    searchParams.get('imei') ||
    searchParams.get('phone') ||
    searchParams.get('code') ||
    ''
  ).trim();

  if (!q) {
    return NextResponse.json(
      { error: 'Vui lòng cung cấp số IMEI, số điện thoại hoặc mã phiếu cần tra cứu' },
      { status: 400 }
    );
  }

  const normalizedPhone = normalizePhone(q);
  const upperCode = q.toUpperCase();

  try {
    const results: any[] = [];
    const seenIds = new Set<string>();

    // 1. Query PhoneStock by IMEI, Customer Phone, or Invoice ID
    const phoneStockItems = await db.query(
      `SELECT * FROM phonestock 
       WHERE imei = ? OR imei = ? OR soldToCustomerPhone = ? OR soldToCustomerPhone = ? OR soldInvoiceId = ? OR soldInvoiceId = ?
       ORDER BY createdAt DESC`,
      [q, upperCode, q, normalizedPhone || q, q, upperCode]
    );

    const today = new Date();

    for (const item of phoneStockItems) {
      if (seenIds.has(item.imei)) continue;
      seenIds.add(item.imei);

      let isExpired = false;
      let remainingDays = 0;
      let expiryDateString = '';

      if (item.soldAt) {
        const soldDate = new Date(item.soldAt);
        if (!isNaN(soldDate.getTime())) {
          const expiryDate = new Date(soldDate);
          expiryDate.setMonth(expiryDate.getMonth() + (item.warrantyMonths || 12));
          expiryDateString = expiryDate.toISOString().substring(0, 10);
          remainingDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          isExpired = remainingDays <= 0;
        }
      }

      results.push({
        type: 'phone',
        found: true,
        id: item.imei,
        imei: item.imei,
        phoneName: item.phoneName,
        color: item.color,
        capacity: item.capacity,
        sellingPrice: Number(item.sellingPrice || 0),
        status: item.status,
        warrantyMonths: Number(item.warrantyMonths || 12),
        soldAt: item.soldAt,
        soldInvoiceId: item.soldInvoiceId,
        soldToCustomerName: item.soldToCustomerName,
        soldToCustomerPhone: item.soldToCustomerPhone,
        expiryDate: expiryDateString,
        remainingDays,
        isExpired,
        warrantyType: 'Bảo hành điện tử 12 tháng chính hãng Apple / Nhà phân phối AAR',
        serviceCenter: 'Trung Tâm Kỹ Thuật iCare Service - 168 Đường 3/2, Q.10 & 45 Lê Văn Việt, TP. Thủ Đức',
      });
    }

    // 2. Query RepairTicket by Ticket Code, IMEI/Serial, or Customer Phone
    const repairTickets = await db.query(
      `SELECT * FROM repairticket 
       WHERE ticketCode = ? OR ticketCode = ? OR imeiOrSerial = ? OR customerPhone = ? OR customerPhone = ?
       ORDER BY createdAt DESC`,
      [q, upperCode, q, q, normalizedPhone || q]
    );

    for (const ticket of repairTickets) {
      if (seenIds.has(ticket.ticketCode)) continue;
      seenIds.add(ticket.ticketCode);

      const baseDate = ticket.deliveredAt ? new Date(ticket.deliveredAt) : new Date(ticket.receivedAt);
      let expiryDateString = '';
      let remainingDays = 0;
      let isExpired = false;

      if (!isNaN(baseDate.getTime())) {
        const expiryDate = new Date(baseDate);
        expiryDate.setMonth(expiryDate.getMonth() + 6); // 6 tháng bảo hành linh kiện sửa chữa
        expiryDateString = expiryDate.toISOString().substring(0, 10);
        remainingDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        isExpired = remainingDays <= 0;
      }

      results.push({
        type: 'repair',
        found: true,
        id: ticket.ticketCode,
        ticketCode: ticket.ticketCode,
        phoneName: ticket.deviceModel,
        imei: ticket.imeiOrSerial,
        status: ticket.status,
        color: 'Theo máy sửa chữa',
        capacity: 'Tiếp nhận dịch vụ',
        warrantyMonths: 6,
        soldAt: ticket.receivedAt,
        soldInvoiceId: ticket.ticketCode,
        soldToCustomerName: ticket.customerName,
        soldToCustomerPhone: ticket.customerPhone,
        issueDescription: ticket.issueDescription,
        technicianNotes: ticket.technicianNotes,
        technicianName: ticket.technicianName,
        expiryDate: expiryDateString,
        remainingDays,
        isExpired,
        warrantyType: ticket.warrantyPeriod || 'Bảo hành 06 tháng linh kiện & dịch vụ sửa chữa iCare',
        serviceCenter: 'Trung Tâm Kỹ Thuật iCare Service - 168 Đường 3/2, Q.10 & 45 Lê Văn Việt, TP. Thủ Đức',
      });
    }

    // 3. If nothing found in MySQL, check fallback ServerStore
    if (results.length === 0) {
      const fallback = ServerStore.checkWarranty(q);
      if (fallback.found) {
        results.push({
          type: 'phone',
          ...fallback,
          warrantyMonths: fallback.warrantyMonths || 12,
        });
      }
    }

    if (results.length === 0) {
      return NextResponse.json(
        {
          success: false,
          total: 0,
          message: `Không tìm thấy thông tin bảo hành cho từ khóa "${q}". Vui lòng kiểm tra lại số IMEI (15 số), số điện thoại hoặc mã phiếu hóa đơn/sửa chữa.`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      source: 'mysql_database',
      query: q,
      total: results.length,
      data: results[0],
      items: results,
    });
  } catch (error: any) {
    console.error('Warranty query error:', error);
    return NextResponse.json(
      { error: 'Lỗi tra cứu bảo hành: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
