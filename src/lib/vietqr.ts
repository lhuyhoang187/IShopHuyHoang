export interface VietQRConfig {
  bankId: string; // e.g. 'MB' | 'VCB' | 'ICB' | 'TCB'
  accountNo: string;
  accountName: string;
  template: 'compact' | 'compact2' | 'qr_only' | 'print';
}

export const DEFAULT_STORE_BANK: VietQRConfig = {
  bankId: 'MB', // MBBank Quân Đội
  accountNo: '0988888999',
  accountName: 'NGUYEN HUY HOANG',
  template: 'compact2',
};

/**
 * Generate standard VietQR quick link URL using vietqr.io API format
 * https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<DESCRIPTION>&accountName=<ACCOUNT_NAME>
 */
export function generateVietQRUrl(
  amount: number,
  orderCode: string,
  config: VietQRConfig = DEFAULT_STORE_BANK
): string {
  const sanitizedDescription = encodeURIComponent(`IShop ${orderCode}`);
  const sanitizedAccountName = encodeURIComponent(config.accountName);
  return `https://img.vietqr.io/image/${config.bankId}-${config.accountNo}-${config.template}.png?amount=${Math.round(
    amount
  )}&addInfo=${sanitizedDescription}&accountName=${sanitizedAccountName}`;
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}
