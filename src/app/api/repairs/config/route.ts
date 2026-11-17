import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  initialRepairDeviceOptions,
  initialRepairServiceCatalog,
  initialRepairSymptoms,
  initialRepairTimeSlots,
} from '@/lib/store';

export async function GET(request: NextRequest) {
  try {
    let dbServices: any[] = [];
    try {
      dbServices = await db.query(
        'SELECT * FROM repairservice WHERE isActive = 1 ORDER BY isFeatured DESC, createdAt DESC'
      );
    } catch (e) {
      console.warn('DB read notice for repair services:', e);
    }

    const services = dbServices.length > 0 ? dbServices.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      deviceBrand: s.deviceBrand,
      price: Number(s.price || 0),
      warranty: s.warrantyPeriod || '12 Tháng',
      estimatedMinutes: s.estimatedMinutes || 30,
      description: s.description || '',
      isActive: Boolean(s.isActive),
    })) : initialRepairServiceCatalog;

    return NextResponse.json({
      success: true,
      data: {
        devices: initialRepairDeviceOptions,
        services,
        symptoms: initialRepairSymptoms,
        timeSlots: initialRepairTimeSlots,
      },
    });
  } catch (error: any) {
    console.error('Repair config GET error:', error);
    return NextResponse.json(
      {
        success: true,
        data: {
          devices: initialRepairDeviceOptions,
          services: initialRepairServiceCatalog,
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
    const { action, type, item } = body;

    // Save service to database if action is related to repair service
    if (type === 'service') {
      if ((action === 'add' || action === 'update') && item) {
        try {
          const serviceId = item.id || 'srv_' + Date.now();
          const existing = await db.queryOne('SELECT id FROM repairservice WHERE id = ?', [serviceId]);

          if (existing) {
            await db.execute(
              `UPDATE repairservice SET 
                 name = ?, category = ?, deviceBrand = ?, deviceModels = ?, price = ?, 
                 warrantyPeriod = ?, estimatedMinutes = ?, description = ?, isActive = ?, updatedAt = NOW()
               WHERE id = ?`,
              [
                item.name,
                item.category || 'other',
                item.deviceBrand || 'Apple',
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
               (id, name, category, deviceBrand, deviceModels, price, warrantyPeriod, estimatedMinutes, description, isActive, createdAt, updatedAt)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [
                serviceId,
                item.name,
                item.category || 'other',
                item.deviceBrand || 'Apple',
                item.deviceModels || 'Tất cả dòng máy',
                Number(item.price) || 0,
                item.warranty || '12 Tháng',
                Number(item.estimatedMinutes) || 30,
                item.description || null,
                item.isActive !== undefined ? (item.isActive ? 1 : 0) : 1,
              ]
            );
          }
        } catch (dbErr) {
          console.warn('DB upsert notice for repair service:', dbErr);
        }
      } else if (action === 'delete' && body.id) {
        try {
          await db.execute('DELETE FROM repairservice WHERE id = ?', [body.id]);
        } catch (dbErr) {
          console.warn('DB delete notice for repair service:', dbErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Cập nhật cấu hình bàn sửa chữa thành công',
    });
  } catch (error: any) {
    console.error('Repair config POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi cập nhật cấu hình sửa chữa: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
