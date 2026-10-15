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
  // Thiết kế thẻ Apple Wallet / VIP Physical Card
  cardGradient: string;
  cardBorder: string;
  cardGlow: string;
  cardChipGradient: string;
  cardBadgeBg: string;
  cardBadgeText: string;
  cardSubText: string;
}

export const MEMBERSHIP_TIERS: MembershipTierConfig[] = [
  {
    tier: 'Thành viên mới',
    minPoints: 0,
    discountPercent: 0,
    color: '#64748b',
    badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    textColor: 'text-slate-300',
    bgLight: 'bg-slate-500/10',
    borderColor: 'border-slate-500/30',
    description: 'Dưới 1.000 điểm - Chiết khấu 0%',
    cardGradient: 'from-slate-900 via-slate-800 to-zinc-900',
    cardBorder: 'border-slate-700/80 shadow-[0_20px_50px_rgba(15,23,42,0.4)]',
    cardGlow: 'bg-slate-400/10',
    cardChipGradient: 'from-slate-300 via-slate-400 to-slate-500',
    cardBadgeBg: 'bg-slate-700/80 border-slate-500/50',
    cardBadgeText: 'text-slate-200',
    cardSubText: 'text-slate-400',
  },
  {
    tier: 'Thẻ Bạc',
    minPoints: 1000,
    discountPercent: 1.5,
    color: '#94a3b8',
    badgeClass: 'bg-zinc-400/20 text-zinc-200 border-zinc-400/30',
    textColor: 'text-zinc-200',
    bgLight: 'bg-zinc-400/10',
    borderColor: 'border-zinc-400/30',
    description: 'Từ 1.000 - 4.999 điểm - Chiết khấu 1.5%',
    cardGradient: 'from-slate-800 via-zinc-800 to-neutral-900',
    cardBorder: 'border-slate-400/40 shadow-[0_20px_50px_rgba(148,163,184,0.2)]',
    cardGlow: 'bg-zinc-300/15',
    cardChipGradient: 'from-zinc-200 via-slate-300 to-zinc-400',
    cardBadgeBg: 'bg-zinc-700/80 border-zinc-400/60',
    cardBadgeText: 'text-zinc-100',
    cardSubText: 'text-zinc-400',
  },
  {
    tier: 'Thẻ Vàng',
    minPoints: 5000,
    discountPercent: 3.0,
    color: '#d97706',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    textColor: 'text-amber-300',
    bgLight: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    description: 'Từ 5.000 - 19.999 điểm - Chiết khấu 3.0%',
    cardGradient: 'from-[#1a1205] via-[#2d1f0a] to-[#0d0903]',
    cardBorder: 'border-amber-500/50 shadow-[0_25px_60px_rgba(217,119,6,0.25)]',
    cardGlow: 'bg-amber-500/20',
    cardChipGradient: 'from-amber-200 via-yellow-400 to-amber-600',
    cardBadgeBg: 'bg-amber-950/80 border-amber-400/60',
    cardBadgeText: 'text-amber-300',
    cardSubText: 'text-amber-200/70',
  },
  {
    tier: 'Thẻ Bạch Kim',
    minPoints: 20000,
    discountPercent: 5.0,
    color: '#0284c7',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    textColor: 'text-cyan-300',
    bgLight: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    description: 'Từ 20.000 - 49.999 điểm - Chiết khấu 5.0%',
    cardGradient: 'from-[#031525] via-[#082f49] to-[#02101e]',
    cardBorder: 'border-sky-400/50 shadow-[0_25px_60px_rgba(14,165,233,0.25)]',
    cardGlow: 'bg-sky-400/20',
    cardChipGradient: 'from-sky-200 via-cyan-300 to-blue-500',
    cardBadgeBg: 'bg-sky-950/80 border-sky-400/60',
    cardBadgeText: 'text-sky-300',
    cardSubText: 'text-sky-200/70',
  },
  {
    tier: 'Thẻ Kim Cương',
    minPoints: 50000,
    discountPercent: 7.0,
    color: '#7c3aed',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    textColor: 'text-purple-300',
    bgLight: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    description: 'Từ 50.000 điểm trở lên - Chiết khấu 7.0%',
    cardGradient: 'from-[#17062e] via-[#2e1065] to-[#0f031f]',
    cardBorder: 'border-purple-400/60 shadow-[0_25px_60px_rgba(168,85,247,0.3)]',
    cardGlow: 'bg-purple-500/25',
    cardChipGradient: 'from-purple-200 via-fuchsia-400 to-violet-600',
    cardBadgeBg: 'bg-purple-950/80 border-purple-400/60',
    cardBadgeText: 'text-purple-300',
    cardSubText: 'text-purple-200/70',
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
 * Cơ chế quy đổi điểm thưởng mới:
 * Cứ giá 100.000 VNĐ thì sẽ là 10 điểm (tương đương 10.000 VNĐ = 1 điểm).
 * Điểm nhân lên tỉ lệ thuận theo giá trị của sản phẩm, số lượng và tổng đơn hàng:
 * - 100.000 VNĐ => 10 điểm
 * - 200.000 VNĐ => 20 điểm
 * - 1.000.000 VNĐ => 100 điểm
 * - 34.990.000 VNĐ => 3.499 điểm
 */
export function calculateProductRewardPoints(item: {
  type?: 'phone' | 'accessory' | 'repair';
  sellingPrice: number;
  quantity?: number;
  rewardPoints?: number;
}): number {
  const qty = Math.max(1, Number(item.quantity) || 1);
  if (typeof item.rewardPoints === 'number' && item.rewardPoints > 0) {
    return item.rewardPoints * qty;
  }
  const price = Number(item.sellingPrice) || 0;
  // Cứ giá 100.000đ thì là 10 điểm, nhân lên theo giá trị và số lượng
  return Math.floor((price * qty) / 10000);
}

/**
 * Tính điểm thưởng cho cả đơn hàng dựa trên tổng tiền
 */
export function calculateOrderRewardPoints(totalAmount: number): number {
  const safeTotal = Math.max(0, Number(totalAmount) || 0);
  return Math.floor(safeTotal / 10000);
}

/**
 * Định dạng hiển thị điểm đẹp mắt (ví dụ: +10 điểm, +3.499 điểm)
 */
export function formatRewardPoints(points: number): string {
  const safe = Math.max(0, Number(points) || 0);
  return `+${safe.toLocaleString('vi-VN')} điểm`;
}
