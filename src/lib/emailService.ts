'use client';

import { EmailNotification, Invoice, RepairTicket, RedeemedGiftItem } from './types';
import { formatVND } from './vietqr';

const EMAIL_STORAGE_KEY = 'ishop_customer_emails';

export function getStoredEmails(): EmailNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(EMAIL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error reading customer emails:', err);
    return [];
  }
}

export function saveStoredEmails(emails: EmailNotification[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(emails));
    window.dispatchEvent(new Event('ishop_data_changed'));
  } catch (err) {
    console.error('Error saving customer emails:', err);
  }
}

export function getEmailsByCustomer(phoneOrEmail: string): EmailNotification[] {
  const clean = phoneOrEmail.trim().toLowerCase();
  const all = getStoredEmails();
  return all.filter(
    (e) =>
      e.toEmail.toLowerCase() === clean ||
      (e.customerPhone && e.customerPhone.trim() === clean)
  );
}

export function sendEmailNotification(
  data: Omit<EmailNotification, 'id' | 'sentAt'>
): EmailNotification {
  const all = getStoredEmails();
  const newEmail: EmailNotification = {
    ...data,
    id: 'em-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    sentAt: new Date().toISOString(),
    isRead: false,
  };

  saveStoredEmails([newEmail, ...all]);
  return newEmail;
}

// 1. Email Hóa Đơn Mua Hàng Điện Tử (E-Invoice)
export function sendPurchaseInvoiceEmail(
  invoice: Invoice,
  toEmail?: string
): EmailNotification {
  const email = toEmail || invoice.customerEmail || `${invoice.customerPhone}@customer.ishop.vn`;
  const itemsHtml = invoice.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 8px; font-weight: bold; color: #0f172a;">${item.name} ${item.variant ? `(${item.variant})` : ''} ${item.imei ? `<br/><span style="font-size: 11px; color: #64748b; font-family: monospace;">Mã IMEI: ${item.imei}</span>` : ''}</td>
        <td style="padding: 10px 8px; text-align: center; color: #334155;">${item.quantity}</td>
        <td style="padding: 10px 8px; text-align: right; font-weight: 600; color: #b45309;">${formatVND(item.unitPrice)}</td>
        <td style="padding: 10px 8px; text-align: right; font-weight: bold; color: #0f172a;">${formatVND(item.total)}</td>
      </tr>`
    )
    .join('');

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px; color: #ffffff; text-align: center;">
        <div style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #fbbf24; font-weight: bold; margin-bottom: 4px;">iShop Huy Hoàng &bull; Apple Flagship Store</div>
        <h2 style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 0.5px;">XÁC NHẬN HÓA ĐƠN ĐIỆN TỬ</h2>
        <p style="margin: 6px 0 0; font-size: 13px; color: #cbd5e1;">Mã hóa đơn: <strong style="color: #fbbf24; font-family: monospace;">${invoice.invoiceCode}</strong></p>
      </div>

      <div style="padding: 24px;">
        <p style="font-size: 14px; color: #334155; margin: 0 0 16px;">Kính gửi quý khách <strong style="color: #0f172a;">${invoice.customerName}</strong>,</p>
        <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin: 0 0 20px;">Cảm ơn quý khách đã tin tưởng và mua sắm tại <strong>iShop Huy Hoàng</strong>. Đơn hàng của quý khách đã được tạo thành công và được bảo hành chính hãng theo thông tin chi tiết dưới đây:</p>

        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; text-align: left;">
              <th style="padding: 10px 8px;">Sản phẩm / IMEI</th>
              <th style="padding: 10px 8px; text-align: center;">SL</th>
              <th style="padding: 10px 8px; text-align: right;">Đơn giá</th>
              <th style="padding: 10px 8px; text-align: right;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
            <span style="color: #64748b;">Tổng tiền hàng:</span>
            <span style="font-weight: 600; color: #0f172a;">${formatVND(invoice.subtotal)}</span>
          </div>
          ${invoice.discount > 0 ? `
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; color: #16a34a;">
            <span>Chiết khấu hội viên:</span>
            <span>-${formatVND(invoice.discount)}</span>
          </div>` : ''}
          <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 900; border-top: 1px dashed #cbd5e1; padding-top: 10px; color: #b45309;">
            <span>TỔNG THANH TOÁN:</span>
            <span>${formatVND(invoice.totalAmount)}</span>
          </div>
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #059669; font-weight: bold;">
            🎁 Điểm thưởng tích lũy nhận được: +${(invoice.pointsEarned ?? Math.floor(invoice.totalAmount / 10000)).toLocaleString('vi-VN')} điểm (Cộng trực tiếp vào thẻ VIP)
          </div>
        </div>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 14px; border-radius: 6px; font-size: 12px; color: #92400e; margin-bottom: 20px;">
          <strong>Chính sách bảo hành:</strong> ${invoice.warrantyNote || 'Bảo hành chính hãng 12 tháng tại hệ thống iShop Huy Hoàng.'}
        </div>

        <div style="text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          Hotline Hỗ Trợ 24/7: <strong>1900 8888</strong> &bull; Showroom: Tòa nhà iShop Flagship, TP. Hồ Chí Minh
        </div>
      </div>
    </div>
  `;

  return sendEmailNotification({
    toEmail: email,
    customerName: invoice.customerName,
    customerPhone: invoice.customerPhone,
    subject: `[iShop Huy Hoàng] Hóa đơn điện tử ${invoice.invoiceCode} - ${formatVND(invoice.totalAmount)}`,
    type: 'purchase_invoice',
    title: `Hóa Đơn Mua Hàng Điện Tử ${invoice.invoiceCode}`,
    contentSummary: `Đơn mua ${invoice.items.length} món giá trị ${formatVND(invoice.totalAmount)}. Tích lũy +${(invoice.pointsEarned ?? 0).toLocaleString('vi-VN')} pts.`,
    htmlContent,
    referenceCode: invoice.invoiceCode,
  });
}

// 2. Email Hóa Đơn Đặt Cọc Pre-Order (Deposit Receipt)
export function sendDepositInvoiceEmail(
  invoice: Invoice,
  toEmail?: string
): EmailNotification {
  const email = toEmail || invoice.customerEmail || `${invoice.customerPhone}@customer.ishop.vn`;
  const deposit = invoice.depositAmount || Math.round(invoice.totalAmount * 0.1);
  const remaining = invoice.remainingBalance || Math.max(0, invoice.totalAmount - deposit);

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
      <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 24px; color: #ffffff; text-align: center;">
        <div style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #38bdf8; font-weight: bold; margin-bottom: 4px;">iShop Huy Hoàng &bull; Pre-Order Flagship Priority</div>
        <h2 style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 0.5px;">BIÊN NHẬN ĐẶT CỌC GIỮ MÁY</h2>
        <p style="margin: 6px 0 0; font-size: 13px; color: #c7d2fe;">Mã phiếu cọc: <strong style="color: #38bdf8; font-family: monospace;">${invoice.invoiceCode}</strong></p>
      </div>

      <div style="padding: 24px;">
        <p style="font-size: 14px; color: #334155; margin: 0 0 16px;">Kính gửi quý khách <strong style="color: #0f172a;">${invoice.customerName}</strong>,</p>
        <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin: 0 0 20px;">Hệ thống iShop đã xác nhận giao dịch <strong>đặt cọc trước (Pre-order)</strong> thành công. Quý khách là một trong những khách hàng VIP đầu tiên sở hữu siêu phẩm đợt 1:</p>

        <div style="background: #e0f2fe; border: 1px solid #bae6fd; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 8px; font-size: 14px; color: #0369a1;">Sản phẩm đặt trước:</h4>
          ${invoice.items.map((it) => `<p style="margin: 4px 0; font-weight: bold; font-size: 14px; color: #0c4a6e;">&bull; ${it.name} ${it.variant ? `(${it.variant})` : ''}</p>`).join('')}
          <div style="margin-top: 10px; font-size: 12px; color: #0284c7;">
            📅 Ngày dự kiến bàn giao máy: <strong>${invoice.estimatedDeliveryDate || 'Sau 3-5 ngày làm việc'}</strong>
          </div>
        </div>

        <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px;">
            <span style="color: #64748b;">Giá trị niêm yết sản phẩm:</span>
            <span style="font-weight: bold; color: #0f172a;">${formatVND(invoice.totalAmount)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; color: #16a34a; margin-bottom: 8px;">
            <span>Số tiền cọc đã thanh toán (${invoice.depositPercent || 10}%):</span>
            <span>${formatVND(deposit)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; color: #b45309; border-top: 1px dashed #cbd5e1; padding-top: 10px;">
            <span>Số tiền còn lại thanh toán khi nhận máy:</span>
            <span>${formatVND(remaining)}</span>
          </div>
        </div>

        <div style="background: #f1f5f9; padding: 12px 14px; border-radius: 8px; font-size: 12px; color: #475569; margin-bottom: 20px;">
          🔒 <strong>Quy định đặt cọc:</strong> Khách hàng được cam kết giữ máy nguyên seal phiên bản màu đã chọn. Khi máy cập bến, chuyên viên CSKH sẽ liên hệ quý khách đến showroom nhận máy và kích hoạt bảo hành Apple Care chính hãng.
        </div>
      </div>
    </div>
  `;

  return sendEmailNotification({
    toEmail: email,
    customerName: invoice.customerName,
    customerPhone: invoice.customerPhone,
    subject: `[iShop Huy Hoàng] Xác nhận cọc giữ máy ${invoice.invoiceCode} - Cọc ${formatVND(deposit)}`,
    type: 'deposit_invoice',
    title: `Biên Nhận Đặt Cọc Giữ Máy ${invoice.invoiceCode}`,
    contentSummary: `Đã cọc ${formatVND(deposit)} (${invoice.depositPercent || 10}%). Còn lại ${formatVND(remaining)} khi nhận máy.`,
    htmlContent,
    referenceCode: invoice.invoiceCode,
  });
}

// 3. Email Biên Nhận Tiếp Nhận Sửa Chữa (Repair Receipt)
export function sendRepairReceiptEmail(
  ticket: RepairTicket,
  toEmail?: string
): EmailNotification {
  const email = toEmail || `${ticket.customerPhone}@customer.ishop.vn`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
      <div style="background: linear-gradient(135deg, #064e3b 0%, #047857 100%); padding: 24px; color: #ffffff; text-align: center;">
        <div style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #a7f3d0; font-weight: bold; margin-bottom: 4px;">iShop iCare Center &bull; Tiếp Nhận Sửa Chữa</div>
        <h2 style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 0.5px;">PHIẾU TIẾP NHẬN SỬA CHỮA</h2>
        <p style="margin: 6px 0 0; font-size: 13px; color: #d1fae5;">Mã phiếu sửa: <strong style="color: #fef08a; font-family: monospace;">${ticket.ticketCode}</strong></p>
      </div>

      <div style="padding: 24px;">
        <p style="font-size: 14px; color: #334155; margin: 0 0 16px;">Kính gửi quý khách <strong style="color: #0f172a;">${ticket.customerName}</strong>,</p>
        <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin: 0 0 20px;">Trung tâm dịch vụ kỹ thuật <strong>iShop iCare</strong> đã tiếp nhận thiết bị của quý khách. Toàn bộ quá trình tháo lắp, kiểm tra sẽ được ghi hình camera và cập nhật trực tuyến:</p>

        <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 20px; font-size: 13px;">
          <div style="margin-bottom: 8px;">📱 <strong>Model máy:</strong> ${ticket.deviceModel}</div>
          <div style="margin-bottom: 8px;">🔑 <strong>Mã IMEI / Serial thống nhất:</strong> <span style="font-family: monospace; font-weight: bold; color: #0f172a;">${ticket.imeiOrSerial}</span></div>
          <div style="margin-bottom: 8px;">⚠️ <strong>Hiện trạng & Lỗi:</strong> ${ticket.issueDescription}</div>
          <div style="margin-bottom: 8px;">🔍 <strong>Tình trạng ngoại quan:</strong> ${ticket.appearanceCondition}</div>
          <div>📅 <strong>Dự kiến bàn giao:</strong> ${ticket.estimatedDeliveryDate}</div>
        </div>

        <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 12px; font-size: 12px; color: #065f46; text-align: center;">
          Quý khách có thể quét mã QR trên phiếu tiếp nhận hoặc nhập mã <strong style="font-family: monospace;">${ticket.ticketCode}</strong> / <strong style="font-family: monospace;">${ticket.imeiOrSerial}</strong> tại trang Tra Cứu Tiến Độ Sửa Chữa để xem chi tiết từng bước.
        </div>
      </div>
    </div>
  `;

  return sendEmailNotification({
    toEmail: email,
    customerName: ticket.customerName,
    customerPhone: ticket.customerPhone,
    subject: `[iCare iShop] Phiếu tiếp nhận sửa chữa ${ticket.ticketCode} - Máy ${ticket.deviceModel} (IMEI: ${ticket.imeiOrSerial})`,
    type: 'repair_receipt',
    title: `Phiếu Tiếp Nhận Sửa Chữa ${ticket.ticketCode}`,
    contentSummary: `Tiếp nhận máy ${ticket.deviceModel} (IMEI: ${ticket.imeiOrSerial}). Lỗi: ${ticket.issueDescription}.`,
    htmlContent,
    referenceCode: ticket.ticketCode,
  });
}

// 4. Email Cập Nhật Tiến Độ Sửa Chữa (Repair Status Alert)
export function sendRepairStatusUpdateEmail(
  ticket: RepairTicket,
  stepLabel: string,
  note?: string,
  toEmail?: string
): EmailNotification {
  const email = toEmail || `${ticket.customerPhone}@customer.ishop.vn`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
      <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 24px; color: #ffffff; text-align: center;">
        <div style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #bae6fd; font-weight: bold; margin-bottom: 4px;">CẬP NHẬT TIẾN ĐỘ iCARE</div>
        <h2 style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 0.5px;">${stepLabel.toUpperCase()}</h2>
        <p style="margin: 6px 0 0; font-size: 13px; color: #e0f2fe;">Mã phiếu: <strong style="font-family: monospace;">${ticket.ticketCode}</strong> &bull; Thiết bị: ${ticket.deviceModel}</p>
      </div>

      <div style="padding: 24px;">
        <p style="font-size: 14px; color: #334155; margin: 0 0 16px;">Kính gửi quý khách <strong style="color: #0f172a;">${ticket.customerName}</strong>,</p>
        <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin: 0 0 16px;">Thiết bị <strong>${ticket.deviceModel} (IMEI: ${ticket.imeiOrSerial})</strong> vừa được kỹ thuật viên cập nhật trạng thái mới nhất:</p>

        <div style="background: #f0f9ff; border-left: 4px solid #0284c7; padding: 14px; border-radius: 8px; margin-bottom: 20px;">
          <div style="font-size: 14px; font-weight: bold; color: #0369a1; margin-bottom: 4px;">Trạng thái: ${stepLabel}</div>
          <div style="font-size: 13px; color: #334155;">Ghi chú kỹ thuật: ${note || 'Máy đã vượt qua quy trình kiểm tra.'}</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 6px;">Thời gian cập nhật: ${new Date().toLocaleString('vi-VN')}</div>
        </div>

        ${ticket.partsUsed && ticket.partsUsed.length > 0 ? `
        <div style="margin-bottom: 20px; font-size: 13px;">
          <h4 style="margin: 0 0 8px; color: #0f172a;">Linh kiện thay thế chính hãng:</h4>
          <ul style="margin: 0; padding-left: 20px; color: #475569;">
            ${ticket.partsUsed.map((p) => `<li>${p.partName} x ${p.quantity} (${formatVND(p.unitPrice * p.quantity)})</li>`).join('')}
          </ul>
          <div style="margin-top: 8px; font-weight: bold; color: #b45309;">Tổng chi phí dự kiến: ${formatVND(ticket.totalAmount)}</div>
        </div>` : ''}

        ${ticket.status === 'ready_for_pickup' || ticket.status === 'delivered' ? `
        <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 14px; text-align: center; color: #065f46; font-weight: bold; font-size: 13px;">
          🎉 Thiết bị của quý khách đã hoàn tất sửa chữa & kiểm định QC! Quý khách có thể đến Showroom iShop để nhận máy.
        </div>` : ''}
      </div>
    </div>
  `;

  return sendEmailNotification({
    toEmail: email,
    customerName: ticket.customerName,
    customerPhone: ticket.customerPhone,
    subject: `[iCare Update] Máy ${ticket.deviceModel} chuyển sang: ${stepLabel} (Phiếu ${ticket.ticketCode})`,
    type: 'repair_status_update',
    title: `Tiến Độ Sửa Chữa: ${stepLabel}`,
    contentSummary: `Thiết bị ${ticket.deviceModel} (IMEI: ${ticket.imeiOrSerial}) đã chuyển sang: ${stepLabel}.`,
    htmlContent,
    referenceCode: ticket.ticketCode,
  });
}

// 5. Email Thông Báo Đổi Quà / Phụ Kiện Từ Điểm Thưởng (Reward Redeem)
export function sendRewardRedeemEmail(
  gift: RedeemedGiftItem,
  toEmail?: string
): EmailNotification {
  const email = toEmail || `${gift.customerPhone}@customer.ishop.vn`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
      <div style="background: linear-gradient(135deg, #78350f 0%, #b45309 100%); padding: 24px; color: #ffffff; text-align: center;">
        <div style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #fde68a; font-weight: bold; margin-bottom: 4px;">VIP REWARD REDEMPTION &bull; ĐỔI QUÀ THÀNH CÔNG</div>
        <h2 style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 0.5px;">XÁC NHẬN ĐỔI PHỤ KIỆN</h2>
        <p style="margin: 6px 0 0; font-size: 13px; color: #fef3c7;">Mã nhận quà: <strong style="font-family: monospace; color: #fef08a;">${gift.giftCode}</strong></p>
      </div>

      <div style="padding: 24px;">
        <p style="font-size: 14px; color: #334155; margin: 0 0 16px;">Chúc mừng quý khách <strong style="color: #0f172a;">${gift.customerName}</strong>,</p>
        <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin: 0 0 20px;">Quý khách đã sử dụng điểm tích lũy thành viên để đổi thành công phần quà phụ kiện chính hãng:</p>

        <div style="display: flex; gap: 14px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <img src="${gift.accessoryImage}" alt="${gift.accessoryName}" style="width: 70px; height: 70px; object-fit: contain; border-radius: 8px; background: #fff; padding: 4px;" />
          <div>
            <h4 style="margin: 0 0 4px; font-size: 15px; color: #78350f;">${gift.accessoryName}</h4>
            <div style="font-size: 13px; font-weight: bold; color: #b45309;">Điểm đã khấu trừ: -${gift.pointsRedeemed.toLocaleString('vi-VN')} pts</div>
            <div style="font-size: 11px; color: #92400e; margin-top: 4px;">Trạng thái: <strong>Sẵn sàng nhận tại showroom</strong></div>
          </div>
        </div>

        <div style="background: #f8fafc; border-radius: 8px; padding: 12px; font-size: 12px; color: #475569; text-align: center;">
          Quý khách chỉ cần cung cấp mã nhận quà <strong style="font-family: monospace;">${gift.giftCode}</strong> hoặc số điện thoại tại quầy thu ngân iShop để nhận quà ngay.
        </div>
      </div>
    </div>
  `;

  return sendEmailNotification({
    toEmail: email,
    customerName: gift.customerName,
    customerPhone: gift.customerPhone,
    subject: `[VIP Rewards] Đổi quà thành công ${gift.giftCode} - ${gift.accessoryName} (-${gift.pointsRedeemed} pts)`,
    type: 'reward_redeem',
    title: `Đổi Quà Điểm Thưởng: ${gift.accessoryName}`,
    contentSummary: `Đã đổi ${gift.accessoryName} bằng ${gift.pointsRedeemed} điểm thưởng. Mã quà: ${gift.giftCode}.`,
    htmlContent,
    referenceCode: gift.giftCode,
  });
}
