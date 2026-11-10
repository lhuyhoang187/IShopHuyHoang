import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sanitizeString } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const phone = await prisma.phoneProduct.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        phoneStocks: true,
      },
    });

    if (!phone) {
      return NextResponse.json(
        { error: 'Không tìm thấy sản phẩm điện thoại' },
        { status: 404 }
      );
    }

    const colors = phone.colors ? JSON.parse(phone.colors) : [];
    const capacities = phone.capacities ? JSON.parse(phone.capacities) : [];

    // Calculate actual IMEI stock per color and per capacity
    const inStockItems = phone.phoneStocks.filter((s) => s.status === 'in_stock');

    const colorStockCounts: Record<string, number> = {};
    const capacityStockCounts: Record<string, number> = {};
    const variantStockCounts: Record<string, number> = {};

    for (const item of inStockItems) {
      const c = item.color.trim();
      const cap = item.capacity.trim();
      colorStockCounts[c] = (colorStockCounts[c] || 0) + 1;
      capacityStockCounts[cap] = (capacityStockCounts[cap] || 0) + 1;
      const key = `${c}_${cap}`;
      variantStockCounts[key] = (variantStockCounts[key] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: phone.id,
        name: phone.name,
        slug: phone.slug,
        colors,
        capacities,
        colorStockCounts,
        capacityStockCounts,
        variantStockCounts,
        totalInStock: inStockItems.length,
      },
    });
  } catch (error: any) {
    console.error('Phone stock detail GET error:', error);
    return NextResponse.json(
      { error: 'Lỗi truy vấn tồn kho sản phẩm: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { colors, capacities, variantStocks } = body;

    const phone = await prisma.phoneProduct.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        phoneStocks: true,
      },
    });

    if (!phone) {
      return NextResponse.json(
        { error: 'Không tìm thấy sản phẩm điện thoại' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (colors && Array.isArray(colors)) {
      updateData.colors = JSON.stringify(colors);
    }
    if (capacities && Array.isArray(capacities)) {
      updateData.capacities = JSON.stringify(capacities);
    }

    // Atomic transaction: Update PhoneProduct + sync PhoneStock in MySQL
    const result = await prisma.$transaction(async (tx) => {
      const updatedPhone = await tx.phoneProduct.update({
        where: { id: phone.id },
        data: updateData,
      });

      // Synchronize PhoneStock items if variantStocks or capacities/colors are specified
      if (variantStocks && typeof variantStocks === 'object') {
        for (const [key, conf] of Object.entries(variantStocks) as [string, any][]) {
          const [colorName, capSize] = key.split('_');
          if (!colorName || !capSize) continue;

          const currentStock = await tx.phoneStock.findMany({
            where: {
              phoneId: phone.id,
              status: 'in_stock',
              color: { contains: colorName },
              capacity: { contains: capSize },
            },
          });

          if (conf.isOutOfStock) {
            // Mark existing in_stock as reserved / out of stock
            for (const item of currentStock) {
              await tx.phoneStock.update({
                where: { imei: item.imei },
                data: { status: 'reserved' },
              });
            }
          } else if (typeof conf.stock === 'number') {
            const diff = conf.stock - currentStock.length;
            if (diff > 0) {
              // Add new stock items
              const capObj = capacities?.find((c: any) => c.size === capSize);
              const sellPrice = capObj?.price || 30000000;
              const costPrice = Math.round(sellPrice * 0.85);

              for (let i = 0; i < diff; i++) {
                const imei = `35${Math.floor(1000000000000 + Math.random() * 9000000000000)}`;
                await tx.phoneStock.create({
                  data: {
                    imei,
                    phoneId: phone.id,
                    phoneName: phone.name,
                    color: colorName,
                    capacity: capSize,
                    costPrice,
                    sellingPrice: sellPrice,
                    supplierId: 'sup-1',
                    supplierName: 'Apple Authorized Distributor VN',
                    importDate: new Date().toISOString().split('T')[0],
                    status: 'in_stock',
                    warrantyMonths: 12,
                  },
                });
              }
            } else if (diff < 0) {
              // Mark excess items as reserved
              const toReserve = currentStock.slice(0, Math.abs(diff));
              for (const item of toReserve) {
                await tx.phoneStock.update({
                  where: { imei: item.imei },
                  data: { status: 'reserved' },
                });
              }
            }
          }
        }
      }

      return updatedPhone;
    });

    return NextResponse.json({
      success: true,
      message: 'Cập nhật tồn kho và trạng thái biến thể thành công!',
      data: {
        id: result.id,
        name: result.name,
        slug: result.slug,
        colors: colors || JSON.parse(result.colors),
        capacities: capacities || JSON.parse(result.capacities),
      },
    });
  } catch (error: any) {
    console.error('Phone stock update error:', error);
    return NextResponse.json(
      { error: 'Lỗi cập nhật tồn kho biến thể: ' + (error?.message || '') },
      { status: 500 }
    );
  }
}

