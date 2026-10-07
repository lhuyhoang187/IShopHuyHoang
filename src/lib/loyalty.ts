export interface MembershipTierConfig {
  tier: string;
  minPoints: number;
  discountPercent: number; // e.g. 5 for 5%
  color: string;
  badgeClass: string;
  textColor: string;
  bgLight: string;
  borderColor: string;
  description: string;
}

export const MEMBERSHIP_TIERS: MembershipTierConfig[] = [
  {
    tier: 'Thành viên mới',
    minPoints: 0,
    discountPercent: 0,
    color: '#94a3b8',
    badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    textColor: 'text-slate-300',
    bgLight: 'bg-slate-500/10',
    borderColor: 'border-slate-500/30',
    description: 'Dưới 1.000 điểm - Chiết khấu 0%',
  },
  {
    tier: 'Thẻ Bạc',
    minPoints: 1000,
    discountPercent: 1.5,
    color: '#cbd5e1',
    badgeClass: 'bg-zinc-400/20 text-zinc-200 border-zinc-400/30',
    textColor: 'text-zinc-200',
    bgLight: 'bg-zinc-400/10',
    borderColor: 'border-zinc-400/30',
    description: 'Từ 1.000 - 4.999 điểm - Chiết khấu 1.5%',
  },
  {
    tier: 'Thẻ Vàng',
    minPoints: 5000,
    discountPercent: 3.0,
    color: '#fbbf24',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    textColor: 'text-amber-300',
    bgLight: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    description: 'Từ 5.000 - 19.999 điểm - Chiết khấu 3.0%',
  },
  {
    tier: 'Thẻ Bạch Kim',
    minPoints: 20000,
    discountPercent: 5.0,
    color: '#38bdf8',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    textColor: 'text-cyan-300',
    bgLight: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    description: 'Từ 20.000 - 49.999 điểm - Chiết khấu 5.0%',
  },
  {
    tier: 'Thẻ Kim Cương',
    minPoints: 50000,
    discountPercent: 7.0,
    color: '#c084fc',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    textColor: 'text-purple-300',
    bgLight: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    description: 'Từ 50.000 điểm trở lên - Chiết khấu 7.0%',
  },
];

/**
 * Tra cứu cấu hình hạng thẻ dựa trên điểm tích lũy hiện tại
 */
export function getTierByPoints(points: number): MembershipTierConfig {
  const safePoints = Math.max(0, Number(points) || 0);
  const sorted = [...MEMBERSHIP_TIERS].sort((a, b) => b.minPoints - a.minPoints);
  for (const t of sorted) {
    if (safePoints >= t.minPoints) return t;
  }
  return MEMBERSHIP_TIERS[0];
}

/**
 * Tính điểm tích lũy mặc định cho từng sản phẩm:
 * - Điện thoại Flagship (>= 25 triệu): 500 điểm
 * - Điện thoại Cận cao cấp (15 triệu - dưới 25 triệu): 350 điểm
 * - Điện thoại Tầm trung (7 triệu - dưới 15 triệu): 200 điểm
 * - Điện thoại Phổ thông (< 7 triệu): 100 điểm
 * - Phụ kiện cao cấp (>= 1 triệu): 80 điểm
 * - Phụ kiện tiêu chuẩn (300k - dưới 1 triệu): 30 điểm
 * - Phụ kiện nhỏ (< 300k): 15 điểm
 */
export function calculateProductRewardPoints(item: {
  type: 'phone' | 'accessory' | 'repair';
  sellingPrice: number;
  rewardPoints?: number;
}): number {
  if (typeof item.rewardPoints === 'number' && item.rewardPoints > 0) {
    return item.rewardPoints;
  }
  const price = Number(item.sellingPrice) || 0;
  if (item.type === 'phone') {
    if (price >= 25000000) return 500;
    if (price >= 15000000) return 350;
    if (price >= 7000000) return 200;
    return 100;
  } else if (item.type === 'accessory') {
    if (price >= 1000000) return 80;
    if (price >= 300000) return 30;
    return 15;
  } else {
    return Math.max(10, Math.floor(price / 50000));
  }
}
