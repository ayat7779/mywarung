import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { financeService } from '../services/financeService';
import { formatRupiah, formatDate, getDateRange } from '../utils/formatters';
import ExpenseFormModal from '../components/ExpenseFormModal';
import {
  TrendingUp,
  Receipt,
  PlusCircle,
  Calendar,
  DollarSign,
  PieChart,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  User,
  Trash2,
  AlertCircle,
  Clock,
  Layers
} from 'lucide-react';

export default function LaporanPage() {
  const [period, setPeriod] = useState('today'); // 'today' | 'week' | 'month' | 'custom'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Modal Expense State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Calculate Date Range
  const { startISO, endISO } = getDateRange(period, customStart, customEnd);

  // Live Financial Report Data
  const [reportData, setReportData] = useState({
    totalSales: 0,
    totalCostOfGoodsSold: 0,
    grossProfit: 0,
    operationalExpenses: 0,
    netProfit: 0,
    personalDraws: 0,
    cashOrQrisSales: 0,
    debtCollected: 0,
    totalCashIn: 0,
    stockPurchasesCost: 0,
    totalCashOut: 0,
    netCashFlow: 0,
    salesCount: 0,
    expensesCount: 0
  });

  // Live Expenses List for Selected Period
  const [expensesList, setExpensesList] = useState([]);

  // Fetch Report & Expenses on Date Range Change
  const loadReportData = async () => {
    try {
      const data = await financeService.getFinancialReport(startISO, endISO);
      setReportData(data);

      const expList = await financeService.getExpensesList(startISO, endISO);
      setExpensesList(expList);
    } catch (err) {
      console.error('Failed to load financial report:', err);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [period, customStart, customEnd, refreshTrigger]);

  // Live query on sales & expenses changes
  useLiveQuery(() => db.sales.count(), []);
  useLiveQuery(() => db.expenses.count(), []);
  useLiveQuery(() => db.stock_purchases.count(), []);

  // Delete Expense Handler
  const handleDeleteExpense = async (id) => {
    if (confirm('Hapus catatan pengeluaran ini?')) {
      await financeService.deleteExpense(id);
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-8 space-y-6">
      {/* Top Header & Catat Pengeluaran Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Laporan Keuangan & Rugi Laba
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Pantau penjualan (omzet), beban operasional warung, keuntungan bersih, dan arus kas.
          </p>
        </div>

        <button
          onClick={() => setIsExpenseModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-95 text-sm"
        >
          <PlusCircle className="w-5 h-5 stroke-[2.5]" />
          <span>Catat Pengeluaran Kas</span>
        </button>
      </div>

      {/* Date Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-slate-500" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Periode Laporan:</span>
          </div>

          {/* Period Selector Buttons */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setPeriod('today')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                period === 'today'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Hari Ini
            </button>

            <button
              onClick={() => setPeriod('week')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                period === 'week'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Minggu Ini
            </button>

            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                period === 'month'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Bulan Ini
            </button>

            <button
              onClick={() => setPeriod('custom')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                period === 'custom'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Rentang Kustom
            </button>
          </div>
        </div>

        {/* Custom Date Pickers */}
        {period === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-600">Dari:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 font-bold"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-600">Sampai:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 font-bold"
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION 1: METRIK RUGI LABA (PROFIT & LOSS) */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <PieChart className="w-5 h-5 text-emerald-600" />
          <h2 className="font-black text-lg text-slate-900 tracking-tight">Ringkasan Rugi Laba (Untung Bersih)</h2>
        </div>

        {/* Grid Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Total Penjualan (Omzet) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Penjualan (Omzet)</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900">{formatRupiah(reportData.totalSales)}</h3>
            <p className="text-[11px] text-slate-400 font-medium">Dari {reportData.salesCount} nota transaksi penjualan</p>
          </div>

          {/* Modal Barang Terjual (HPP) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Modal Barang (HPP)</span>
              <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-800">{formatRupiah(reportData.totalCostOfGoodsSold)}</h3>
            <p className="text-[11px] text-slate-400 font-medium">Modal asli dari barang yang terjual</p>
          </div>

          {/* Laba Kotor Barang */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Laba Kotor Barang</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-emerald-700">{formatRupiah(reportData.grossProfit)}</h3>
            <p className="text-[11px] text-slate-400 font-medium">Omzet dikurangi Modal Barang (Omzet - HPP)</p>
          </div>

          {/* Beban Operasional Warung */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Beban Operasional Warung</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-amber-700">{formatRupiah(reportData.operationalExpenses)}</h3>
            <p className="text-[11px] text-slate-400 font-medium">Plastik, listrik, bensin belanja, lakban, dll.</p>
          </div>

          {/* Laba Bersih Warung (HIGHLIGHT) */}
          <div className={`p-5 rounded-3xl border-2 shadow-md space-y-1 sm:col-span-2 lg:col-span-1 ${
            reportData.netProfit >= 0 ? 'bg-emerald-950 text-white border-emerald-500' : 'bg-rose-950 text-white border-rose-500'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">LABA / UNTUNG BERSIH WARUNG</span>
              <div className="p-2 bg-white/10 rounded-xl">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <h3 className="text-3xl font-black">{formatRupiah(reportData.netProfit)}</h3>
            <p className="text-[11px] text-emerald-200/80 font-medium">
              Keuntungan bersih asli warung (Laba Kotor - Beban Operasional)
            </p>
          </div>

          {/* Pengambilan Pribadi (TERPISAH) */}
          <div className="bg-purple-50 p-5 rounded-3xl border border-purple-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">Pengambilan Pribadi (Prive)</span>
              <div className="p-2 bg-purple-200 text-purple-800 rounded-xl">
                <User className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-purple-900">{formatRupiah(reportData.personalDraws)}</h3>
            <p className="text-[11px] text-purple-700 font-medium">
              Uang kas yang diambil u/ belanja rumah/pribadi (Dipisah dari biaya warung)
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: RINGKASAN ARUS KAS (CASH FLOW - UANG NYATA) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <Wallet className="w-5 h-5 text-slate-800" />
          <h2 className="font-extrabold text-base text-slate-900">Arus Kas Sederhana (Pantau Uang Nyata di Kasir)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Uang Masuk */}
          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 space-y-2 text-xs">
            <span className="font-extrabold text-emerald-900 text-sm block">UANG MASUK KASIR</span>
            <div className="space-y-1 text-slate-700">
              <div className="flex justify-between">
                <span>Penjualan Tunai/QRIS:</span>
                <span className="font-bold text-slate-900">{formatRupiah(reportData.cashOrQrisSales)}</span>
              </div>
              <div className="flex justify-between">
                <span>Pelunasan Kasbon Periode Ini:</span>
                <span className="font-bold text-slate-900">{formatRupiah(reportData.debtCollected)}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-emerald-200 flex justify-between font-black text-emerald-800 text-sm">
              <span>TOTAL UANG MASUK:</span>
              <span>{formatRupiah(reportData.totalCashIn)}</span>
            </div>
          </div>

          {/* Uang Keluar */}
          <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 space-y-2 text-xs">
            <span className="font-extrabold text-rose-900 text-sm block">UANG KELUAR KASIR</span>
            <div className="space-y-1 text-slate-700">
              <div className="flex justify-between">
                <span>Belanja Kulakan Stok:</span>
                <span className="font-bold text-slate-900">{formatRupiah(reportData.stockPurchasesCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Biaya Operasional Warung:</span>
                <span className="font-bold text-slate-900">{formatRupiah(reportData.operationalExpenses)}</span>
              </div>
              <div className="flex justify-between">
                <span>Pengambilan Pribadi:</span>
                <span className="font-bold text-slate-900">{formatRupiah(reportData.personalDraws)}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-rose-200 flex justify-between font-black text-rose-800 text-sm">
              <span>TOTAL UANG KELUAR:</span>
              <span>{formatRupiah(reportData.totalCashOut)}</span>
            </div>
          </div>

          {/* Arus Kas Bersih */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col justify-between space-y-2">
            <div>
              <span className="font-bold text-slate-400 text-xs block uppercase">SISA ARUS KAS NYATA</span>
              <h3 className="text-2xl font-black text-emerald-400 mt-1">{formatRupiah(reportData.netCashFlow)}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Total Uang Masuk dikurangi Total Uang Keluar Kasir pada periode ini.</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: DAFTAR RIWAYAT PENGELUARAN */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-amber-600" />
            <h2 className="font-extrabold text-base text-slate-900">Riwayat Pengeluaran Periode Ini</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">{expensesList.length} Catatan</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
                <th className="py-2.5 px-4 rounded-l-lg">Tanggal</th>
                <th className="py-2.5 px-4">Kategori</th>
                <th className="py-2.5 px-4">Catatan / Keterangan</th>
                <th className="py-2.5 px-4 text-right">Nominal (Rp)</th>
                <th className="py-2.5 px-4 text-center rounded-r-lg">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {expensesList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    Belum ada catatan pengeluaran pada periode ini.
                  </td>
                </tr>
              ) : (
                expensesList.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(exp.date)}
                    </td>
                    <td className="py-3 px-4">
                      {exp.category === 'operational' ? (
                        <span className="bg-amber-100 text-amber-900 font-bold px-2.5 py-1 rounded-full text-[11px] inline-flex items-center space-x-1">
                          <ShoppingBag className="w-3 h-3 text-amber-700" />
                          <span>Biaya Warung</span>
                        </span>
                      ) : (
                        <span className="bg-purple-100 text-purple-900 font-bold px-2.5 py-1 rounded-full text-[11px] inline-flex items-center space-x-1">
                          <User className="w-3 h-3 text-purple-700" />
                          <span>Ambil Pribadi</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {exp.note}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-rose-700 font-mono text-sm">
                      {formatRupiah(exp.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Hapus Pengeluaran"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal Expense */}
      <ExpenseFormModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </div>
  );
}
