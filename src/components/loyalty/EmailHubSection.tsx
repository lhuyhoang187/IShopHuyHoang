'use client';

import React, { useState } from 'react';
import {
  Mail,
  FileText,
  Clock,
  CheckCircle2,
  ExternalLink,
  Eye,
  X,
  Printer,
  ShieldCheck,
  Smartphone,
  Wrench,
  Gift,
} from 'lucide-react';
import { getEmailsByCustomer } from '@/lib/emailService';
import { EmailNotification } from '@/lib/types';

interface EmailHubSectionProps {
  customerPhone: string;
  customerEmail?: string;
  customerName: string;
}

export function EmailHubSection({
  customerPhone,
  customerEmail,
  customerName,
}: EmailHubSectionProps) {
  const emails = getEmailsByCustomer(customerPhone || customerEmail || '');
  const [selectedEmail, setSelectedEmail] = useState<EmailNotification | null>(null);

  const getTypeBadge = (type: EmailNotification['type']) => {
    switch (type) {
      case 'purchase_invoice':
        return { label: 'Hóa Đơn Mua Hàng', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: FileText };
      case 'deposit_invoice':
        return { label: 'Hóa Đơn Đặt Cọc', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: ShieldCheck };
      case 'repair_receipt':
        return { label: 'Tiếp Nhận Sửa Chữa', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Wrench };
      case 'repair_status_update':
        return { label: 'Tiến Độ Sửa Chữa', color: 'bg-sky-50 text-sky-700 border-sky-200', icon: Smartphone };
      case 'reward_redeem':
        return { label: 'Đổi Quà Điểm Thưởng', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Gift };
      default:
        return { label: 'Thông Báo', color: 'bg-slate-50 text-slate-700 border-slate-200', icon: Mail };
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-lg">
                Hòm Thư Điện Tử & Thông Báo Dịch Vụ
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                E-INVOICE & NOTIFICATIONS
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Tất cả thông báo hóa đơn mua hàng, đặt cọc, phiếu tiếp nhận và tiến độ sửa chữa máy được gửi tự động về hòm thư của bạn.
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Email nhận thư: <strong className="text-slate-900">{customerEmail || `${customerPhone}@customer.ishop.vn`}</strong>
        </div>
      </div>

      {/* Danh sách Email đã gửi */}
      {emails.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <Mail className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-700 text-xs">Chưa có thông báo email nào được ghi nhận.</p>
          <p className="text-[11px] text-slate-500">
            Khi quý khách đặt cọc, mua máy, gửi máy đi sửa chữa hoặc đổi quà, hóa đơn điện tử sẽ tự động gửi về đây!
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {emails.map((email) => {
            const badge = getTypeBadge(email.type);
            const Icon = badge.icon;

            return (
              <div
                key={email.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 p-2.5 rounded-xl transition"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl border shrink-0 ${badge.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-slate-800">
                        {email.referenceCode}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm mt-1">{email.subject}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{email.contentSummary}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(email.sentAt).toLocaleDateString('vi-VN')} {new Date(email.sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button
                    onClick={() => setSelectedEmail(email)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>Đọc Thư</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL XEM CHI TIẾT EMAIL HTML SANG TRỌNG */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold block">
                  CHI TIẾT EMAIL THÔNG BÁO ĐIỆN TỬ
                </span>
                <h4 className="text-sm sm:text-base font-bold text-white line-clamp-1">
                  {selectedEmail.subject}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="In email này"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Email Body HTML */}
            <div className="p-6 overflow-y-auto bg-slate-100 flex-1 flex justify-center">
              <div
                className="w-full max-w-xl bg-white shadow-sm rounded-xl overflow-hidden"
                dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }}
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-mono">
                Gửi lúc: {new Date(selectedEmail.sentAt).toLocaleString('vi-VN')}
              </span>
              <button
                onClick={() => setSelectedEmail(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold"
              >
                Đóng Thư
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
