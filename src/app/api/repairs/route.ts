import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ServerStore } from '@/lib/serverStore';
import {
  normalizePhone,
  isValidPhone,
  isValidAmount,
  sanitizeString,
  VALID_REPAIR_STATUSES,
  ValidRepairStatus,
} from '@/lib/validation';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code')?.trim();

  try {
    if (code) {
      const cleanCode = code.trim();
      const normalizedPhone = normalizePhone(cleanCode);

      // Search MySQL by ticketCode, phone, or IMEI
      const repair = await prisma.repairTicket.findFirst({
        where: {
          OR: [
            { ticketCode: cleanCode },
            { customerPhone: cleanCode },
            ...(normalizedPhone ? [{ customerPhone: normalizedPhone }] : []),
            { imeiOrSerial: cleanCode },
          ],
        },
        include: {
          parts: true,
          statusLogs: { orderBy: { createdAt: 'asc' } },
        },
      });

      if (repair) {
        return NextResponse.json({
          success: true,
          source: 'mysql_database',
          data: {
            ...repair,
            statusHistory: repair.statusHistory
              ? JSON.parse(repair.statusHistory)
              : repair.statusLogs.map((l) => ({
                  step: l.status,
                  label: l.statusLabel,
                  time: l.createdAt.toISOString().replace('T', ' ').substring(0, 19),
                  note: l.note,
                  actor: l.updatedBy,
                })),
            partsUsed: repair.partsUsed
              ? JSON.parse(repair.partsUsed)
              : repair.parts.map((p) => ({
                  partId: p.sparePartId,
                  partName: p.partName,
                  quantity: p.quantity,
                  unitPrice: p.unitPrice,
                })),
          },
        });
      }

      // Fallback
      const fallback = ServerStore.getRepairByCode(cleanCode);
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
      include: {
        parts: true,
        statusLogs: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const parsed = repairs.map((r) => ({
      ...r,
      statusHistory: r.statusHistory
        ? JSON.parse(r.statusHistory)
        : r.statusLogs.map((l) => ({
            step: l.status,
            label: l.statusLabel,
            time: l.createdAt.toISOString().replace('T', ' ').substring(0, 19),
            note: l.note,
            actor: l.updatedBy,
          })),
      partsUsed: r.partsUsed
        ? JSON.parse(r.partsUsed)
        : r.parts.map((p) => ({
            partId: p.sparePartId,
            partName: p.partName,
            quantity: p.quantity,
            unitPrice: p.unitPrice,
          })),
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

    const customerName = sanitizeString(body.customerName, 100);
    const rawPhone = String(body.customerPhone || '');
    const customerPhone = normalizePhone(rawPhone);
    const deviceModel = sanitizeString(body.deviceModel, 100);
    const issueDescription = sanitizeString(body.issueDescription, 2000);

    // Business Constraints Validation
    if (!customerName || customerName.length < 2) {
      return NextResponse.json(
        { error: 'Họ tên khách hàng không được để trống (tối thiểu 2 ký tự)' },
        { status: 400 }
      );
    }

    if (!isValidPhone(customerPhone)) {
      return NextResponse.json(
        { error: 'Số điện thoại khách hàng không hợp lệ (cần đúng định dạng số ĐT Việt Nam 10 số)' },
        { status: 400 }
      );
    }

    if (!deviceModel) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp dòng máy cần tiếp nhận sửa chữa' },
        { status: 400 }
      );
    }

    if (!issueDescription) {
      return NextResponse.json(
        { error: 'Vui lòng nhập mô tả tình trạng lỗi của thiết bị' },
        { status: 400 }
      );
    }

    const laborFee = Number(body.laborFee || 150000);
    if (!isValidAmount(laborFee)) {
      return NextResponse.json(
        { error: 'Chi phí công sửa chữa / tiền dịch vụ không được âm' },
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
      where: { phone: customerPhone },
      update: {
        name: customerName,
        repairCount: { increment: 1 },
      },
      create: {
        id: 'cust-' + Date.now(),
        name: customerName,
        phone: customerPhone,
        address: body.customerAddress ? sanitizeString(body.customerAddress, 191) : null,
        totalSpent: 0,
        purchaseCount: 0,
        repairCount: 1,
        points: 10,
      },
    });

    // 2. Resolve a valid technician from User table to strictly preserve Foreign Key integrity
    let technicianId = body.technicianId ? sanitizeString(body.technicianId, 50) : null;
    let technicianName = body.technicianName ? sanitizeString(body.technicianName, 100) : null;

    if (technicianId) {
      const foundTech = await prisma.user.findFirst({
        where: { id: technicianId, role: 'technician' },
        select: { id: true, name: true },
      });
      if (foundTech) {
        technicianId = foundTech.id;
        technicianName = technicianName || foundTech.name;
      }
    }

    if (!technicianId) {
      const fallbackTech = await prisma.user.findFirst({
        where: { role: 'technician', isActive: true },
        select: { id: true, name: true },
      });
      technicianId = fallbackTech?.id || null;
      technicianName = technicianName || fallbackTech?.name || 'Trần Trọng Nghĩa (KTV Trưởng)';
    }

    // 2.1 Calculate SLA Deadline
    const deadlineMinutes = body.deadlineMinutes ? Number(body.deadlineMinutes) : 60;
    let deadlineTime = body.deadlineTime ? sanitizeString(body.deadlineTime, 50) : null;
    if (!deadlineTime && deadlineMinutes > 0) {
      const d = new Date(Date.now() + deadlineMinutes * 60 * 1000);
      const pad = (n: number) => n.toString().padStart(2, '0');
      deadlineTime = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
    }
    const assignedBy = body.assignedBy ? sanitizeString(body.assignedBy, 100) : 'Chủ shop / Thu ngân';

    // 3. Create RepairTicket in MySQL
    const newTicket = await prisma.repairTicket.create({
      data: {
        id: 'rep-' + Date.now(),
        ticketCode,
        customerName,
        customerPhone,
        customerAddress: sanitizeString(body.customerAddress || 'Khách đặt online', 191),
        deviceModel,
        imeiOrSerial: sanitizeString(body.imeiOrSerial || 'OL-' + Math.floor(100000 + Math.random() * 900000), 50),
        unlockPasscode: sanitizeString(body.unlockPasscode || 'Chưa cung cấp', 50),
        appearanceCondition: sanitizeString(body.appearanceCondition || 'Tiếp nhận đặt hẹn online', 500),
        accessoriesIncluded: sanitizeString(body.accessoriesIncluded || 'Khách tự mang máy đến', 500),
        issueDescription,
        technicianNotes: body.technicianNotes ? sanitizeString(body.technicianNotes, 1000) : '',
        status: 'received',
        statusHistory: JSON.stringify(initialHistory),
        partsUsed: JSON.stringify([]),
        laborFee,
        totalAmount: laborFee,
        estimatedDeliveryDate: deadlineTime || (body.estimatedDeliveryDate
          ? sanitizeString(body.estimatedDeliveryDate, 50)
          : `${now.split(' ')[0]} 18:00:00`),
        deadlineTime,
        deadlineMinutes,
        assignedBy,
        receivedAt: now,
        technicianId,
        technicianName,
        warrantyPeriod: sanitizeString(body.warrantyPeriod || 'Bảo hành 12 tháng linh kiện', 100),
      },
    });

    // 3.1. Insert into 3NF RepairStatusHistory table
    await prisma.repairStatusHistory.create({
      data: {
        ticketCode,
        status: 'received',
        statusLabel: 'Tiếp nhận máy tại quầy',
        note: 'Biên nhận sửa chữa K80 được tạo tự động và lưu vào CSDL MySQL.',
        updatedBy: sanitizeString(assignedBy || 'Lễ tân tiếp nhận', 100),
      },
    });

    // Also sync in-memory
    ServerStore.createRepair({
      customerName,
      customerPhone,
      customerAddress: body.customerAddress,
      deviceModel,
      imeiOrSerial: newTicket.imeiOrSerial,
      unlockPasscode: newTicket.unlockPasscode,
      issueDescription,
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      ticketCode,
      status,
      note,
      actor,
      partsUsed,
      laborFee,
      technicianNotes,
      technicianId,
      technicianName,
      deadlineTime,
      deadlineMinutes,
      assignedBy,
    } = body;

    const identifier = id || ticketCode;
    if (!identifier) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp ID hoặc Mã phiếu sửa chữa cần cập nhật' },
        { status: 400 }
      );
    }

    const ticket = await prisma.repairTicket.findFirst({
      where: {
        OR: [{ id: identifier }, { ticketCode: identifier }],
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Không tìm thấy phiếu sửa chữa trong cơ sở dữ liệu' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updateData: any = {};

    // Validate Status constraint if provided
    if (status) {
      if (!VALID_REPAIR_STATUSES.includes(status as ValidRepairStatus)) {
        return NextResponse.json(
          {
            error: `Trạng thái không hợp lệ. Chỉ chấp nhận một trong các trạng thái: ${VALID_REPAIR_STATUSES.join(', ')}`,
          },
          { status: 400 }
        );
      }

      const currentHistory = ticket.statusHistory ? JSON.parse(ticket.statusHistory) : [];
      const statusLabels: Record<string, string> = {
        received: 'Tiếp nhận máy',
        inspecting: 'Kiểm tra kỹ thuật & Báo giá',
        repairing: 'Đang tiến hành sửa chữa',
        qc_checking: 'Kiểm tra QC xuất xưởng',
        ready_for_pickup: 'Sẵn sàng giao cho khách',
        delivered: 'Đã bàn giao máy cho khách',
        cancelled: 'Hủy sửa chữa',
      };

      const newHistoryItem = {
        step: status,
        label: statusLabels[status] || status,
        time: now,
        note: note ? sanitizeString(note, 500) : `Cập nhật trạng thái: ${statusLabels[status] || status}`,
        actor: actor ? sanitizeString(actor, 100) : 'Kỹ thuật viên',
      };

      updateData.status = status;
      updateData.statusHistory = JSON.stringify([...currentHistory, newHistoryItem]);

      // 3.1. Insert 3NF RepairStatusHistory record
      await prisma.repairStatusHistory.create({
        data: {
          ticketCode: ticket.ticketCode,
          status,
          statusLabel: statusLabels[status] || status,
          note: note ? sanitizeString(note, 500) : `Cập nhật trạng thái: ${statusLabels[status] || status}`,
          updatedBy: actor ? sanitizeString(actor, 100) : 'Kỹ thuật viên',
        },
      });

      if (status === 'delivered') {
        updateData.deliveredAt = now;
      }
    }

    if (technicianNotes !== undefined) {
      updateData.technicianNotes = sanitizeString(technicianNotes, 1000);
    }

    // Validate and update labor fee
    if (laborFee !== undefined) {
      const feeNum = Number(laborFee);
      if (!isValidAmount(feeNum)) {
        return NextResponse.json(
          { error: 'Chi phí công sửa chữa không được âm' },
          { status: 400 }
        );
      }
      updateData.laborFee = feeNum;
    }

    // Validate parts used and calculate total amount
    if (partsUsed && Array.isArray(partsUsed)) {
      updateData.partsUsed = JSON.stringify(partsUsed);
      const partsTotal = partsUsed.reduce(
        (sum: number, p: any) =>
          sum +
          (Number(p.unitPrice || p.price || p.retailRepairPrice || 0) *
            Number(p.quantity || 1)),
        0
      );
      const currentLabor = updateData.laborFee !== undefined ? updateData.laborFee : ticket.laborFee;
      updateData.totalAmount = currentLabor + partsTotal;

      // Deduct stock in SparePart table if applicable
      for (const part of partsUsed) {
        // 3.2. Insert 3NF RepairTicketPart record
        await prisma.repairTicketPart.create({
          data: {
            ticketCode: ticket.ticketCode,
            sparePartId: part.partId || part.id || null,
            partName: sanitizeString(part.partName || part.name || 'Linh kiện thay thế', 191),
            quantity: Number(part.quantity || 1),
            unitPrice: Number(part.unitPrice || part.price || part.retailRepairPrice || 0),
            warrantyMonths: 6,
          },
        });

        if (part.id || part.barcode) {
          try {
            await prisma.sparePart.updateMany({
              where: {
                OR: [
                  ...(part.id ? [{ id: part.id }] : []),
                  ...(part.barcode ? [{ barcode: part.barcode }] : []),
                ],
                stock: { gte: Number(part.quantity || 1) },
              },
              data: {
                stock: { decrement: Number(part.quantity || 1) },
              },
            });
          } catch (deductErr) {
            console.warn('Could not decrement spare part stock:', deductErr);
          }
        }
      }
    } else if (updateData.laborFee !== undefined) {
      const currentParts = ticket.partsUsed ? JSON.parse(ticket.partsUsed) : [];
      const partsTotal = currentParts.reduce(
        (sum: number, p: any) => sum + (Number(p.price || p.retailRepairPrice || 0) * Number(p.quantity || 1)),
        0
      );
      updateData.totalAmount = updateData.laborFee + partsTotal;
    }

    // Technician & SLA Deadline Assignment Updates (Chỉ định KTV & Thời hạn sửa chữa)
    let hasAssignmentChange = false;
    let assignmentNote = '';

    if (technicianId !== undefined || technicianName !== undefined) {
      let resolvedTechId = technicianId;
      let resolvedTechName = technicianName;
      if (technicianId) {
        const found = await prisma.user.findFirst({
          where: { id: technicianId, role: 'technician' },
          select: { id: true, name: true },
        });
        if (found) {
          resolvedTechId = found.id;
          resolvedTechName = technicianName || found.name;
        }
      }
      if (resolvedTechId !== undefined) updateData.technicianId = resolvedTechId;
      if (resolvedTechName !== undefined) updateData.technicianName = sanitizeString(resolvedTechName, 100);

      if (resolvedTechName && resolvedTechName !== ticket.technicianName) {
        hasAssignmentChange = true;
        assignmentNote += `Đổi KTV: ${resolvedTechName}. `;
      }
    }

    if (deadlineTime !== undefined) {
      updateData.deadlineTime = sanitizeString(deadlineTime, 50);
      updateData.estimatedDeliveryDate = sanitizeString(deadlineTime, 50);
      if (deadlineTime !== ticket.deadlineTime) {
        hasAssignmentChange = true;
        assignmentNote += `Hạn chót KTV sửa xong: ${deadlineTime}. `;
      }
    }

    if (deadlineMinutes !== undefined) {
      updateData.deadlineMinutes = Number(deadlineMinutes);
    }

    if (assignedBy !== undefined) {
      updateData.assignedBy = sanitizeString(assignedBy, 100);
    }

    // Append to status history if assignment changed and not already updated via status
    if (hasAssignmentChange && !status) {
      const currentHistory = ticket.statusHistory ? JSON.parse(ticket.statusHistory) : [];
      const assigner = assignedBy ? sanitizeString(assignedBy, 100) : (actor ? sanitizeString(actor, 100) : 'Chủ shop / Thu ngân');
      const assignmentHistoryItem = {
        step: ticket.status,
        label: 'Chỉ định KTV & Thời hạn SLA',
        time: now,
        note: assignmentNote.trim() || 'Cập nhật phân công kỹ thuật viên và thời hạn sửa',
        actor: assigner,
      };
      updateData.statusHistory = JSON.stringify([...currentHistory, assignmentHistoryItem]);
    }

    const updated = await prisma.repairTicket.update({
      where: { id: ticket.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      source: 'mysql_database',
      message: 'Cập nhật phiếu sửa chữa thành công',
      data: {
        ...updated,
        statusHistory: updated.statusHistory ? JSON.parse(updated.statusHistory) : [],
        partsUsed: updated.partsUsed ? JSON.parse(updated.partsUsed) : [],
      },
    });
  } catch (error: any) {
    console.error('Repairs PUT error:', error);
    return NextResponse.json(
      { error: 'Lỗi cập nhật phiếu sửa chữa: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
