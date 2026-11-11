import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  initialRepairDeviceOptions,
  initialRepairServiceCatalog,
  initialRepairSymptoms,
  initialRepairTimeSlots,
} from '@/lib/store';

export async function GET(request: NextRequest) {
  try {
    // 1. Try to read services from database
    let dbServices: any[] = [];
    try {
      dbServices = await prisma.repairService.findMany({
        where: { isActive: true },
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      });
    } catch (e) {
      console.warn('DB read notice for repair services:', e);
    }

    const services = dbServices.length > 0 ? dbServices.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      deviceBrand: s.deviceBrand,
      price: s.price,
      warranty: s.warrantyPeriod || '12 Tháng',
      estimatedMinutes: s.estimatedMinutes || 30,
      description: s.description || '',
      isActive: s.isActive ?? true,
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
    const { action, type, item, items } = body;

    // Save service to database if action is related to repair service
    if (type === 'service' && item) {
      try {
        await prisma.repairService.upsert({
          where: { id: item.id },
          update: {
            name: item.name,
            category: item.category || 'other',
            deviceBrand: item.deviceBrand || 'Apple',
            deviceModels: item.deviceModels || 'Tất cả dòng máy',
            price: Number(item.price) || 0,
            warrantyPeriod: item.warranty || '12 Tháng',
            estimatedMinutes: Number(item.estimatedMinutes) || 30,
            description: item.description || null,
            isActive: item.isActive ?? true,
          },
          create: {
            id: item.id,
            name: item.name,
            category: item.category || 'other',
            deviceBrand: item.deviceBrand || 'Apple',
            deviceModels: item.deviceModels || 'Tất cả dòng máy',
            price: Number(item.price) || 0,
            warrantyPeriod: item.warranty || '12 Tháng',
            estimatedMinutes: Number(item.estimatedMinutes) || 30,
            description: item.description || null,
            isActive: item.isActive ?? true,
          },
        });
      } catch (dbErr) {
        console.warn('DB upsert notice for repair service:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Đã lưu cấu hình danh mục đặt lịch sửa chữa thành công',
      data: { type, action, item, items },
    });
  } catch (error: any) {
    console.error('Repair config POST error:', error);
    return NextResponse.json(
      { error: 'Lỗi cập nhật cấu hình: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

