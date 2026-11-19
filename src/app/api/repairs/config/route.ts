import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sanitizeString } from '@/lib/validation';
import {
  initialRepairDeviceOptions,
  initialRepairServiceCatalog,
  initialRepairSymptoms,
  initialRepairTimeSlots,
} from '@/lib/store';

export const dynamic = 'force-dynamic';

async function resolveBrandId(brandName?: string): Promise<string | null> {
  if (!brandName || brandName === 'Chung' || brandName === 'Khác') return null;
  const found = await db.queryOne('SELECT id FROM phonebrand WHERE LOWER(name) = LOWER(?)', [brandName.trim()]);
  return found?.id || null;
}

export async function GET(request: NextRequest) {
  try {
    const dbServices = await db.query(
      `SELECT s.*, COALESCE(b.name, 'Chung') AS deviceBrand
       FROM repairservice s
       LEFT JOIN phonebrand b ON s.brandId = b.id
       WHERE s.isActive = 1
       ORDER BY s.isFeatured DESC, s.createdAt DESC`
    );

    const services = dbServices.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category || 'other',
      deviceBrand: s.deviceBrand || 'Apple',
      deviceModels: s.deviceModels || 'Tất cả dòng máy',
      price: Number(s.price || 0),
      warranty: s.warrantyPeriod || '12 Tháng',
      estimatedMinutes: Number(s.estimatedMinutes || 30),
      description: s.description || '',
      isActive: Boolean(s.isActive),
    }));

    const options = await db.query(
      `SELECT o.*, COALESCE(b.name, 'Khác') AS brandName
       FROM repairbookingoption o
       LEFT JOIN phonebrand b ON o.brandId = b.id
       WHERE o.isActive = 1
       ORDER BY o.displayOrder ASC, o.createdAt ASC`
    );

    const deviceRows = options.filter((o) => o.optionType === 'device');
    const symptomRows = options.filter((o) => o.optionType === 'symptom');
    const timeSlotRows = options.filter((o) => o.optionType === 'timeslot');

    const devices =
      deviceRows.length > 0
        ? deviceRows.map((d) => ({
            id: d.id,
            name: d.label,
            brand: d.brandName || 'Khác',
            isActive: Boolean(d.isActive),
          }))
        : initialRepairDeviceOptions;

    const symptoms =
      symptomRows.length > 0
        ? symptomRows.map((s) => ({
            id: s.id,
            code: s.code || s.id,
            title: s.label,
            icon: s.icon || '🛠️',
            description: s.description || '',
            isActive: Boolean(s.isActive),
          }))
        : initialRepairSymptoms;

    const timeSlots =
      timeSlotRows.length > 0
        ? timeSlotRows.map((ts) => ({
            id: ts.id,
            time: ts.code || ts.label.slice(0, 5),
            label: ts.label,
            period: (ts.subLabel as 'morning' | 'afternoon' | 'evening') || 'morning',
            isActive: Boolean(ts.isActive),
          }))
        : initialRepairTimeSlots;

    return NextResponse.json({
      success: true,
      data: {
        devices,
        services,
        symptoms,
        timeSlots,
      },
    });
  } catch (error: any) {
    console.error('Repair config GET error:', error);
    return NextResponse.json(
      {
        success: true,
        data: {
          devices: initialRepairDeviceOptions,
          services: [],
          symptoms: initialRepairSymptoms,
          timeSlots: initialRepairTimeSlots,
        },
      },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, type, item, id } = body;

    // 1. Save/delete service in 3NF repairservice table
    if (type === 'service') {
      if ((action === 'add' || action === 'update') && item) {
        const serviceId = item.id || 'srv_' + Date.now();
        const brandId = await resolveBrandId(item.deviceBrand);
        const existing = await db.queryOne('SELECT id FROM repairservice WHERE id = ?', [serviceId]);

        if (existing) {
          await db.execute(
            `UPDATE repairservice SET
               name = ?, category = ?, brandId = ?, deviceModels = ?, price = ?,
               warrantyPeriod = ?, estimatedMinutes = ?, description = ?, isActive = ?, updatedAt = NOW()
             WHERE id = ?`,
            [
              sanitizeString(item.name, 191),
              item.category || 'other',
              brandId,
              item.deviceModels || 'Tất cả dòng máy',
              Number(item.price) || 0,
              item.warranty || '12 Tháng',
              Number(item.estimatedMinutes) || 30,
              item.description || null,
              item.isActive !== undefined ? (item.isActive ? 1 : 0) : 1,
              serviceId,
            ]
          );
        } else {
          await db.execute(
            `INSERT INTO repairservice
             (id, name, category, brandId, deviceModels, price, warrantyPeriod, estimatedMinutes, description, isActive, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              serviceId,
              sanitizeString(item.name, 191),
              item.category || 'other',
              brandId,
              item.deviceModels || 'Tất cả dòng máy',
              Number(item.price) || 0,
              item.warranty || '12 Tháng',
              Number(item.estimatedMinutes) || 30,
              item.description || null,
              item.isActive !== undefined ? (item.isActive ? 1 : 0) : 1,
            ]
          );
        }
      } else if (action === 'delete' && id) {
        await db.execute('DELETE FROM repairservice WHERE id = ?', [id]);
      }
    }

    // 2. Save/delete atomic rows in 3NF repairbookingoption table
    if (type === 'device' || type === 'symptom' || type === 'timeSlot') {
      const optionType = type === 'timeSlot' ? 'timeslot' : type;

      if ((action === 'add' || action === 'update') && item) {
        const optId = item.id || `${optionType}_${Date.now()}`;
        const brandId = type === 'device' ? await resolveBrandId(item.brand) : null;
        const code =
          type === 'symptom'
            ? sanitizeString(item.code || optId, 50)
            : type === 'timeSlot'
            ? sanitizeString(item.time || '', 50)
            : null;
        const label =
          type === 'device'
            ? sanitizeString(item.name, 191)
            : type === 'symptom'
            ? sanitizeString(item.title, 191)
            : sanitizeString(item.label || item.time, 191);
        const subLabel = type === 'timeSlot' ? sanitizeString(item.period || 'morning', 100) : null;
        const description = type === 'symptom' ? sanitizeString(item.description || '', 500) : null;
        const icon = type === 'symptom' ? sanitizeString(item.icon || '🛠️', 50) : null;
        const isActive = item.isActive !== undefined ? (item.isActive ? 1 : 0) : 1;

        const existing = await db.queryOne('SELECT id FROM repairbookingoption WHERE id = ?', [optId]);
        if (existing) {
          await db.execute(
            `UPDATE repairbookingoption SET
               optionType = ?, brandId = ?, code = ?, label = ?, subLabel = ?, description = ?, icon = ?, isActive = ?, updatedAt = NOW()
             WHERE id = ?`,
            [optionType, brandId, code, label, subLabel, description, icon, isActive, optId]
          );
        } else {
          const cnt = await db.queryOne('SELECT COUNT(*) as c FROM repairbookingoption WHERE optionType = ?', [optionType]);
          await db.execute(
            `INSERT INTO repairbookingoption
             (id, optionType, brandId, code, label, subLabel, description, icon, displayOrder, isActive, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [optId, optionType, brandId, code, label, subLabel, description, icon, (cnt?.c || 0) + 1, isActive]
          );
        }
      } else if (action === 'delete' && id) {
        await db.execute('DELETE FROM repairbookingoption WHERE id = ?', [id]);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Cập nhật cấu hình bàn sửa chữa vào CSDL 3NF thành công',
    });
  } catch (error: any) {
    console.error('Repair config POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi cập nhật cấu hình sửa chữa: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
