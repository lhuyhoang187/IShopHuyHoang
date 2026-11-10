import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const phones = await prisma.phoneProduct.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        phoneStocks: true,
      },
    });

    const parsed = phones.map((p) => {
      let colors = [];
      let capacities = [];
      let specs = {};

      try {
        colors = typeof p.colors === 'string' ? JSON.parse(p.colors) : p.colors || [];
      } catch (e) {
        colors = [];
      }

      try {
        capacities = typeof p.capacities === 'string' ? JSON.parse(p.capacities) : p.capacities || [];
      } catch (e) {
        capacities = [];
      }

      try {
        specs = typeof p.specs === 'string' ? JSON.parse(p.specs) : p.specs || {};
      } catch (e) {
        specs = {};
      }

      // Calculate in_stock units from physical stock
      const inStockUnits = (p.phoneStocks || []).filter((s) => s.status === 'in_stock');
      const inStockCount = inStockUnits.length;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        brand: p.brand,
        description: p.description,
        rating: p.rating,
        reviewCount: p.reviewCount,
        isHot: p.isHot,
        isNew: p.isNew,
        colors,
        capacities,
        specs,
        warrantyInfo: p.warrantyInfo,
        inStockCount,
        totalStock: (p.phoneStocks || []).length,
      };
    });

    return NextResponse.json({
      success: true,
      total: parsed.length,
      data: parsed,
    });
  } catch (error: any) {
    console.error('API /api/phones GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi truy vấn danh sách điện thoại: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}
