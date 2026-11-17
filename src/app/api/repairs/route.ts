import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
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
      const repair = await db.queryOne(
        `SELECT * FROM repairticket 
         WHERE ticketCode = ? OR customerPhone = ? OR customerPhone = ? OR imeiOrSerial = ?
         LIMIT 1`,
        [cleanCode, cleanCode, normalizedPhone || cleanCode, cleanCode]
      );

      if (repair) {
        const parts = await db.query('SELECT * FROM repairticketpart WHERE ticketCode = ?', [repair.ticketCode]);
        const statusLogs = await db.query(
          'SELECT * FROM repairstatushistory WHERE ticketCode = ? ORDER BY createdAt ASC',
          [repair.ticketCode]
        );

        return NextResponse.json({
          success: true,
          source: 'mysql_database',
          data: {
            ...repair,
            statusHistory: repair.statusHistory
              ? JSON.parse(repair.statusHistory)
              : statusLogs.map((l: any) => ({
                  step: l.status,
                  label: l.statusLabel,
                  time: l.createdAt,
                  note: l.note,
                  actor: l.updatedBy,
                })),
            partsUsed: repair.partsUsed
              ? JSON.parse(repair.partsUsed)
              : parts.map((p: any) => ({
                  partId: p.sparePartId,
                  partName: p.partName,
                  quantity: p.quantity,
                  unitPrice: p.unitPrice,
                })),
            parts,
            statusLogs,
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
    const repairs = await db.query('SELECT * FROM repairticket ORDER BY createdAt DESC');
    const allParts = await db.query('SELECT * FROM repairticketpart');
    const allLogs = await db.query('SELECT * FROM repairstatushistory ORDER BY createdAt ASC');

    const partsByTicket: Record<string, any[]> = {};
    for (const p of allParts) {
      if (!partsByTicket[p.ticketCode]) partsByTicket[p.ticketCode] = [];
      partsByTicket[p.ticketCode].push(p);
    }

    const logsByTicket: Record<string, any[]> = {};
    for (const l of allLogs) {
      if (!logsByTicket[l.ticketCode]) logsByTicket[l.ticketCode] = [];
      logsByTicket[l.ticketCode].push(l);
    }

    const parsed = repairs.map((r) => ({
      ...r,
      statusHistory: r.statusHistory
        ? JSON.parse(r.statusHistory)
        : (logsByTicket[r.ticketCode] || []).map((l: any) => ({
            step: l.status,
            label: l.statusLabel,
            time: l.createdAt,
            note: l.note,
            actor: l.updatedBy,
          })),
      partsUsed: r.partsUsed
        ? JSON.parse(r.partsUsed)
        : (partsByTicket[r.ticketCode] || []).map((p: any) => ({
            partId: p.sparePartId,
            partName: p.partName,
            quantity: p.quantity,
            unitPrice: p.unitPrice,
          })),
      parts: partsByTicket[r.ticketCode] || [],
      statusLogs: logsByTicket[r.ticketCode] || [],
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

    const countRow = await db.queryOne('SELECT COUNT(*) as cnt FROM repairticket');
    const count = countRow?.cnt || 0;
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

    // 1. Ensure Customer exists
    const existingCust = await db.queryOne('SELECT id FROM customer WHERE phone = ?', [customerPhone]);
    if (existingCust) {
      await db.execute('UPDATE customer SET name = ?, repairCount = repairCount + 1, updatedAt = NOW() WHERE phone = ?', [
        customerName,
        customerPhone,
      ]);
    } else {
      await db.execute(
        `INSERT INTO customer (id, name, phone, address, totalSpent, purchaseCount, repairCount, points, membershipTier, customerType, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 0, 0, 1, 10, 'Thành viên mới', 'Khách lẻ', NOW(), NOW())`,
        ['cust-' + Date.now(), customerName, customerPhone, body.customerAddress ? sanitizeString(body.customerAddress, 191) : null]
      );
    }

    // 2. Resolve technician
    let technicianId = body.technicianId ? sanitizeString(body.technicianId, 50) : null;
    let technicianName = body.technicianName ? sanitizeString(body.technicianName, 100) : null;

    if (technicianId) {
      const foundTech = await db.queryOne('SELECT id, name FROM user WHERE id = ? AND role = "technician"', [technicianId]);
      if (foundTech) {
        technicianId = foundTech.id;
        technicianName = technicianName || foundTech.name;
      }
    }

    if (!technicianId) {
      const fallbackTech = await db.queryOne('SELECT id, name FROM user WHERE role = "technician" AND isActive = 1 LIMIT 1');
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
    const ticketId = 'rep-' + Date.now();
    const imeiOrSerial = sanitizeString(body.imeiOrSerial || 'OL-' + Math.floor(100000 + Math.random() * 900000), 50);
    const unlockPasscode = sanitizeString(body.unlockPasscode || 'Chưa cung cấp', 50);
    const estimatedDelivery = deadlineTime || (body.estimatedDeliveryDate
      ? sanitizeString(body.estimatedDeliveryDate, 50)
      : `${now.split(' ')[0]} 18:00:00`);

    await db.execute(
      `INSERT INTO repairticket 
       (id, ticketCode, customerName, customerPhone, customerAddress, deviceModel, imeiOrSerial, unlockPasscode, appearanceCondition, accessoriesIncluded, issueDescription, technicianNotes, status, statusHistory, partsUsed, laborFee, totalAmount, estimatedDeliveryDate, deadlineTime, deadlineMinutes, assignedBy, receivedAt, technicianId, technicianName, warrantyPeriod, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'received', ?, '[]', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        ticketId,
        ticketCode,
        customerName,
        customerPhone,
        sanitizeString(body.customerAddress || 'Khách đặt online', 191),
        deviceModel,
        imeiOrSerial,
        unlockPasscode,
        sanitizeString(body.appearanceCondition || 'Tiếp nhận đặt hẹn online', 500),
        sanitizeString(body.accessoriesIncluded || 'Khách tự mang máy đến', 500),
        issueDescription,
        body.technicianNotes ? sanitizeString(body.technicianNotes, 1000) : '',
        JSON.stringify(initialHistory),
        laborFee,
        laborFee,
        estimatedDelivery,
        deadlineTime,
        deadlineMinutes,
        assignedBy,
        now,
        technicianId,
        technicianName,
        sanitizeString(body.warrantyPeriod || 'Bảo hành 12 tháng linh kiện', 100),
      ]
    );

    // 3.1. Insert into 3NF RepairStatusHistory table
    const logId = 'rsh_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    await db.execute(
      `INSERT INTO repairstatushistory (id, ticketCode, status, statusLabel, note, updatedBy, createdAt)
       VALUES (?, ?, 'received', 'Tiếp nhận máy tại quầy', 'Biên nhận sửa chữa K80 được tạo tự động và lưu vào CSDL MySQL.', ?, NOW())`,
      [logId, ticketCode, sanitizeString(assignedBy || 'Lễ tân tiếp nhận', 100)]
    );

    // Also sync in-memory
    ServerStore.createRepair({
      customerName,
      customerPhone,
      customerAddress: body.customerAddress,
      deviceModel,
      imeiOrSerial,
      unlockPasscode,
      issueDescription,
      laborFee,
    });

    const newTicket = await db.queryOne('SELECT * FROM repairticket WHERE id = ?', [ticketId]);

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

    const ticket = await db.queryOne(
      'SELECT * FROM repairticket WHERE id = ? OR ticketCode = ?',
      [identifier, identifier]
    );

    if (!ticket) {
      return NextResponse.json(
        { error: 'Không tìm thấy phiếu sửa chữa trong cơ sở dữ liệu' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const setClauses: string[] = ['updatedAt = NOW()'];
    const sqlParams: any[] = [];

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

      setClauses.push('status = ?', 'statusHistory = ?');
      sqlParams.push(status, JSON.stringify([...currentHistory, newHistoryItem]));

      // Insert 3NF RepairStatusHistory record
      const rshId = 'rsh_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      await db.execute(
        `INSERT INTO repairstatushistory (id, ticketCode, status, statusLabel, note, updatedBy, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          rshId,
          ticket.ticketCode,
          status,
          statusLabels[status] || status,
          note ? sanitizeString(note, 500) : `Cập nhật trạng thái: ${statusLabels[status] || status}`,
          actor ? sanitizeString(actor, 100) : 'Kỹ thuật viên',
        ]
      );

      if (status === 'delivered') {
        setClauses.push('deliveredAt = ?');
        sqlParams.push(now);
      }
    }

    if (technicianNotes !== undefined) {
      setClauses.push('technicianNotes = ?');
      sqlParams.push(sanitizeString(technicianNotes, 1000));
    }

    let finalLaborFee = Number(ticket.laborFee || 0);
    if (laborFee !== undefined) {
      const feeNum = Number(laborFee);
      if (!isValidAmount(feeNum)) {
        return NextResponse.json(
          { error: 'Chi phí công sửa chữa không được âm' },
          { status: 400 }
        );
      }
      finalLaborFee = feeNum;
      setClauses.push('laborFee = ?');
      sqlParams.push(finalLaborFee);
    }

    // Validate parts used and calculate total amount
    if (partsUsed && Array.isArray(partsUsed)) {
      setClauses.push('partsUsed = ?');
      sqlParams.push(JSON.stringify(partsUsed));

      const partsTotal = partsUsed.reduce(
        (sum: number, p: any) =>
          sum +
          (Number(p.unitPrice || p.price || p.retailRepairPrice || 0) *
            Number(p.quantity || 1)),
        0
      );
      const totalAmount = finalLaborFee + partsTotal;
      setClauses.push('totalAmount = ?');
      sqlParams.push(totalAmount);

      // Insert 3NF RepairTicketPart record & deduct stock
      for (const part of partsUsed) {
        const rtpId = 'rtp_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
        await db.execute(
          `INSERT INTO repairticketpart (id, ticketCode, sparePartId, partName, quantity, unitPrice, warrantyMonths, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, 6, NOW())`,
          [
            rtpId,
            ticket.ticketCode,
            part.partId || part.id || null,
            sanitizeString(part.partName || part.name || 'Linh kiện thay thế', 191),
            Number(part.quantity || 1),
            Number(part.unitPrice || part.price || part.retailRepairPrice || 0),
          ]
        );

        if (part.id || part.barcode) {
          try {
            await db.execute(
              `UPDATE sparepart SET stock = GREATEST(0, stock - ?) 
               WHERE (id = ? OR barcode = ?) AND stock >= ?`,
              [Number(part.quantity || 1), part.id || '', part.barcode || '', Number(part.quantity || 1)]
            );
          } catch (deductErr) {
            console.warn('Could not decrement spare part stock:', deductErr);
          }
        }
      }
    } else if (laborFee !== undefined) {
      const currentParts = ticket.partsUsed ? JSON.parse(ticket.partsUsed) : [];
      const partsTotal = currentParts.reduce(
        (sum: number, p: any) => sum + (Number(p.price || p.retailRepairPrice || 0) * Number(p.quantity || 1)),
        0
      );
      setClauses.push('totalAmount = ?');
      sqlParams.push(finalLaborFee + partsTotal);
    }

    // Technician & SLA Deadline Assignment Updates
    let hasAssignmentChange = false;
    let assignmentNote = '';

    if (technicianId !== undefined || technicianName !== undefined) {
      let resolvedTechId = technicianId;
      let resolvedTechName = technicianName;
      if (technicianId) {
        const found = await db.queryOne('SELECT id, name FROM user WHERE id = ? AND role = "technician"', [technicianId]);
        if (found) {
          resolvedTechId = found.id;
          resolvedTechName = technicianName || found.name;
        }
      }
      if (resolvedTechId !== undefined) {
        setClauses.push('technicianId = ?');
        sqlParams.push(resolvedTechId);
      }
      if (resolvedTechName !== undefined) {
        setClauses.push('technicianName = ?');
        sqlParams.push(sanitizeString(resolvedTechName, 100));
      }

      if (resolvedTechName && resolvedTechName !== ticket.technicianName) {
        hasAssignmentChange = true;
        assignmentNote += `Đổi KTV: ${resolvedTechName}. `;
      }
    }

    if (deadlineTime !== undefined) {
      setClauses.push('deadlineTime = ?', 'estimatedDeliveryDate = ?');
      sqlParams.push(sanitizeString(deadlineTime, 50), sanitizeString(deadlineTime, 50));
      if (deadlineTime !== ticket.deadlineTime) {
        hasAssignmentChange = true;
        assignmentNote += `Hạn chót KTV sửa xong: ${deadlineTime}. `;
      }
    }

    if (deadlineMinutes !== undefined) {
      setClauses.push('deadlineMinutes = ?');
      sqlParams.push(Number(deadlineMinutes));
    }

    if (assignedBy !== undefined) {
      setClauses.push('assignedBy = ?');
      sqlParams.push(sanitizeString(assignedBy, 100));
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
      setClauses.push('statusHistory = ?');
      sqlParams.push(JSON.stringify([...currentHistory, assignmentHistoryItem]));
    }

    sqlParams.push(ticket.id);
    await db.execute(`UPDATE repairticket SET ${setClauses.join(', ')} WHERE id = ?`, sqlParams);

    const updated = await db.queryOne('SELECT * FROM repairticket WHERE id = ?', [ticket.id]);

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
