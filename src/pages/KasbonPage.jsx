import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { debtService } from '../services/debtService';
import { formatRupiah, formatDate } from '../utils/formatters';
import {
  BookOpen,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  History,
  X,
  ChevronDown,
  ChevronUp,
  Receipt
} from 'lucide-react';

export default function KasbonPage() {
  const [activeTab, setActiveTab] = useState('unpaid'); // 'unpaid' | 'paid'
  const [searchQuery, setSearchQuery] = useState('');

  // Confirmation Modal State for Settlement
  const [payTargetSale, setPayTargetSale] = useState(null);
  const [isProcessingPay, setIsProcessingPay] = useState(false);
  const [paySuccessMsg, setPaySuccessMsg] = useState('');

  // Expanded card items toggle state
  const [expandedSaleIds, setExpandedSaleIds] = useState([]);

  // Live query for unpaid debts
  const unpaidSalesList = useLiveQuery(async () => {
    return await debtService.getUnpaidDebts();
  }, []) || [];

  // Live query for paid debts history
  const paidSalesList = useLiveQuery(async () => {
    return await debtService.getPaidDebts(50);
  }, []) || [];

  // Total Unpaid Debt Amount
  const totalUnpaidAmount = useMemo(() => {
    return unpaidSalesList.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  }, [unpaidSalesList]);

  // Filtered Unpaid List
  const filteredUnpaid = useMemo(() => {
    return unpaidSalesList.filter((s) => {
      const name = s.customer_name || '';
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [unpaidSalesList, searchQuery]);

  // Filtered Paid List
  const filteredPaid = useMemo(() => {
    return paidSalesList.filter((s) => {
      const name = s.customer_name || '';
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [paidSalesList, searchQuery]);

  // Toggle item details
  const toggleExpand = (saleId) => {
    setExpandedSaleIds((prev) =>
      prev.includes(saleId) ? prev.filter((id) => id !== saleId) : [...prev, saleId]
    );
  };

  // Confirm and process debt payment
  const handleConfirmPay = async () => {
    if (!payTargetSale) return;

    try {
      setIsProcessingPay(true);
      await debtService.payDebt(payTargetSale.id);

      setPaySuccessMsg(`Kasbon atas nama "${payTargetSale.customer_name}" sebesar ${formatRupiah(payTargetSale.total_amount)} telah LUNAS!`);
      setPayTargetSale(null);
      setTimeout(() => setPaySuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Gagal melunasi kasbon.');
    } finally {
      setIsProcessingPay(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Manajemen Kasbon Pelanggan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Kelola daftar hutang belanja pelanggan dan proses pelunasan sekali ketuk.
          </p>
        </div>
      </div>

      {/* Success Banner */}
      {paySuccessMsg && (
        <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between animate-in slide-in-from-top duration-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm">Pelunasan Berhasil!</h4>
              <p className="text-xs text-emerald-100">{paySuccessMsg}</p>
            </div>
          </div>
          <button onClick={() => setPaySuccessMsg('')} className="p-1 text-emerald-100 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Summary Stat Card for Total Unpaid Debt */}
      <div className="bg-gradient-to-br from-rose-900 via-rose-800 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <span className="text-xs font-bold text-rose-200 uppercase tracking-widest block">
            TOTAL KASBON BELUM LUNAS
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            {formatRupiah(totalUnpaidAmount)}
          </h2>
          <p className="text-xs text-rose-200/80 font-medium">
            Terdapat <strong className="text-white font-bold">{unpaidSalesList.length} nota kasbon</strong> yang belum dilunasi.
          </p>
        </div>

        <div className="relative z-10 flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20">
          <UserCheck className="w-6 h-6 text-rose-300" />
          <div className="text-right">
            <span className="text-[10px] text-rose-200 font-bold uppercase block">Status Kasbon</span>
            <span className="text-sm font-extrabold text-white">
              {unpaidSalesList.length > 0 ? 'Ada Tagihan' : 'Semua Lunas'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama pelanggan (contoh: Bu Rina)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sub-Tab Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('unpaid')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'unpaid'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Belum Lunas ({unpaidSalesList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('paid')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'paid'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Riwayat Lunas ({paidSalesList.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* LIST 1: BELUM LUNAS */}
      {activeTab === 'unpaid' && (
        <div className="space-y-3">
          {filteredUnpaid.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-sm my-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-base">Tidak Ada Kasbon Belum Lunas</h3>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery
                  ? `Tidak ada kasbon dengan nama "${searchQuery}".`
                  : 'Semua pelanggan telah melunasi tagihannya.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUnpaid.map((sale) => {
                const isExpanded = expandedSaleIds.includes(sale.id);

                return (
                  <div
                    key={sale.id}
                    className="bg-white rounded-2xl p-4 border border-rose-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3 relative overflow-hidden"
                  >
                    {/* Header Info */}
                    <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                          Nota #{sale.id}
                        </span>
                        <h3 className="font-extrabold text-slate-900 text-lg mt-1">
                          {sale.customer_name || 'Pelanggan Tanpa Nama'}
                        </h3>
                        <span className="text-[11px] text-slate-400 font-medium flex items-center space-x-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(sale.date)}</span>
                        </span>
                      </div>

                      <span className="bg-rose-100 text-rose-800 text-xs font-black px-2.5 py-1 rounded-full">
                        BELUM LUNAS
                      </span>
                    </div>

                    {/* Tagihan Amount */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">TOTAL TAGIHAN:</span>
                      <span className="font-black text-xl text-rose-700">{formatRupiah(sale.total_amount)}</span>
                    </div>

                    {/* Rincian Item Accordion Toggle */}
                    <div>
                      <button
                        onClick={() => toggleExpand(sale.id)}
                        className="w-full flex items-center justify-between text-xs font-bold text-slate-600 hover:text-slate-900 py-1"
                      >
                        <span className="flex items-center space-x-1">
                          <Receipt className="w-3.5 h-3.5 text-slate-500" />
                          <span>Rincian Barang ({sale.items?.length || 0} jenis)</span>
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 bg-slate-50 rounded-xl p-3 space-y-1.5 border border-slate-200 text-xs divide-y divide-slate-200/60">
                          {sale.items?.map((item, idx) => (
                            <div key={idx} className="pt-1.5 first:pt-0 flex justify-between items-center">
                              <div>
                                <span className="font-bold text-slate-800">{item.product_name}</span>
                                <span className="text-[11px] text-slate-500 block">
                                  {item.qty} x {formatRupiah(item.unit_price)}
                                </span>
                              </div>
                              <span className="font-extrabold text-slate-900">
                                {formatRupiah(item.qty * item.unit_price)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Button: Lunasi */}
                    <div className="pt-2">
                      <button
                        onClick={() => setPayTargetSale(sale)}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md shadow-emerald-600/20 text-xs transition active:scale-95 flex items-center justify-center space-x-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Lunasi Tagihan Ini</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* LIST 2: RIWAYAT KASBON LUNAS */}
      {activeTab === 'paid' && (
        <div className="space-y-3">
          {filteredPaid.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-sm my-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <History className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-700 text-base">Belum Ada Riwayat Pelunasan</h3>
              <p className="text-xs text-slate-500 mt-1">
                Riwayat kasbon yang telah dilunasi akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-4">Nama Pelanggan</th>
                      <th className="py-3.5 px-4">Tgl Transaksi</th>
                      <th className="py-3.5 px-4">Tgl Pelunasan</th>
                      <th className="py-3.5 px-4 text-right">Total Tagihan</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {filteredPaid.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-4 font-extrabold text-slate-900">
                          {sale.customer_name || 'Pelanggan Tanpa Nama'}
                          <span className="block text-[10px] font-normal text-slate-400">Nota #{sale.id}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {formatDate(sale.date)}
                        </td>
                        <td className="py-3.5 px-4 text-emerald-700 font-semibold">
                          {formatDate(sale.paid_at)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 text-sm font-mono">
                          {formatRupiah(sale.total_amount)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black px-2.5 py-1 rounded-full inline-flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>LUNAS</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for Debt Settlement */}
      {payTargetSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-black text-slate-900 text-xl">Konfirmasi Pelunasan</h3>
              <p className="text-xs text-slate-500 mt-1">Pastikan pembayaran uang tunai/QRIS telah diterima dari pelanggan.</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-left text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Pelanggan:</span>
                <span className="font-extrabold text-slate-900">{payTargetSale.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Tgl Belanja:</span>
                <span className="font-medium text-slate-700">{formatDate(payTargetSale.date)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
                <span className="font-bold text-slate-700">Total Tagihan:</span>
                <span className="font-black text-emerald-600">{formatRupiah(payTargetSale.total_amount)}</span>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setPayTargetSale(null)}
                className="flex-1 py-3 border border-slate-300 rounded-xl font-bold text-slate-700 text-xs hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessingPay}
                onClick={handleConfirmPay}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-emerald-600/20 transition active:scale-95"
              >
                {isProcessingPay ? 'Memproses...' : 'Ya, Pelunasan Diterima'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
