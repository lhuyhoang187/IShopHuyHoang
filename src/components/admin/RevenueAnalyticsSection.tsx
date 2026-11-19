'use client';

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  Receipt,
  CheckCircle2,
} from 'lucide-react';
import { Invoice, RepairTicket } from '@/lib/types';
import { formatVND } from '@/lib/vietqr';

interface RevenueAnalyticsSectionProps {
  invoices: Invoice[];
  repairs: RepairTicket[];
  phoneRevenue: number;
  accRevenue: number;
  repairRevenue: number;
  grandTotalRevenue: number;
}

type Timeframe = 'day' | 'week' | 'month' | 'quarter' | 'year';

interface ChartPoint {
  label: string;
  subLabel: string;
  revenue: number;
  profit: number;
  orders: number;
  growth: number; // percentage vs prior period
}

interface HoveredCurveState {
  x: number;
  y: number;
  revenue: number;
  profit: number;
  orders: number;
  growth: number;
  label: string;
  subLabel: string;
}

interface HoveredBarData {
  index: number;
  ratio: number; // 0.05 to 1.0 (tiến trình từ đáy lên đỉnh cột)
  revenue: number; // Doanh thu biến thiên theo độ cao chuột
  profit: number; // Lãi gộp tương ứng
  orders: number; // Số đơn tương ứng
  stageName: string; // Tên giai đoạn
  stageDesc: string; // Mô tả giai đoạn
  cutPercent: number; // % so với chiều cao thanh bar (5% - 100%)
  pixelYFromBottom: number;
}

function toDateInputString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateVN(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function extractDatePart(raw?: string): string {
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10);
  }
  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    return toDateInputString(d);
  }
  return '';
}

// Hàm xác định các giai đoạn cụ thể của từng cột theo từng timeframe
function getBarStageInfo(timeframe: Timeframe, item: ChartPoint, ratio: number) {
  const r = Math.max(0.05, Math.min(1.0, ratio));

  if (timeframe === 'day') {
    if (r <= 0.35) {
      return {
        stageName: '20 Phút Đầu Khung Giờ',
        stageDesc: `Đón khách & Tư vấn trải nghiệm (${item.label})`,
      };
    } else if (r <= 0.70) {
      return {
        stageName: '20 Phút Giữa Khung Giờ',
        stageDesc: `Chốt đơn POS & Tiếp nhận kỹ thuật (${item.label})`,
      };
    } else {
      return {
        stageName: '20 Phút Cuối Khung Giờ',
        stageDesc: `Thanh toán VietQR & Xuất hóa đơn (${item.label})`,
      };
    }
  }

  if (timeframe === 'week') {
    if (r <= 0.35) {
      return {
        stageName: 'Ca Sáng (08:00 - 12:00)',
        stageDesc: 'Mở cửa ca sáng & Đón khách mua máy, phụ kiện',
      };
    } else if (r <= 0.70) {
      return {
        stageName: 'Ca Chiều (12:00 - 18:00)',
        stageDesc: 'Cao điểm giao nhận máy & Khách trả sửa chữa',
      };
    } else {
      return {
        stageName: 'Ca Tối (18:00 - 21:30)',
        stageDesc: 'Chốt ca tối & Mua sắm sau giờ làm việc',
      };
    }
  }

  if (timeframe === 'month') {
    if (r <= 0.35) {
      return {
        stageName: 'Đầu tuần (Thứ 2 - Thứ 4)',
        stageDesc: 'Khởi động bán hàng & Nhập bổ sung máy mới',
      };
    } else if (r <= 0.70) {
      return {
        stageName: 'Giữa tuần (Thứ 5 - Thứ 6)',
        stageDesc: 'Tăng tốc hồ sơ trả góp & Bảo dưỡng iCare',
      };
    } else {
      return {
        stageName: 'Cuối tuần (Thứ 7 - CN)',
        stageDesc: 'Đỉnh điểm mua sắm & Khuyến mãi cuối tuần',
      };
    }
  }

  if (timeframe === 'quarter') {
    const qNum = parseInt(item.label.replace(/\D/g, '')) || 1;
    const startMonth = (qNum - 1) * 3 + 1;
    if (r <= 0.35) {
      return {
        stageName: `Tháng ${startMonth} (Đầu Quý)`,
        stageDesc: `Khởi động doanh số Tháng ${startMonth}/2026`,
      };
    } else if (r <= 0.70) {
      return {
        stageName: `Tháng ${startMonth + 1} (Giữa Quý)`,
        stageDesc: `Tăng tốc doanh thu Tháng ${startMonth + 1}/2026`,
      };
    } else {
      return {
        stageName: `Tháng ${startMonth + 2} (Cuối Quý)`,
        stageDesc: `Về đích & Chốt chỉ tiêu Tháng ${startMonth + 2}/2026`,
      };
    }
  }

  // timeframe === 'year'
  if (r <= 0.35) {
    return {
      stageName: '10 Ngày Đầu Tháng (01 - 10)',
      stageDesc: 'Đợt nhận lương & Nhu cầu đổi máy mới',
    };
  } else if (r <= 0.70) {
    return {
      stageName: '10 Ngày Giữa Tháng (11 - 20)',
      stageDesc: 'Bán lẻ phụ kiện & Dịch vụ sửa chữa đều đặn',
    };
  } else {
    return {
      stageName: '10 Ngày Cuối Tháng (21 - 31)',
      stageDesc: 'Đẩy số cuối tháng & Chốt doanh số tháng',
    };
  }
}

export default function RevenueAnalyticsSection({
  invoices,
  repairs,
  phoneRevenue,
  accRevenue,
  repairRevenue,
  grandTotalRevenue,
}: RevenueAnalyticsSectionProps) {
  const todayStr = useMemo(() => toDateInputString(new Date()), []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return toDateInputString(d);
  }, []);

  const [timeframe, setTimeframe] = useState<Timeframe>('day');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // TÁCH BIỆT TRẠNG THÁI HOVER CHO TỪNG BIỂU ĐỒ (Hoạt động độc lập 100%)
  const [hoveredBarData, setHoveredBarData] = useState<HoveredBarData | null>(null);
  const [hoveredDonutSegment, setHoveredDonutSegment] = useState<'phone' | 'accessory' | 'repair' | null>(null);
  const [hoveredCurve, setHoveredCurve] = useState<HoveredCurveState | null>(null);

  // Danh sách các ngày có phát sinh hóa đơn thực tế trong CSDL để chọn nhanh 1 chạm
  const activeInvoiceDates = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach((inv) => {
      const dStr = extractDatePart(inv.createdAt);
      if (dStr) set.add(dStr);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a)).slice(0, 4);
  }, [invoices]);

  // Chuyển ngày trước / ngày sau
  const shiftSelectedDate = (deltaDays: number) => {
    const d = new Date(selectedDate + 'T00:00:00');
    if (isNaN(d.getTime())) return;
    d.setDate(d.getDate() + deltaDays);
    setSelectedDate(toDateInputString(d));
    setHoveredBarData(null);
    setHoveredCurve(null);
  };

  // Dữ liệu thực tế của ngày được chọn (từ hóa đơn & phiếu sửa chữa)
  const dailyRealBreakdown = useMemo(() => {
    const dayInvoices = invoices.filter((inv) => extractDatePart(inv.createdAt) === selectedDate);
    const dayRepairs = repairs.filter(
      (rep) => rep.status !== 'cancelled' && extractDatePart(rep.receivedAt || rep.deliveredAt) === selectedDate
    );

    let realPhone = 0;
    let realAcc = 0;
    let realRepair = 0;

    dayInvoices.forEach((inv) => {
      if (Array.isArray(inv.items) && inv.items.length > 0) {
        inv.items.forEach((it) => {
          const itemTotal = Number(it.total) || Number(it.unitPrice || 0) * Number(it.quantity || 1);
          if (it.type === 'accessory') realAcc += itemTotal;
          else if (it.type === 'repair') realRepair += itemTotal;
          else realPhone += itemTotal;
        });
      } else {
        realPhone += Number(inv.totalAmount) || 0;
      }
    });

    dayRepairs.forEach((rep) => {
      realRepair += Number(rep.totalAmount) || 0;
    });

    const totalReal = realPhone + realAcc + realRepair;

    return {
      dayInvoices,
      dayRepairs,
      realPhone,
      realAcc,
      realRepair,
      totalReal,
      hasRealTransactions: dayInvoices.length > 0 || dayRepairs.length > 0,
    };
  }, [invoices, repairs, selectedDate]);

  // 100% REAL revenue, profit, and order aggregation from live MySQL invoices & repairs
  const chartData: ChartPoint[] = useMemo(() => {
    const parseTimestamp = (raw?: string): Date | null => {
      if (!raw) return null;
      const d = new Date(raw.includes('T') ? raw : raw.replace(' ', 'T'));
      return isNaN(d.getTime()) ? null : d;
    };

    const getInvoiceProfit = (inv: Invoice): number => {
      if (Array.isArray(inv.items) && inv.items.length > 0) {
        const cost = inv.items.reduce(
          (sum, it: any) => sum + (Number(it.costPrice) || 0) * (Number(it.quantity) || 1),
          0
        );
        if (cost > 0) return Math.max(0, (Number(inv.totalAmount) || 0) - cost);
      }
      return Math.round((Number(inv.totalAmount) || 0) * 0.15);
    };

    const getRepairProfit = (rep: RepairTicket): number => {
      if (Array.isArray(rep.partsUsed) && rep.partsUsed.length > 0) {
        const cost = rep.partsUsed.reduce(
          (sum, p: any) => sum + (Number(p.costPrice) || 0) * (Number(p.quantity) || 1),
          0
        );
        if (cost > 0) return Math.max(0, (Number(rep.totalAmount) || 0) - cost);
      }
      return Math.round((Number(rep.totalAmount) || 0) * 0.5);
    };

    const activeRepairs = repairs.filter((r) => r.status !== 'cancelled');
    const refDate = new Date(selectedDate + 'T00:00:00');
    const safeRef = isNaN(refDate.getTime()) ? new Date() : refDate;
    const refYear = safeRef.getFullYear();
    const refMonth = safeRef.getMonth();

    const computeGrowth = (rev: number, prevRev: number): number => {
      if (prevRev <= 0) return rev > 0 ? 100 : 0;
      return Math.round(((rev - prevRev) / prevRev) * 100);
    };

    if (timeframe === 'day') {
      const slots = [
        { label: '08h - 10h', sub: `Mở cửa ca sáng (${formatDateVN(selectedDate)})`, minH: 0, maxH: 10 },
        { label: '10h - 12h', sub: `Cao điểm sáng (${formatDateVN(selectedDate)})`, minH: 10, maxH: 12 },
        { label: '12h - 14h', sub: `Khung giờ trưa (${formatDateVN(selectedDate)})`, minH: 12, maxH: 14 },
        { label: '14h - 16h', sub: `Đầu ca chiều (${formatDateVN(selectedDate)})`, minH: 14, maxH: 16 },
        { label: '16h - 18h', sub: `Cao điểm chiều (${formatDateVN(selectedDate)})`, minH: 16, maxH: 18 },
        { label: '18h - 20h', sub: `Cao điểm tối (${formatDateVN(selectedDate)})`, minH: 18, maxH: 20 },
        { label: '20h - 22h', sub: `Chốt ca tối (${formatDateVN(selectedDate)})`, minH: 20, maxH: 24 },
      ];

      const totals = slots.map((slot) => {
        let revenue = 0;
        let profit = 0;
        let orders = 0;

        dailyRealBreakdown.dayInvoices.forEach((inv) => {
          const dt = parseTimestamp(inv.createdAt);
          const h = dt ? dt.getHours() : 10;
          if (h >= slot.minH && h < slot.maxH) {
            revenue += Number(inv.totalAmount) || 0;
            profit += getInvoiceProfit(inv);
            orders += 1;
          }
        });

        dailyRealBreakdown.dayRepairs.forEach((rep) => {
          const dt = parseTimestamp(rep.receivedAt || rep.deliveredAt);
          const h = dt ? dt.getHours() : 10;
          if (h >= slot.minH && h < slot.maxH) {
            revenue += Number(rep.totalAmount) || 0;
            profit += getRepairProfit(rep);
            orders += 1;
          }
        });

        return { label: slot.label, subLabel: slot.sub, revenue, profit, orders };
      });

      return totals.map((item, i) => ({
        ...item,
        growth: computeGrowth(item.revenue, i > 0 ? totals[i - 1].revenue : 0),
      }));
    }

    if (timeframe === 'week') {
      // Monday -> Sunday of the week containing selectedDate
      const dayOfWeek = safeRef.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(safeRef);
      monday.setDate(safeRef.getDate() + diffToMonday);
      const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

      const totals = dayNames.map((label, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dateKey = toDateInputString(d);
        let revenue = 0;
        let profit = 0;
        let orders = 0;

        invoices.forEach((inv) => {
          if (extractDatePart(inv.createdAt) === dateKey) {
            revenue += Number(inv.totalAmount) || 0;
            profit += getInvoiceProfit(inv);
            orders += 1;
          }
        });
        activeRepairs.forEach((rep) => {
          if (extractDatePart(rep.receivedAt || rep.deliveredAt) === dateKey) {
            revenue += Number(rep.totalAmount) || 0;
            profit += getRepairProfit(rep);
            orders += 1;
          }
        });

        return { label, subLabel: formatDateVN(dateKey), revenue, profit, orders };
      });

      return totals.map((item, i) => ({
        ...item,
        growth: computeGrowth(item.revenue, i > 0 ? totals[i - 1].revenue : 0),
      }));
    }

    if (timeframe === 'month') {
      const mm = String(refMonth + 1).padStart(2, '0');
      const lastDay = new Date(refYear, refMonth + 1, 0).getDate();
      const weekRanges = [
        { label: 'Tuần 1', sub: `01/${mm} - 07/${mm}`, start: 1, end: 7 },
        { label: 'Tuần 2', sub: `08/${mm} - 14/${mm}`, start: 8, end: 14 },
        { label: 'Tuần 3', sub: `15/${mm} - 21/${mm}`, start: 15, end: 21 },
        { label: 'Tuần 4', sub: `22/${mm} - ${lastDay}/${mm}`, start: 22, end: 31 },
      ];

      const totals = weekRanges.map((w) => {
        let revenue = 0;
        let profit = 0;
        let orders = 0;

        invoices.forEach((inv) => {
          const dt = parseTimestamp(inv.createdAt);
          if (dt && dt.getFullYear() === refYear && dt.getMonth() === refMonth) {
            const dom = dt.getDate();
            if (dom >= w.start && dom <= w.end) {
              revenue += Number(inv.totalAmount) || 0;
              profit += getInvoiceProfit(inv);
              orders += 1;
            }
          }
        });
        activeRepairs.forEach((rep) => {
          const dt = parseTimestamp(rep.receivedAt || rep.deliveredAt);
          if (dt && dt.getFullYear() === refYear && dt.getMonth() === refMonth) {
            const dom = dt.getDate();
            if (dom >= w.start && dom <= w.end) {
              revenue += Number(rep.totalAmount) || 0;
              profit += getRepairProfit(rep);
              orders += 1;
            }
          }
        });

        return { label: w.label, subLabel: w.sub, revenue, profit, orders };
      });

      return totals.map((item, i) => ({
        ...item,
        growth: computeGrowth(item.revenue, i > 0 ? totals[i - 1].revenue : 0),
      }));
    }

    if (timeframe === 'quarter') {
      const quarters = [
        { label: 'Quý 1', sub: `Tháng 1 - Tháng 3/${refYear}`, startM: 0, endM: 2 },
        { label: 'Quý 2', sub: `Tháng 4 - Tháng 6/${refYear}`, startM: 3, endM: 5 },
        { label: 'Quý 3', sub: `Tháng 7 - Tháng 9/${refYear}`, startM: 6, endM: 8 },
        { label: 'Quý 4', sub: `Tháng 10 - Tháng 12/${refYear}`, startM: 9, endM: 11 },
      ];

      const totals = quarters.map((q) => {
        let revenue = 0;
        let profit = 0;
        let orders = 0;

        invoices.forEach((inv) => {
          const dt = parseTimestamp(inv.createdAt);
          if (dt && dt.getFullYear() === refYear && dt.getMonth() >= q.startM && dt.getMonth() <= q.endM) {
            revenue += Number(inv.totalAmount) || 0;
            profit += getInvoiceProfit(inv);
            orders += 1;
          }
        });
        activeRepairs.forEach((rep) => {
          const dt = parseTimestamp(rep.receivedAt || rep.deliveredAt);
          if (dt && dt.getFullYear() === refYear && dt.getMonth() >= q.startM && dt.getMonth() <= q.endM) {
            revenue += Number(rep.totalAmount) || 0;
            profit += getRepairProfit(rep);
            orders += 1;
          }
        });

        return { label: q.label, subLabel: q.sub, revenue, profit, orders };
      });

      return totals.map((item, i) => ({
        ...item,
        growth: computeGrowth(item.revenue, i > 0 ? totals[i - 1].revenue : 0),
      }));
    }

    // Year: 12 real months of selected year
    const totals = Array.from({ length: 12 }, (_, mIdx) => {
      let revenue = 0;
      let profit = 0;
      let orders = 0;

      invoices.forEach((inv) => {
        const dt = parseTimestamp(inv.createdAt);
        if (dt && dt.getFullYear() === refYear && dt.getMonth() === mIdx) {
          revenue += Number(inv.totalAmount) || 0;
          profit += getInvoiceProfit(inv);
          orders += 1;
        }
      });
      activeRepairs.forEach((rep) => {
        const dt = parseTimestamp(rep.receivedAt || rep.deliveredAt);
        if (dt && dt.getFullYear() === refYear && dt.getMonth() === mIdx) {
          revenue += Number(rep.totalAmount) || 0;
          profit += getRepairProfit(rep);
          orders += 1;
        }
      });

      return {
        label: `T${mIdx + 1}`,
        subLabel: `Tháng ${mIdx + 1}/${refYear}`,
        revenue,
        profit,
        orders,
      };
    });

    return totals.map((item, i) => ({
      ...item,
      growth: computeGrowth(item.revenue, i > 0 ? totals[i - 1].revenue : 0),
    }));
  }, [timeframe, invoices, repairs, selectedDate, dailyRealBreakdown]);

  // Max value for bar scaling
  const maxRevenue = useMemo(() => {
    const maxVal = Math.max(...chartData.map((d) => d.revenue));
    return maxVal > 0 ? maxVal : 1;
  }, [chartData]);

  // Total period revenue (100% real)
  const totalPeriodRevenue = useMemo(() => {
    if (timeframe === 'day') {
      return dailyRealBreakdown.totalReal;
    }
    return chartData.reduce((sum, d) => sum + d.revenue, 0);
  }, [chartData, timeframe, dailyRealBreakdown.totalReal]);

  // =========================================================================
  // 1. REVENUE STREAMS & DONUT CHART RATIOS (100% REAL DATA)
  // =========================================================================
  const {
    streamPhoneRevenue,
    streamAccRevenue,
    streamRepairRevenue,
    phonePercent,
    accPercent,
    repairPercent,
    streamPhoneProfit,
    streamAccProfit,
    streamRepairProfit,
  } = useMemo(() => {
    const pRev = timeframe === 'day' ? dailyRealBreakdown.realPhone : Math.max(0, phoneRevenue);
    const aRev = timeframe === 'day' ? dailyRealBreakdown.realAcc : Math.max(0, accRevenue);
    const rRev = timeframe === 'day' ? dailyRealBreakdown.realRepair : Math.max(0, repairRevenue);

    const totalRaw = pRev + aRev + rRev;

    if (totalRaw <= 0) {
      return {
        streamPhoneRevenue: 0,
        streamAccRevenue: 0,
        streamRepairRevenue: 0,
        phonePercent: 0,
        accPercent: 0,
        repairPercent: 0,
        streamPhoneProfit: 0,
        streamAccProfit: 0,
        streamRepairProfit: 0,
      };
    }

    let pPct = Math.round((pRev / totalRaw) * 100);
    let aPct = Math.round((aRev / totalRaw) * 100);
    let rPct = 100 - pPct - aPct;

    if (rPct < 0) {
      rPct = 0;
      pPct = 100 - aPct;
    }

    return {
      streamPhoneRevenue: pRev,
      streamAccRevenue: aRev,
      streamRepairRevenue: rRev,
      phonePercent: pPct,
      accPercent: aPct,
      repairPercent: rPct,
      streamPhoneProfit: Math.round(pRev * 0.12),
      streamAccProfit: Math.round(aRev * 0.45),
      streamRepairProfit: Math.round(rRev * 0.60),
    };
  }, [timeframe, dailyRealBreakdown, phoneRevenue, accRevenue, repairRevenue]);

  // Donut SVG circumference calculation (Radius = 50 -> Circumference = 314.16)
  const circumference = 2 * Math.PI * 50;
  const phoneStroke = (phonePercent / 100) * circumference;
  const accStroke = (accPercent / 100) * circumference;
  const repairStroke = (repairPercent / 100) * circumference;

  const phoneOffset = 0;
  const accOffset = -phoneStroke;
  const repairOffset = -(phoneStroke + accStroke);

  // =========================================================================
  // 2. SMOOTH SPLINE CURVE SVG POINTS CALCULATION
  // =========================================================================
  const splineData = useMemo(() => {
    const width = 360;
    const height = 110;
    const paddingX = 24;
    const paddingY = 20;
    const n = chartData.length;

    if (n === 0) return { path: '', area: '', points: [] };

    const minVal = Math.min(...chartData.map((d) => d.revenue));
    const range = maxRevenue - minVal || 1;

    const coords = chartData.map((d, i) => {
      const x = paddingX + (i / (n - 1 || 1)) * (width - 2 * paddingX);
      const y = height - paddingY - ((d.revenue - minVal) / range) * (height - 2 * paddingY);
      return {
        x,
        y,
        val: d.revenue,
        label: d.label,
        subLabel: d.subLabel,
        growth: d.growth,
        profit: d.profit,
        orders: d.orders,
        index: i,
      };
    });

    if (coords.length === 1) {
      return { path: `M ${coords[0].x} ${coords[0].y}`, area: '', points: coords };
    }

    let dStr = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];
      const midX = (prev.x + curr.x) / 2;
      dStr += ` C ${midX.toFixed(1)} ${prev.y.toFixed(1)}, ${midX.toFixed(1)} ${curr.y.toFixed(1)}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
    }

    const lastX = coords[coords.length - 1].x;
    const firstX = coords[0].x;
    const areaStr = `${dStr} L ${lastX.toFixed(1)} ${height} L ${firstX.toFixed(1)} ${height} Z`;

    return { path: dStr, area: areaStr, points: coords };
  }, [chartData, maxRevenue]);

  // Overall growth indicator
  const firstPoint = chartData[0];
  const lastPoint = chartData[chartData.length - 1];
  const totalGrowth =
    firstPoint && lastPoint && firstPoint.revenue > 0
      ? Math.round(((lastPoint.revenue - firstPoint.revenue) / firstPoint.revenue) * 100)
      : 0;

  const periodTitleLabel =
    timeframe === 'day'
      ? `ngày ${formatDateVN(selectedDate)}`
      : timeframe === 'week'
      ? 'tuần này'
      : timeframe === 'month'
      ? 'tháng này'
      : timeframe === 'quarter'
      ? 'quý này'
      : 'năm 2026';

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
      {/* Top Header & Timeframe Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-600" />
              <span>Phân Tích Doanh Thu Đa Chiều</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">Báo Cáo Thời Gian Thực 2026</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2 mt-1">
            <BarChart3 className="w-5 h-5 text-cyan-600" />
            <span>Biểu Đồ Doanh Thu &amp; Xu Hướng Tăng Giảm</span>
          </h2>
        </div>

        {/* Timeframe Filter Buttons: Ngày / Tuần / Tháng / Quý / Năm */}
        <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-2xl text-xs font-bold self-start sm:self-auto border border-slate-200 flex-wrap">
          <button
            type="button"
            onClick={() => setTimeframe('day')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              timeframe === 'day'
                ? 'bg-white text-emerald-800 shadow-sm font-black border border-emerald-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>Theo Ngày</span>
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('week')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              timeframe === 'week'
                ? 'bg-white text-slate-900 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Theo Tuần
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('month')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              timeframe === 'month'
                ? 'bg-white text-slate-900 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Theo Tháng
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('quarter')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              timeframe === 'quarter'
                ? 'bg-white text-slate-900 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Theo Quý
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('year')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              timeframe === 'year'
                ? 'bg-white text-slate-900 shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Theo Năm
          </button>
        </div>
      </div>

      {/* THANH CÔNG CỤ TRA CỨU DOANH THU THEO NGÀY (Hiển thị khi chọn tab "Theo Ngày") */}
      {timeframe === 'day' && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-cyan-50/50 to-slate-50 border border-emerald-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-200">
          {/* Cụm chọn lịch ngày & Điều hướng Ngày trước / Ngày sau */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 mr-1">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Chọn ngày xem doanh thu:</span>
            </span>

            <div className="inline-flex items-center bg-white rounded-xl border border-slate-300 p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => shiftSelectedDate(-1)}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Xem ngày hôm trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input autoComplete="off"
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(e.target.value);
                }}
                className="px-2.5 py-1 text-xs font-mono font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
              />
              <button
                type="button"
                onClick={() => shiftSelectedDate(1)}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Xem ngày tiếp theo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Nút chọn nhanh Hôm nay / Hôm qua */}
            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                selectedDate === todayStr
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Hôm nay ({formatDateVN(todayStr).slice(0, 5)})
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(yesterdayStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                selectedDate === yesterdayStr
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Hôm qua ({formatDateVN(yesterdayStr).slice(0, 5)})
            </button>

            {/* Các mốc ngày có đơn hàng thực tế trong CSDL */}
            {activeInvoiceDates
              .filter((d) => d !== todayStr && d !== yesterdayStr)
              .slice(0, 3)
              .map((dStr) => (
                <button
                  key={dStr}
                  type="button"
                  onClick={() => setSelectedDate(dStr)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                    selectedDate === dStr
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs font-black'
                      : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
                  }`}
                  title={`Ngày ${formatDateVN(dStr)} có phát sinh hóa đơn trong CSDL`}
                >
                  <Receipt className="w-3 h-3" />
                  <span>{formatDateVN(dStr)}</span>
                </button>
              ))}
          </div>

          {/* Tóm tắt nhanh số liệu của ngày đang chọn */}
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <div className="px-3 py-1.5 rounded-xl bg-white border border-emerald-200 flex items-center gap-2 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-slate-600 font-medium">Tổng thu ngày {formatDateVN(selectedDate)}:</span>
              <strong className="font-mono font-black text-emerald-700 text-sm">
                {formatVND(totalPeriodRevenue)}
              </strong>
            </div>

            {dailyRealBreakdown.hasRealTransactions && (
              <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[11px] inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {dailyRealBreakdown.dayInvoices.length} hóa đơn &bull; {dailyRealBreakdown.dayRepairs.length} phiếu sửa
                </span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2-COLUMN SIDE-BY-SIDE ANALYTICS INTERFACE                */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* ======================================================== */}
        {/* BÊN 1 (CỘT TRÁI - 7 spans): BIỂU ĐỒ CỘT VỚI HOVER ĐỌC SỐ LIỆU TỪNG GIAI ĐOẠN */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 bg-slate-50/70 rounded-3xl p-5 sm:p-6 border border-slate-200/90 flex flex-col justify-between space-y-4">
          {/* Header of Left Bar Chart */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div>
              {hoveredBarData !== null && chartData[hoveredBarData.index] ? (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>
                        {chartData[hoveredBarData.index].label} • {hoveredBarData.stageName}
                      </span>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500 font-medium">{hoveredBarData.stageDesc}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 mt-0.5 flex-wrap">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono tracking-tight tabular-nums transition-all">
                      {formatVND(hoveredBarData.revenue)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                      <span>{Math.round(hoveredBarData.ratio * 100)}% cột</span>
                    </span>
                    <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                      Lãi: <strong className="text-cyan-700 font-mono">{formatVND(hoveredBarData.profit)}</strong>
                    </span>
                    <span className="text-xs font-semibold text-slate-500 hidden md:inline">
                      • {hoveredBarData.orders} đơn (Tổng cột: {formatVND(chartData[hoveredBarData.index].revenue)})
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Doanh thu {periodTitleLabel}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-2xl font-black text-slate-900 font-mono tracking-tight tabular-nums">
                      {formatVND(totalPeriodRevenue)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3 text-emerald-700" />
                      <span>{totalGrowth >= 0 ? `+${totalGrowth}` : totalGrowth}%</span>
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="text-right">
              {hoveredBarData !== null && chartData[hoveredBarData.index] ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-100/80 text-emerald-800 font-bold text-xs border border-emerald-200 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                  Đang xem: {chartData[hoveredBarData.index].label} ({hoveredBarData.stageName})
                </span>
              ) : (
                <span className="text-[11px] text-slate-500 font-medium">
                  {timeframe === 'day'
                    ? 'Biểu đồ doanh thu theo 7 khung giờ mở cửa (08:00 - 22:00)'
                    : 'Rê chuột lên/xuống cột để đọc số liệu từng giai đoạn'}
                </span>
              )}
            </div>
          </div>

          {/* Interactive Bar Chart Canvas */}
          <div
            className="relative pt-8 pb-2 select-none cursor-crosshair"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const mouseX = e.clientX - rect.left;
              const mouseY = e.clientY - rect.top;
              const slotHeight = rect.height;
              const mouseFromBottom = slotHeight - mouseY;

              const n = chartData.length;
              if (n === 0 || rect.width <= 0) return;
              const colWidth = rect.width / n;
              const idx = Math.max(0, Math.min(n - 1, Math.floor(mouseX / colWidth)));
              const item = chartData[idx];
              const heightPercent = Math.max(12, Math.round((item.revenue / maxRevenue) * 100));
              const barHeightPx = (heightPercent / 100) * slotHeight;

              let ratio = mouseFromBottom / (barHeightPx || 1);
              ratio = Math.max(0.05, Math.min(1.0, ratio));

              const stageInfo = getBarStageInfo(timeframe, item, ratio);
              const interpRevenue = Math.round((item.revenue * ratio) / 100000) * 100000;
              const interpProfit = Math.round(interpRevenue * 0.16);
              const interpOrders = Math.max(1, Math.round(item.orders * ratio));

              setHoveredBarData({
                index: idx,
                ratio,
                revenue: interpRevenue,
                profit: interpProfit,
                orders: interpOrders,
                stageName: stageInfo.stageName,
                stageDesc: stageInfo.stageDesc,
                cutPercent: ratio * 100,
                pixelYFromBottom: mouseFromBottom,
              });
            }}
            onMouseLeave={() => setHoveredBarData(null)}
          >
            {/* Background Horizontal Scale Gridlines */}
            <div className="absolute inset-x-2 top-8 bottom-9 pointer-events-none flex flex-col justify-between opacity-35">
              <div className="border-b border-dashed border-slate-300 w-full flex justify-end text-[9px] text-slate-400 font-mono -mt-2">
                <span>{(maxRevenue / 1000000).toFixed(maxRevenue < 10000000 ? 1 : 0)}M</span>
              </div>
              <div className="border-b border-dashed border-slate-300 w-full flex justify-end text-[9px] text-slate-400 font-mono -mt-2">
                <span>{((maxRevenue * 0.66) / 1000000).toFixed(maxRevenue < 10000000 ? 1 : 0)}M</span>
              </div>
              <div className="border-b border-dashed border-slate-300 w-full flex justify-end text-[9px] text-slate-400 font-mono -mt-2">
                <span>{((maxRevenue * 0.33) / 1000000).toFixed(maxRevenue < 10000000 ? 1 : 0)}M</span>
              </div>
            </div>

            {/* Bars container */}
            <div className="relative z-10 flex items-end justify-between gap-1.5 sm:gap-2 h-52 sm:h-56 px-2 border-b border-slate-200">
              {chartData.map((item, idx) => {
                const heightPercent = Math.max(12, Math.round((item.revenue / maxRevenue) * 100));
                const isHovered = hoveredBarData?.index === idx;
                const activeCutPercent = isHovered ? hoveredBarData.cutPercent : 100;
                const valTr =
                  item.revenue >= 10000000
                    ? `${Math.round(item.revenue / 1000000)}tr`
                    : `${(item.revenue / 1000000).toFixed(1)}tr`;

                return (
                  <div
                    key={idx}
                    className="relative flex-1 flex flex-col items-center h-full justify-end group cursor-crosshair"
                  >
                    {/* Hover Column Light Pillar */}
                    {isHovered && (
                      <div className="absolute inset-y-0 inset-x-0.5 sm:inset-x-1 bg-emerald-100/50 rounded-2xl border border-emerald-300/80 -z-10 pointer-events-none transition-all duration-150 animate-in fade-in" />
                    )}

                    {/* FLOATING TOOLTIP AT CURRENT BAR POSITION */}
                    {isHovered && (
                      <div
                        className="absolute z-40 pointer-events-none animate-in fade-in zoom-in-95 duration-100"
                        style={{
                          bottom: `calc(${Math.min(heightPercent, 72)}% + 14px)`,
                          left: '50%',
                          transform:
                            idx === 0
                              ? 'translateX(-15%)'
                              : idx === chartData.length - 1
                              ? 'translateX(-85%)'
                              : 'translateX(-50%)',
                          minWidth: '205px',
                        }}
                      >
                        <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3 shadow-2xl border border-slate-700/80 text-xs space-y-1.5">
                          <div className="flex items-center justify-between pb-1 border-b border-slate-700 text-[11px]">
                            <span className="font-bold text-slate-200">{item.label}</span>
                            <span className="text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-[10px]">
                              {hoveredBarData.stageName}
                            </span>
                          </div>

                          <div className="text-[10px] text-slate-400 leading-snug">
                            {hoveredBarData.stageDesc}
                          </div>

                          <div className="pt-0.5">
                            <span className="text-[10px] text-slate-400 block">Doanh thu mốc chuột rê:</span>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-base font-black text-emerald-400 font-mono tabular-nums">
                                {formatVND(hoveredBarData.revenue)}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({Math.round(hoveredBarData.ratio * 100)}% cột)
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-300 pt-0.5 border-t border-slate-800">
                            <span>Lãi gộp tương ứng:</span>
                            <span className="font-bold text-cyan-300 font-mono tabular-nums">
                              {formatVND(hoveredBarData.profit)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                            <span>{hoveredBarData.orders} đơn hoàn tất</span>
                            <span className="text-slate-400">
                              Cực đại cột: <strong className="text-slate-200 font-mono">{formatVND(item.revenue)}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Tooltip triangle tail */}
                        <div
                          className="w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-slate-900 -mt-0.5"
                          style={{
                            marginLeft:
                              idx === 0
                                ? '20%'
                                : idx === chartData.length - 1
                                ? '80%'
                                : 'auto',
                            marginRight: 'auto',
                          }}
                        />
                      </div>
                    )}

                    {/* Value indicator on top of bar */}
                    <div className="mb-1 text-center w-full z-10">
                      {isHovered ? (
                        <span className="inline-block px-1.5 py-0.5 bg-emerald-600 text-white font-mono font-black text-[10px] rounded-md shadow-md whitespace-nowrap animate-in fade-in tabular-nums">
                          {(hoveredBarData.revenue / 1000000).toFixed(hoveredBarData.revenue < 10000000 ? 1 : 0)}tr (
                          {Math.round(hoveredBarData.ratio * 100)}%)
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono font-medium hidden sm:block truncate max-w-full">
                          {valTr}
                        </span>
                      )}
                    </div>

                    {/* Bar Pill with 3 Stage Sections & Live Dynamic Cut Line */}
                    <div
                      className="relative w-full max-w-[42px] rounded-t-xl transition-all duration-150 z-10 overflow-hidden"
                      style={{ height: `${heightPercent}%` }}
                    >
                      {/* Base Background Bar */}
                      <div className="absolute inset-0 bg-slate-200/90" />

                      {/* Active Fill Level */}
                      <div
                        className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-cyan-600 via-teal-500 to-emerald-400 shadow-xl transition-[height] duration-75"
                        style={{ height: `${activeCutPercent}%` }}
                      />

                      {/* Phân cách 3 giai đoạn bằng vạch kẻ nét đứt trên thanh cột */}
                      <div className="absolute inset-x-0 bottom-[33.3%] border-b border-dashed border-white/40 pointer-events-none" />
                      <div className="absolute inset-x-0 bottom-[66.6%] border-b border-dashed border-white/40 pointer-events-none" />

                      {/* Dynamic Level Cut Line chạy theo chuột */}
                      {isHovered && (
                        <div
                          className="absolute inset-x-0 z-30 pointer-events-none flex items-center transition-[bottom] duration-75"
                          style={{ bottom: `${activeCutPercent}%` }}
                        >
                          <div className="w-full h-[2px] bg-white shadow-[0_0_8px_#10B981]" />
                        </div>
                      )}
                    </div>

                    {/* Dynamic Marker Dots on Left/Right of Bar */}
                    {isHovered && (
                      <div
                        className="absolute w-full max-w-[42px] pointer-events-none z-30 flex justify-between items-center"
                        style={{ bottom: `calc(${heightPercent * (activeCutPercent / 100)}% - 5px)` }}
                      >
                        <div className="w-2.5 h-2.5 -ml-1 rounded-full bg-emerald-400 border-2 border-white shadow-md animate-pulse" />
                        <div className="w-2.5 h-2.5 -mr-1 rounded-full bg-emerald-400 border-2 border-white shadow-md animate-pulse" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-between gap-2 px-2 pt-2.5 text-slate-600 font-bold text-[11px]">
              {chartData.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex-1 text-center transition-colors ${
                    hoveredBarData?.index === idx ? 'text-emerald-700 font-black scale-105' : 'text-slate-500'
                  }`}
                >
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200">
            {hoveredBarData !== null && chartData[hoveredBarData.index] ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>
                  {chartData[hoveredBarData.index].label} ({hoveredBarData.stageName}):{' '}
                  <strong className="text-emerald-800 font-mono">{formatVND(hoveredBarData.revenue)}</strong> /{' '}
                  {formatVND(chartData[hoveredBarData.index].revenue)}
                </span>
              </span>
            ) : (
              <span>Rê chuột lên/xuống theo từng cột để xem dữ liệu tăng giảm theo từng giai đoạn</span>
            )}
            <span className="font-semibold text-slate-700">Đơn vị: VNĐ</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BÊN 2 (CỘT PHẢI - 5 spans): BIỂU ĐỒ TRÒN & ĐƯỜNG CONG TƯƠNG TÁC THỜI GIAN THỰC */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-5 flex flex-col justify-between">
          {/* PHẦN 1: BIỂU ĐỒ HÌNH TRÒN TỔNG THỂ (DONUT CHART VỚI TOOLTIP THỜI GIAN THỰC) */}
          <div className="bg-slate-50/70 rounded-3xl p-5 border border-slate-200/90 space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-blue-600" />
                <span>Cơ Cấu Doanh Thu Tổng Thể 3 Mảng</span>
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">100% Tỷ Trọng</span>
            </div>

            <div className="flex items-center gap-5 pt-1 relative">
              {/* SVG Donut Circle */}
              <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform overflow-visible" viewBox="0 0 120 120">
                  {/* Background Base Ring */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="transparent"
                    stroke="#e2e8f0"
                    strokeWidth="15"
                  />

                  {/* Segment 1: Phone (Blue #2563EB) */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="transparent"
                    stroke="#2563EB"
                    strokeWidth={hoveredDonutSegment === 'phone' ? '18' : '15'}
                    strokeDasharray={`${phoneStroke} ${circumference}`}
                    strokeDashoffset={phoneOffset}
                    className={`transition-all duration-300 cursor-pointer ${
                      hoveredDonutSegment && hoveredDonutSegment !== 'phone' ? 'opacity-40' : 'opacity-100'
                    }`}
                    onMouseEnter={() => setHoveredDonutSegment('phone')}
                    onMouseLeave={() => setHoveredDonutSegment(null)}
                  />

                  {/* Segment 2: Accessory (Emerald #10B981) */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="transparent"
                    stroke="#10B981"
                    strokeWidth={hoveredDonutSegment === 'accessory' ? '18' : '15'}
                    strokeDasharray={`${accStroke} ${circumference}`}
                    strokeDashoffset={accOffset}
                    className={`transition-all duration-300 cursor-pointer ${
                      hoveredDonutSegment && hoveredDonutSegment !== 'accessory' ? 'opacity-40' : 'opacity-100'
                    }`}
                    onMouseEnter={() => setHoveredDonutSegment('accessory')}
                    onMouseLeave={() => setHoveredDonutSegment(null)}
                  />

                  {/* Segment 3: Repair (Amber #F59E0B) */}
                  {repairPercent > 0 && (
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="transparent"
                      stroke="#F59E0B"
                      strokeWidth={hoveredDonutSegment === 'repair' ? '18' : '15'}
                      strokeDasharray={`${repairStroke} ${circumference}`}
                      strokeDashoffset={repairOffset}
                      className={`transition-all duration-300 cursor-pointer ${
                        hoveredDonutSegment && hoveredDonutSegment !== 'repair' ? 'opacity-40' : 'opacity-100'
                      }`}
                      onMouseEnter={() => setHoveredDonutSegment('repair')}
                      onMouseLeave={() => setHoveredDonutSegment(null)}
                    />
                  )}
                </svg>

                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none transition-all">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                    {hoveredDonutSegment === 'phone'
                      ? 'Máy Mới'
                      : hoveredDonutSegment === 'accessory'
                      ? 'Phụ Kiện'
                      : hoveredDonutSegment === 'repair'
                      ? 'Sửa Chữa'
                      : 'TỔNG'}
                  </span>
                  <span className="text-xs font-black text-slate-900 font-mono tabular-nums leading-tight">
                    {hoveredDonutSegment === 'phone'
                      ? `${Math.round(streamPhoneRevenue / 1000000)}M`
                      : hoveredDonutSegment === 'accessory'
                      ? `${Math.round(streamAccRevenue / 1000000)}M`
                      : hoveredDonutSegment === 'repair'
                      ? `${Math.round(streamRepairRevenue / 1000000)}M`
                      : `${Math.round(totalPeriodRevenue / 1000000)}M`}
                  </span>
                  <span className="text-[9px] font-bold text-amber-700">
                    {hoveredDonutSegment === 'phone'
                      ? `${phonePercent}%`
                      : hoveredDonutSegment === 'accessory'
                      ? `${accPercent}%`
                      : hoveredDonutSegment === 'repair'
                      ? `${repairPercent}%`
                      : '100%'}
                  </span>
                </div>
              </div>

              {/* Legend & Breakdown */}
              <div className="space-y-2 flex-1 text-xs">
                {/* 1. Máy Mới */}
                <div
                  onMouseEnter={() => setHoveredDonutSegment('phone')}
                  onMouseLeave={() => setHoveredDonutSegment(null)}
                  className={`p-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                    hoveredDonutSegment === 'phone'
                      ? 'bg-blue-50/80 border border-blue-200 shadow-2xs'
                      : 'hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                    <span className="font-bold text-slate-800 truncate">1. Máy Mới</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-slate-900 mr-2 tabular-nums">
                      {formatVND(streamPhoneRevenue)}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-800">
                      {phonePercent}%
                    </span>
                  </div>
                </div>

                {/* 2. Phụ Kiện */}
                <div
                  onMouseEnter={() => setHoveredDonutSegment('accessory')}
                  onMouseLeave={() => setHoveredDonutSegment(null)}
                  className={`p-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                    hoveredDonutSegment === 'accessory'
                      ? 'bg-emerald-50/80 border border-emerald-200 shadow-2xs'
                      : 'hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-bold text-slate-800 truncate">2. Phụ Kiện</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-slate-900 mr-2 tabular-nums">
                      {formatVND(streamAccRevenue)}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">
                      {accPercent}%
                    </span>
                  </div>
                </div>

                {/* 3. Sửa Chữa iCare */}
                <div
                  onMouseEnter={() => setHoveredDonutSegment('repair')}
                  onMouseLeave={() => setHoveredDonutSegment(null)}
                  className={`p-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                    hoveredDonutSegment === 'repair'
                      ? 'bg-amber-50/80 border border-amber-200 shadow-2xs'
                      : 'hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="font-bold text-slate-800 truncate">3. Sửa Chữa</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-slate-900 mr-2 tabular-nums">
                      {formatVND(streamRepairRevenue)}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800">
                      {repairPercent}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* DONUT FLOATING TOOLTIP KHI RÊ CHUỘT */}
            {hoveredDonutSegment && (
              <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in zoom-in-95 duration-150 min-w-[210px]">
                <div className="bg-slate-900 text-white rounded-2xl p-3 shadow-2xl border border-slate-700 text-xs space-y-1.5">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-700 text-[11px]">
                    <span className="font-bold text-slate-200">
                      {hoveredDonutSegment === 'phone'
                        ? '1. Điện Thoại Máy Mới'
                        : hoveredDonutSegment === 'accessory'
                        ? '2. Phụ Kiện Chính Hãng'
                        : '3. Dịch Vụ Sửa Chữa iCare'}
                    </span>
                    <span className="font-mono text-cyan-300 font-bold">
                      {hoveredDonutSegment === 'phone'
                        ? `${phonePercent}%`
                        : hoveredDonutSegment === 'accessory'
                        ? `${accPercent}%`
                        : `${repairPercent}%`}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Doanh thu tương ứng kỳ này:</span>
                    <span className="text-sm font-black text-emerald-400 font-mono block tabular-nums">
                      {formatVND(
                        hoveredDonutSegment === 'phone'
                          ? streamPhoneRevenue
                          : hoveredDonutSegment === 'accessory'
                          ? streamAccRevenue
                          : streamRepairRevenue
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-300 pt-0.5 border-t border-slate-800">
                    <span>Lãi gộp ước tính:</span>
                    <span className="font-bold text-cyan-300 font-mono tabular-nums">
                      {formatVND(
                        hoveredDonutSegment === 'phone'
                          ? streamPhoneProfit
                          : hoveredDonutSegment === 'accessory'
                          ? streamAccProfit
                          : streamRepairProfit
                      )}
                    </span>
                  </div>
                </div>
                <div className="w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-slate-900 mx-auto -mt-0.5" />
              </div>
            )}
          </div>

          {/* PHẦN 2: BIỂU ĐỒ ĐƯỜNG CONG XU HƯỚNG TĂNG GIẢM */}
          <div className="bg-slate-50/70 rounded-3xl p-5 border border-slate-200/90 space-y-3 flex-1 flex flex-col justify-between relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Đường Cong Xu Hướng Tăng Giảm</span>
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                  totalGrowth >= 0
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-rose-700 bg-rose-50 border-rose-200'
                }`}
              >
                {totalGrowth >= 0 ? `Xu hướng: Tăng trưởng (+${totalGrowth}%)` : `Xu hướng: Điều chỉnh (${totalGrowth}%)`}
              </span>
            </div>

            {/* SVG Spline Curve Area */}
            <div
              className="relative w-full h-28 py-1 select-none cursor-crosshair"
              onMouseLeave={() => setHoveredCurve(null)}
            >
              <svg
                className="w-full h-full overflow-visible"
                viewBox="0 0 360 110"
                preserveAspectRatio="none"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const rawX = ((e.clientX - rect.left) / rect.width) * 360;

                  const points = splineData.points;
                  if (!points || points.length === 0) return;

                  const firstPt = points[0];
                  const lastPt = points[points.length - 1];
                  const clampedX = Math.max(firstPt.x, Math.min(lastPt.x, rawX));

                  let segIdx = 0;
                  for (let i = 0; i < points.length - 1; i++) {
                    if (clampedX >= points[i].x && clampedX <= points[i + 1].x) {
                      segIdx = i;
                      break;
                    }
                    if (clampedX > points[points.length - 1].x) {
                      segIdx = points.length - 2;
                    }
                  }

                  const prev = points[segIdx];
                  const curr = points[segIdx + 1];

                  if (!curr) {
                    setHoveredCurve({
                      x: prev.x,
                      y: prev.y,
                      revenue: prev.val,
                      profit: prev.profit,
                      orders: prev.orders,
                      growth: prev.growth,
                      label: prev.label,
                      subLabel: prev.subLabel,
                    });
                    return;
                  }

                  const targetRelX = (clampedX - prev.x) / (curr.x - prev.x || 1);

                  let t = targetRelX;
                  for (let iter = 0; iter < 4; iter++) {
                    const f = 1.5 * t - 1.5 * t * t + t * t * t - targetRelX;
                    const fPrime = 1.5 - 3 * t + 3 * t * t;
                    t = Math.max(0, Math.min(1, t - f / fPrime));
                  }

                  const s = t * t * (3 - 2 * t);
                  const interpY = (1 - s) * prev.y + s * curr.y;

                  const rawRev = (1 - s) * prev.val + s * curr.val;
                  const interpRevenue = Math.round(rawRev / 100000) * 100000;
                  const interpProfit = Math.round(interpRevenue * 0.16);
                  const interpOrders = Math.max(1, Math.round((1 - s) * prev.orders + s * curr.orders));
                  const interpGrowth = Math.round((1 - s) * prev.growth + s * curr.growth);

                  let label = '';
                  let subLabel = '';
                  if (t < 0.25) {
                    label = prev.label;
                    subLabel = prev.subLabel;
                  } else if (t > 0.75) {
                    label = curr.label;
                    subLabel = curr.subLabel;
                  } else {
                    label = `${prev.label} → ${curr.label}`;
                    const pct = Math.round(t * 100);
                    subLabel = `Xu hướng chuyển tiếp (${pct}%)`;
                  }

                  setHoveredCurve({
                    x: clampedX,
                    y: interpY,
                    revenue: interpRevenue,
                    profit: interpProfit,
                    orders: interpOrders,
                    growth: interpGrowth,
                    label,
                    subLabel,
                  });
                }}
              >
                <defs>
                  <linearGradient id="splineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.38" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0284C7" />
                    <stop offset="60%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>

                {splineData.area && <path d={splineData.area} fill="url(#splineGradient)" />}

                {splineData.path && (
                  <path
                    d={splineData.path}
                    fill="none"
                    stroke="url(#lineStroke)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {hoveredCurve && (
                  <line
                    x1={hoveredCurve.x}
                    y1={0}
                    x2={hoveredCurve.x}
                    y2={110}
                    stroke="#10B981"
                    strokeDasharray="3 3"
                    strokeWidth="1.5"
                    className="opacity-75"
                  />
                )}

                {splineData.points.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r="3.5"
                    className="fill-white stroke-emerald-600 stroke-2"
                  />
                ))}

                {hoveredCurve && (
                  <g className="pointer-events-none">
                    <circle
                      cx={hoveredCurve.x}
                      cy={hoveredCurve.y}
                      r="10"
                      fill="rgba(16, 185, 129, 0.25)"
                      stroke="#10B981"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx={hoveredCurve.x}
                      cy={hoveredCurve.y}
                      r="5"
                      fill="#10B981"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      className="shadow-lg"
                    />
                  </g>
                )}
              </svg>

              {/* FLOATING REAL-TIME CONTINUOUS TOOLTIP TRÊN ĐƯỜNG CONG XU HƯỚNG */}
              {hoveredCurve && (
                <div
                  className="absolute pointer-events-none z-30 transition-[left] duration-75 ease-out animate-in fade-in zoom-in-95"
                  style={{
                    left: `${(hoveredCurve.x / 360) * 100}%`,
                    bottom: '80%',
                    transform:
                      hoveredCurve.x < 75
                        ? 'translateX(-10%)'
                        : hoveredCurve.x > 285
                        ? 'translateX(-90%)'
                        : 'translateX(-50%)',
                    minWidth: '185px',
                  }}
                >
                  <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3 shadow-2xl border border-slate-700/80 text-xs space-y-1">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-700 text-[11px] text-slate-400">
                      <span className="font-bold text-slate-200">{hoveredCurve.label}</span>
                      <span className="text-[10px] text-slate-400">{hoveredCurve.subLabel}</span>
                    </div>

                    <div className="pt-0.5">
                      <span className="text-[10px] text-slate-400 block">Doanh thu thời điểm này:</span>
                      <span className="text-sm font-black text-emerald-400 font-mono block tabular-nums">
                        {formatVND(hoveredCurve.revenue)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-300 pt-0.5">
                      <span>Lãi gộp ước tính:</span>
                      <span className="font-bold text-cyan-300 font-mono tabular-nums">
                        {formatVND(hoveredCurve.profit)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 border-t border-slate-800">
                      <span>{hoveredCurve.orders} đơn hoàn tất</span>
                      <span
                        className={`font-black ${
                          hoveredCurve.growth >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {hoveredCurve.growth >= 0
                          ? `+${hoveredCurve.growth}% ↑`
                          : `${hoveredCurve.growth}% ↓`}
                      </span>
                    </div>
                  </div>

                  <div
                    className="w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-slate-900 mx-auto -mt-0.5"
                    style={{
                      marginLeft:
                        hoveredCurve.x < 75
                          ? '20px'
                          : hoveredCurve.x > 285
                          ? 'calc(100% - 30px)'
                          : 'auto',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Trend summary labels */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Rê chuột dọc đường cong để theo dõi biến thiên thời gian thực</span>
              </span>
              <span className="font-bold text-slate-800 font-mono tabular-nums">
                Đỉnh: {(maxRevenue / 1000000).toFixed(maxRevenue < 10000000 ? 1 : 0)}M
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
