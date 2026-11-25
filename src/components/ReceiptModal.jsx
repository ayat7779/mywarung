import React from 'react';
import { CheckCircle2, Printer, X, ShoppingBag } from 'lucide-react';
import { formatRupiah, formatDate } from '../utils/formatters';
import { profileService } from '../services/profileService';

export default function ReceiptModal({ isOpen, onClose, receiptData }) {
  if (!isOpen || !receiptData) return null;

  const shopProfile = profileService.getProfile();

  const handlePrint = () => {
    window.print();
  };

  const getPaymentLabel = (type) => {
    switch (type) {
      case 'cash':
        return 'TUNAI';
      case 'qris':
        return 'QRIS';
      case 'debt':
        return 'KASBON (HUTANG)';
      default:
        return type?.toUpperCase();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 my-6">
        {/* Modal Top Banner */}
        <div className="bg-emerald-600 px-6 py-4 text-white text-center">
          <div className="inline-flex p-2 bg-white/20 rounded-full mb-2">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">Transaksi Berhasil!</h2>
          <p className="text-xs text-emerald-100 font-medium">Struk Transaksi Penjualan</p>
        </div>

        {/* Printable Receipt Area */}
        <div id="printable-receipt" className="p-6 bg-slate-50 border-b border-slate-200 text-slate-800 text-sm">
          <div className="text-center border-b border-dashed border-slate-300 pb-3 mb-3">
            <h3 className="font-black text-lg text-slate-900 tracking-wider uppercase">
              {shopProfile.name || 'WARUNG PRIBADI'}
            </h3>
            <p className="text-xs text-slate-500">{shopProfile.address || 'Jl. Sederhana No. 1'}</p>
            <p className="text-[11px] text-slate-400 mt-1">{formatDate(receiptData.date)}</p>
            <p className="text-[11px] text-slate-400 font-mono">No: #{receiptData.saleId}</p>
          </div>

          {receiptData.customerName && (
            <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-900 flex justify-between">
              <span className="font-semibold">Nama Pelanggan:</span>
              <span className="font-bold">{receiptData.customerName}</span>
            </div>
          )}

          {/* Items Table */}
          <div className="space-y-2 border-b border-dashed border-slate-300 pb-3 mb-3">
            {receiptData.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-xs">
                <div className="pr-2">
                  <div className="font-bold text-slate-800">{item.product_name}</div>
                  <div className="text-slate-500">
                    {item.qty} x {formatRupiah(item.unit_price)}
                  </div>
                </div>
                <div className="font-bold text-slate-900 whitespace-nowrap">
                  {formatRupiah(item.qty * item.unit_price)}
                </div>
              </div>
            ))}
          </div>

          {/* Totals & Payment info */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-center font-extrabold text-base text-slate-900 py-1">
              <span>TOTAL BELANJA</span>
              <span>{formatRupiah(receiptData.totalAmount)}</span>
            </div>

            <div className="flex justify-between items-center text-slate-600 pt-1">
              <span>Metode Pembayaran:</span>
              <span className="font-bold text-slate-900 bg-slate-200 px-2 py-0.5 rounded text-[11px]">
                {getPaymentLabel(receiptData.paymentType)}
              </span>
            </div>

            {receiptData.paymentType === 'cash' && (
              <>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Uang Bayar:</span>
                  <span className="font-medium text-slate-900">{formatRupiah(receiptData.cashPaid)}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-700 font-bold">
                  <span>Kembalian:</span>
                  <span>{formatRupiah(receiptData.changeAmount)}</span>
                </div>
              </>
            )}

            <div className="flex justify-between items-center pt-2">
              <span>Status Pembayaran:</span>
              <span
                className={`font-black px-2 py-0.5 rounded text-[11px] ${
                  receiptData.isPaid
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {receiptData.isPaid ? 'LUNAS' : 'BELUM LUNAS (KASBON)'}
              </span>
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-400 mt-4 pt-3 border-t border-dashed border-slate-300">
            Terima kasih atas kunjungannya! <br />
            Semoga harimu menyenangkan.
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 bg-white flex flex-col sm:flex-row gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition text-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk</span>
          </button>

          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 transition text-sm active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Transaksi Baru</span>
          </button>
        </div>
      </div>
    </div>
  );
}
