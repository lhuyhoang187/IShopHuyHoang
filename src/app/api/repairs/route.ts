import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  normalizePhone,
  isValidPhone,
  isValidAmount,
  sanitizeString,
  VALID_REPAIR_STATUSES,
  ValidRepairStatus,
} from '@/lib/validation';

const REPAIR_SELECT_SQL = `
  SELECT r.*,
         c.name AS customerName,
         c.phone AS customerPhone,
         c.address AS customerAddress,
         u.name AS technicianName
  FROM repairticket r
  LEFT JOIN customer c ON r.customerId = c.id
  LEFT JOIN user u ON r.technicianId = u.id
`;

function formatLogItem(l: any) {
  return {
    step: l.status,
    label: l.statusLabel,
    time:
      l.createdAt instanceof Date
        ? l.createdAt.toISOString().replace('T', ' ').substring(0, 19)
        : String(l.createdAt || ''),
    note: l.note || '',
    actor: l.updatedBy || 'Hệ thống',
  };
}

function formatPartItem(p: any) {
  return {
    partId: p.sparePartId || p.id,
    partName: p.partName || 'Linh kiện thay thế',
    quantity: Number(p.quantity || 1),
    costPrice: Number(p.costPrice || 0),
    unitPrice: Number(p.unitPrice || 0),
    warrantyMonths: Number(p.warrantyMonths || 6),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code')?.trim();

  try {
    if (code) {
      const cleanCode = code.trim();
      const normalizedPhone = normalizePhone(cleanCode);

      const repair = await db.queryOne(
        `${REPAIR_SELECT_SQL}
         WHERE r.ticketCode = ? OR c.phone = ? OR c.phone = ? OR r.imeiOrSerial = ?
         LIMIT 1`,
        [cleanCode, cleanCode, normalizedPhone || cleanCode, cleanCode]
      );

      if (repair) {
        const parts = await db.query(
          `SELECT rtp.*, sp.name AS partName
           FROM repairticketpart rtp
           LEFT JOIN sparepart sp ON rtp.sparePartId = sp.id
           WHERE rtp.ticketCode = ?`,
          [repair.ticketCode]
        );
        const statusLogs = await db.query(
          'SELECT * FROM repairstatushistory WHERE ticketCode = ? ORDER BY createdAt ASC',
          [repair.ticketCode]
        );

        return NextResponse.json({
          success: true,
          source: 'mysql_database',
          data: {
            ...repair,
            statusHistory: statusLogs.map(formatLogItem),
            partsUsed: parts.map(formatPartItem),
            parts,
            statusLogs,
          },
        });
      }

      return NextResponse.json(
        { error: 'Không tìm thấy phiếu sửa chữa' },
        { status: 404 }
      );
    }

    const repairs = await db.query(`${REPAIR_SELECT_SQL} ORDER BY r.createdAt DESC`);
    const allParts = await db.query(
      `SELECT rtp.*, sp.name AS partName
       FROM repairticketpart rtp
       LEFT JOIN sparepart sp ON rtp.sparePartId = sp.id`
    );
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

    const parsed = repairs.map((r) => {
      const logs = logsByTicket[r.ticketCode] || [];
      const parts = partsByTicket[r.ticketCode] || [];
      return {
        ...r,
        statusHistory: logs.map(formatLogItem),
        partsUsed: parts.map(formatPartItem),
        parts,
        statusLogs: logs,
      };
    });

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

    // 1. Ensure Customer exists and resolve customerId FK
    const existingCust = await db.queryOne('SELECT id FROM customer WHERE phone = ?', [customerPhone]);
    let customerId: string;
    if (existingCust) {
      customerId = existingCust.id;
      await db.execute(
        `UPDATE customer SET name = ?, address = COALESCE(?, address), repairCount = repairCount + 1, updatedAt = NOW() WHERE id = ?`,
        [customerName, body.customerAddress ? sanitizeString(body.customerAddress, 191) : null, customerId]
      );
    } else {
      customerId = 'cust-' + Date.now();
      await db.execute(
        `INSERT INTO customer (id, name, phone, address, totalSpent, purchaseCount, repairCount, points, membershipTier, customerType, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 0, 0, 1, 10, 'Thành viên mới', 'Khách lẻ', NOW(), NOW())`,
        [customerId, customerName, customerPhone, body.customerAddress ? sanitizeString(body.customerAddress, 191) : null]
      );
    }

    // 2. Resolve Technician FK (user.id)
    let technicianId: string | null = body.technicianId ? sanitizeString(body.technicianId, 191) : null;
    if (technicianId) {
      const foundTech = await db.queryOne('SELECT id FROM user WHERE id = ?', [technicianId]);
      if (!foundTech) technicianId = null;
    }
    if (!technicianId && body.technicianName) {
      const byName = await db.queryOne('SELECT id FROM user WHERE name = ? LIMIT 1', [sanitizeString(body.technicianName, 100)]);
      if (byName) technicianId = byName.id;
    }
    if (!technicianId) {
      const fallbackTech = await db.queryOne('SELECT id FROM user WHERE role = "technician" AND isActive = 1 LIMIT 1');
      technicianId = fallbackTech?.id || null;
    }

    const deadlineMinutes = body.deadlineMinutes ? Number(body.deadlineMinutes) : 60;
    let deadlineTime = body.deadlineTime ? sanitizeString(body.deadlineTime, 50) : null;
    if (!deadlineTime && deadlineMinutes > 0) {
      const d = new Date(Date.now() + deadlineMinutes * 60 * 1000);
      const pad = (n: number) => n.toString().padStart(2, '0');
      deadlineTime = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
    }
    const assignedBy = body.assignedBy ? sanitizeString(body.assignedBy, 100) : 'Chủ shop / Thu ngân';

    const ticketId = 'rep-' + Date.now();
    const imeiOrSerial = sanitizeString(body.imeiOrSerial || 'OL-' + Math.floor(100000 + Math.random() * 900000), 50);
    const unlockPasscode = sanitizeString(body.unlockPasscode || 'Chưa cung cấp', 50);
    const estimatedDelivery =
      deadlineTime ||
      (body.estimatedDeliveryDate
        ? sanitizeString(body.estimatedDeliveryDate, 50)
        : `${now.split(' ')[0]} 18:00:00`);

    await db.transaction(async (conn) => {
      await conn.execute(
        `INSERT INTO repairticket
         (id, ticketCode, customerId, deviceModel, imeiOrSerial, unlockPasscode, appearanceCondition, accessoriesIncluded, issueDescription, technicianNotes, status, laborFee, totalAmount, estimatedDeliveryDate, deadlineTime, deadlineMinutes, assignedBy, receivedAt, technicianId, warrantyPeriod, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'received', ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          ticketId,
          ticketCode,
          customerId,
          deviceModel,
          imeiOrSerial,
          unlockPasscode,
          sanitizeString(body.appearanceCondition || 'Tiếp nhận đặt hẹn online', 500),
          sanitizeString(body.accessoriesIncluded || 'Khách tự mang máy đến', 500),
          issueDescription,
          body.technicianNotes ? sanitizeString(body.technicianNotes, 1000) : '',
          laborFee,
          laborFee,
          estimatedDelivery,
          deadlineTime,
          deadlineMinutes,
          assignedBy,
          now,
          technicianId,
          sanitizeString(body.warrantyPeriod || 'Bảo hành 12 tháng linh kiện', 100),
        ]
      );

      const logId = 'rsh_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      await conn.execute(
        `INSERT INTO repairstatushistory (id, ticketCode, status, statusLabel, note, updatedBy, createdAt)
         VALUES (?, ?, 'received', 'Tiếp nhận máy tại quầy', 'Biên nhận sửa chữa K80 được tạo tự động và lưu vào CSDL MySQL.', ?, NOW())`,
        [logId, ticketCode, sanitizeString(assignedBy || 'Lễ tân tiếp nhận', 100)]
      );
    });

    const newTicket = await db.queryOne(`${REPAIR_SELECT_SQL} WHERE r.id = ?`, [ticketId]);
    const statusLogs = await db.query(
      'SELECT * FROM repairstatushistory WHERE ticketCode = ? ORDER BY createdAt ASC',
      [ticketCode]
    );

    return NextResponse.json(
      {
        success: true,
        source: 'mysql_database',
        message: 'Tiếp nhận yêu cầu sửa chữa thành công',
        data: {
          ...newTicket,
          statusHistory: statusLogs.map(formatLogItem),
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
      `${REPAIR_SELECT_SQL} WHERE r.id = ? OR r.ticketCode = ?`,
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

    if (status) {
      if (!VALID_REPAIR_STATUSES.includes(status as ValidRepairStatus)) {
        return NextResponse.json(
          {
            error: `Trạng thái không hợp lệ. Chỉ chấp nhận một trong các trạng thái: ${VALID_REPAIR_STATUSES.join(', ')}`,
          },
          { status: 400 }
        );
      }

      const statusLabels: Record<string, string> = {
        received: 'Tiếp nhận máy',
        inspecting: 'Kiểm tra kỹ thuật & Báo giá',
        repairing: 'Đang tiến hành sửa chữa',
        qc_checking: 'Kiểm tra QC xuất xưởng',
        ready_for_pickup: 'Sẵn sàng giao cho khách',
        delivered: 'Đã bàn giao máy cho khách',
        cancelled: 'Hủy sửa chữa',
      };

      setClauses.push('status = ?');
      sqlParams.push(status);

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

    // Sync 3NF RepairTicketPart rows & recalculate totalAmount
    if (partsUsed && Array.isArray(partsUsed)) {
      const existingParts = await db.query('SELECT sparePartId, quantity FROM repairticketpart WHERE ticketCode = ?', [
        ticket.ticketCode,
      ]);
      const existingPartIds = new Set(existingParts.map((ep) => ep.sparePartId));

      await db.execute('DELETE FROM repairticketpart WHERE ticketCode = ?', [ticket.ticketCode]);

      let partsTotal = 0;
      for (const part of partsUsed) {
        const qty = Math.max(1, Number(part.quantity || 1));
        const unitPrice = Number(part.unitPrice || part.price || part.retailRepairPrice || 0);
        let sparePartId: string | null = part.partId || part.sparePartId || part.id || null;
        let costPrice = Number(part.costPrice || 0);

        if (sparePartId) {
          const foundSp = await db.queryOne('SELECT id, costPrice FROM sparepart WHERE id = ? OR barcode = ?', [
            sparePartId,
            sparePartId,
          ]);
          if (foundSp) {
            sparePartId = foundSp.id;
            if (!costPrice) costPrice = Number(foundSp.costPrice || 0);
          } else {
            sparePartId = null;
          }
        }

        const rtpId = 'rtp_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
        await db.execute(
          `INSERT INTO repairticketpart (id, ticketCode, sparePartId, quantity, costPrice, unitPrice, warrantyMonths, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [rtpId, ticket.ticketCode, sparePartId, qty, costPrice, unitPrice, Number(part.warrantyMonths || 6)]
        );
        partsTotal += unitPrice * qty;

        // Only deduct stock for newly added spare parts
        if (sparePartId && !existingPartIds.has(sparePartId)) {
          await db.execute(
            `UPDATE sparepart SET stock = GREATEST(0, stock - ?), updatedAt = NOW() WHERE id = ?`,
            [qty, sparePartId]
          );
        }
      }

      setClauses.push('totalAmount = ?');
      sqlParams.push(finalLaborFee + partsTotal);
    } else if (laborFee !== undefined) {
      const currentParts = await db.query('SELECT quantity, unitPrice FROM repairticketpart WHERE ticketCode = ?', [
        ticket.ticketCode,
      ]);
      const partsTotal = currentParts.reduce(
        (sum: number, p: any) => sum + Number(p.unitPrice || 0) * Number(p.quantity || 1),
        0
      );
      setClauses.push('totalAmount = ?');
      sqlParams.push(finalLaborFee + partsTotal);
    }

    // Technician & SLA Deadline Assignment Updates
    let hasAssignmentChange = false;
    let assignmentNote = '';

    if (technicianId !== undefined || technicianName !== undefined) {
      let resolvedTechId: string | null = null;
      let resolvedTechName = technicianName || '';

      if (technicianId) {
        const found = await db.queryOne('SELECT id, name FROM user WHERE id = ?', [technicianId]);
        if (found) {
          resolvedTechId = found.id;
          resolvedTechName = found.name;
        }
      } else if (technicianName) {
        const found = await db.queryOne('SELECT id, name FROM user WHERE name = ? LIMIT 1', [technicianName]);
        if (found) {
          resolvedTechId = found.id;
          resolvedTechName = found.name;
        }
      }

      setClauses.push('technicianId = ?');
      sqlParams.push(resolvedTechId);

      if (resolvedTechId && resolvedTechId !== ticket.technicianId) {
        hasAssignmentChange = true;
        assignmentNote += `Đổi KTV: ${resolvedTechName || resolvedTechId}. `;
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

    if (hasAssignmentChange && !status) {
      const assigner = assignedBy
        ? sanitizeString(assignedBy, 100)
        : actor
        ? sanitizeString(actor, 100)
        : 'Chủ shop / Thu ngân';
      const rshId = 'rsh_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      await db.execute(
        `INSERT INTO repairstatushistory (id, ticketCode, status, statusLabel, note, updatedBy, createdAt)
         VALUES (?, ?, ?, 'Chỉ định KTV & Thời hạn SLA', ?, ?, NOW())`,
        [
          rshId,
          ticket.ticketCode,
          ticket.status,
          assignmentNote.trim() || 'Cập nhật phân công kỹ thuật viên và thời hạn sửa',
          assigner,
        ]
      );
    }

    sqlParams.push(ticket.id);
    await db.execute(`UPDATE repairticket SET ${setClauses.join(', ')} WHERE id = ?`, sqlParams);

    const updated = await db.queryOne(`${REPAIR_SELECT_SQL} WHERE r.id = ?`, [ticket.id]);
    const updatedParts = await db.query(
      `SELECT rtp.*, sp.name AS partName
       FROM repairticketpart rtp
       LEFT JOIN sparepart sp ON rtp.sparePartId = sp.id
       WHERE rtp.ticketCode = ?`,
      [ticket.ticketCode]
    );
    const updatedLogs = await db.query(
      'SELECT * FROM repairstatushistory WHERE ticketCode = ? ORDER BY createdAt ASC',
      [ticket.ticketCode]
    );

    return NextResponse.json({
      success: true,
      source: 'mysql_database',
      message: 'Cập nhật phiếu sửa chữa thành công',
      data: {
        ...updated,
        statusHistory: updatedLogs.map(formatLogItem),
        partsUsed: updatedParts.map(formatPartItem),
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
