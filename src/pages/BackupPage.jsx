import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, resetDatabaseToInitial, clearAllTransactionsOnly } from '../db/database';
import { backupService } from '../db/backup';
import { logService } from '../services/logService';
import { formatDate } from '../utils/formatters';
import ChangePinModal from '../components/ChangePinModal';
import {
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertTriangle,
  X,
  FileJson,
  ShieldCheck,
  RotateCcw,
  Trash2,
  KeyRound,
  Lock,
  Activity,
  ShieldAlert,
  Info,
  Filter
} from 'lucide-react';

export default function BackupPage() {
  const [activeSubTab, setActiveSubTab] = useState('backup'); // 'backup' | 'audit_log'
  const [logTypeFilter, setLogTypeFilter] = useState('ALL');

  // Live statistics of current database
  const stats = useLiveQuery(async () => {
    const products = await db.products.count();
    const sales = await db.sales.count();
    const saleItems = await db.sale_items.count();
    const purchases = await db.stock_purchases.count();
    const expenses = await db.expenses.count();
    const logs = await db.activity_logs.count();

    return { products, sales, saleItems, purchases, expenses, logs };
  }, []) || { products: 0, sales: 0, saleItems: 0, purchases: 0, expenses: 0, logs: 0 };

  // Live Activity Audit Logs Query
  const auditLogs = useLiveQuery(async () => {
    return await logService.getRecentLogs(100, logTypeFilter);
  }, [logTypeFilter]) || [];

  // UI state
  const [exportSuccessMsg, setExportSuccessMsg] = useState('');
  const [importSuccessMsg, setImportSuccessMsg] = useState('');
  const [importErrorMsg, setImportErrorMsg] = useState('');

  // Change PIN Modal
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);

  // Selected file for import
  const [selectedFile, setSelectedFile] = useState(null);
  const [isConfirmingImport, setIsConfirmingImport] = useState(false);
  const [isProcessingImport, setIsProcessingImport] = useState(false);

  // Reset Modal State
  const [resetType, setResetType] = useState(null); // 'transactions_only' | 'full_reset'
  const [isProcessingReset, setIsProcessingReset] = useState(false);

  // Handle Export
  const handleExport = async () => {
    try {
      const result = await backupService.exportDatabase();
      setExportSuccessMsg(`File backup "${result.filename}" berhasil diunduh!`);
      setTimeout(() => setExportSuccessMsg(''), 5000);
    } catch (err) {
      alert('Gagal mengekspor data: ' + err.message);
    }
  };

  // Handle File Selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setIsConfirmingImport(true);
      setImportErrorMsg('');
    }
  };

  // Handle Import Confirm
  const handleProcessImport = async () => {
    if (!selectedFile) return;

    try {
      setIsProcessingImport(true);
      setImportErrorMsg('');

      const result = await backupService.importDatabase(selectedFile);

      setImportSuccessMsg(
        `Database berhasil dipulihkan dari backup! (${result.counts.products} Barang, ${result.counts.sales} Transaksi Penjualan, ${result.counts.stock_purchases} Kulakan, ${result.counts.expenses} Pengeluaran).`
      );
      setSelectedFile(null);
      setIsConfirmingImport(false);
      setTimeout(() => setImportSuccessMsg(''), 6000);
    } catch (err) {
      setImportErrorMsg(err.message || 'Gagal memulihkan database.');
    } finally {
      setIsProcessingImport(false);
    }
  };

  // Handle Reset Database
  const handleProcessReset = async () => {
    try {
      setIsProcessingReset(true);
      if (resetType === 'transactions_only') {
        await clearAllTransactionsOnly();
        await logService.addLog({
          type: 'SECURITY',
          level: 'WARNING',
          action: 'Pembersihan Riwayat Transaksi',
          details: 'Seluruh riwayat transaksi (Penjualan, Kasbon, Kulakan, Pengeluaran) dibersihkan oleh Pemilik Toko.',
          actor: 'PEMILIK'
        });
        setImportSuccessMsg('Seluruh riwayat transaksi (Penjualan, Kasbon, Kulakan & Pengeluaran) telah dibersihkan!');
      } else if (resetType === 'full_reset') {
        await resetDatabaseToInitial();
        await logService.addLog({
          type: 'SECURITY',
          level: 'SECURITY',
          action: 'Reset Database Ke Kondisi Awal',
          details: 'Database telah di-reset penuh ke kondisi awal sampel barang.',
          actor: 'PEMILIK'
        });
        setImportSuccessMsg('Database telah di-reset sepenuhnya ke kondisi awal bersih!');
      }
      setResetType(null);
      setTimeout(() => setImportSuccessMsg(''), 5000);
    } catch (err) {
      alert('Gagal me-reset data: ' + err.message);
    } finally {
      setIsProcessingReset(false);
    }
  };

  // Handle Clear Logs
  const handleClearLogs = async () => {
    if (confirm('Bersihkan seluruh log aktivitas blackbox?')) {
      await logService.clearLogs();
    }
  };

  const getLogLevelBadge = (level) => {
    switch (level) {
      case 'ERROR':
        return <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full">ERROR</span>;
      case 'WARNING':
        return <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">WARNING</span>;
      case 'SECURITY':
        return <span className="bg-purple-100 text-purple-900 text-[10px] font-bold px-2 py-0.5 rounded-full">SECURITY</span>;
      default:
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">INFO</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Backup, Blackbox Log & Keamanan</span>
            <Lock className="w-5 h-5 text-emerald-600" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Cadangkan data warung, pelajari log aktivitas sistem (blackbox audit), atau atur PIN Pemilik Toko.
          </p>
        </div>

        {/* Change PIN Button */}
        <button
          onClick={() => setIsChangePinOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md text-xs transition active:scale-95"
        >
          <KeyRound className="w-4 h-4" />
          <span>Ubah PIN Pemilik Toko</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 space-x-2">
        <button
          onClick={() => setActiveSubTab('backup')}
          className={`flex items-center space-x-2 py-3 px-4 font-bold text-sm border-b-2 transition ${
            activeSubTab === 'backup'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Backup & Restore Data</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audit_log')}
          className={`flex items-center space-x-2 py-3 px-4 font-bold text-sm border-b-2 transition ${
            activeSubTab === 'audit_log'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Blackbox Audit Log ({stats.logs})</span>
        </button>
      </div>

      {/* SUB-TAB 1: BACKUP & RESTORE */}
      {activeSubTab === 'backup' && (
        <div className="space-y-6">
          {/* Success Banners */}
          {exportSuccessMsg && (
            <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-6 h-6 shrink-0" />
                <span className="text-xs font-bold">{exportSuccessMsg}</span>
              </div>
              <button onClick={() => setExportSuccessMsg('')} className="p-1 hover:text-emerald-200">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {importSuccessMsg && (
            <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-6 h-6 shrink-0" />
                <span className="text-xs font-bold">{importSuccessMsg}</span>
              </div>
              <button onClick={() => setImportSuccessMsg('')} className="p-1 hover:text-emerald-200">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Current DB Status Overview */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Database className="w-5 h-5 text-emerald-400" />
              <h2 className="font-extrabold text-base">Status Data Lokal Saat Ini (IndexedDB)</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Master Barang</span>
                <span className="text-xl font-black text-white mt-1 block">{stats.products}</span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Penjualan</span>
                <span className="text-xl font-black text-emerald-400 mt-1 block">{stats.sales}</span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Item Terjual</span>
                <span className="text-xl font-black text-white mt-1 block">{stats.saleItems}</span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Kulakan</span>
                <span className="text-xl font-black text-blue-400 mt-1 block">{stats.purchases}</span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60 col-span-2 sm:col-span-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Pengeluaran</span>
                <span className="text-xl font-black text-amber-400 mt-1 block">{stats.expenses}</span>
              </div>
            </div>
          </div>

          {/* Main Action Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CARD 1: EKSPOR BACKUP */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                    <Download className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg">1. Ekspor Backup (.json)</h3>
                    <p className="text-xs text-slate-500 font-medium">Unduh cadangan data ke file lokal</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  Menyimpan seluruh master barang, transaksi penjualan kasir, riwayat kulakan, dan catatan pengeluaran kas ke dalam satu file format <strong className="text-slate-900 font-bold">.json</strong>.
                </p>
              </div>

              <button
                onClick={handleExport}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/20 text-sm transition active:scale-98 flex items-center justify-center space-x-2 mt-4"
              >
                <Download className="w-5 h-5" />
                <span>Unduh Backup Sekarang</span>
              </button>
            </div>

            {/* CARD 2: PULIHKAN DATA (RESTORE) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg">2. Pulihkan Data (Restore)</h3>
                    <p className="text-xs text-slate-500 font-medium">Impor data dari file backup .json</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  Pilih file <strong className="text-slate-900 font-bold">.json</strong> hasil ekspor terdahulu untuk memulihkan seluruh data warung di HP/laptop baru.
                </p>
              </div>

              <label className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl shadow-lg shadow-blue-600/20 text-sm transition active:scale-98 flex items-center justify-center space-x-2 cursor-pointer mt-4 text-center">
                <FileJson className="w-5 h-5" />
                <span>Pilih File Backup (.json)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* RESET SECTION FOR TESTING */}
          <div className="bg-white p-6 rounded-3xl border border-rose-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-3 border-b border-rose-100 pb-3">
              <div className="p-2.5 bg-rose-100 text-rose-700 rounded-2xl">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg">3. Reset Data untuk Ujicoba Aplikasi</h3>
                <p className="text-xs text-slate-500 font-medium">Bersihkan transaksi percobaan agar aplikasi siap digunakan dari awal.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Clear Transactions Only */}
              <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-200/80 space-y-2 flex flex-col justify-between">
                <div>
                  <h4 className="font-extrabold text-rose-900 text-sm flex items-center space-x-1.5">
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>Hapus Semua Riwayat Transaksi</span>
                  </h4>
                  <p className="text-xs text-rose-700/80 mt-1 leading-relaxed">
                    Menghapus seluruh riwayat <strong className="text-rose-900">Penjualan, Kasbon, Kulakan, dan Pengeluaran</strong>, namun tetap mempertahankan daftar Master Barang Anda.
                  </p>
                </div>
                <button
                  onClick={() => setResetType('transactions_only')}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 transition mt-3"
                >
                  Bersihkan Riwayat Transaksi
                </button>
              </div>

              {/* Option B: Full Reset */}
              <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 space-y-2 flex flex-col justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center space-x-1.5">
                    <RotateCcw className="w-4 h-4 text-slate-700" />
                    <span>Reset Database ke Kondisi Awal</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Menghapus seluruh transaksi DAN mengembalikan Master Barang ke barang sampel awal.
                  </p>
                </div>
                <button
                  onClick={() => setResetType('full_reset')}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md transition mt-3"
                >
                  Reset Total Ke Kondisi Awal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: BLACKBOX AUDIT LOG */}
      {activeSubTab === 'audit_log' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              <div>
                <h2 className="font-black text-slate-900 text-lg">Blackbox Activity Log (database_log)</h2>
                <p className="text-xs text-slate-500">Mencatat aktivitas otomatis sistem u/ audit keamanan & mendeteksi transaksi mencurigukan.</p>
              </div>
            </div>

            <button
              onClick={handleClearLogs}
              className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-bold rounded-xl text-xs flex items-center space-x-1 shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bersihkan Log</span>
            </button>
          </div>

          {/* Filter Categories */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            {['ALL', 'TRANSACTION', 'DEBT_PAYMENT', 'PURCHASE', 'STOCK_ADJUSTMENT', 'EXPENSE', 'SECURITY', 'ERROR'].map((filter) => (
              <button
                key={filter}
                onClick={() => setLogTypeFilter(filter)}
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                  logTypeFilter === filter
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter === 'ALL' ? 'Semua Log' : filter}
              </button>
            ))}
          </div>

          {/* Log Table / List */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Waktu</th>
                  <th className="py-3 px-3">Level</th>
                  <th className="py-3 px-3">Aktor</th>
                  <th className="py-3 px-3">Aktivitas / Aksi</th>
                  <th className="py-3 px-3">Detail Pesan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400">
                      Belum ada catatan log aktivitas sistem.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap font-mono">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="py-3 px-3">
                        {getLogLevelBadge(log.level)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-extrabold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                          {log.actor || 'SYSTEM'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {log.action}
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px] leading-relaxed max-w-md break-words">
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONFIRMATION RESTORE MODAL */}
      {isConfirmingImport && selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-black text-slate-900 text-xl">Konfirmasi Restore Data</h3>
              <p className="text-xs text-rose-600 font-bold mt-1 uppercase tracking-wider">
                ⚠️ PERHATIAN: MENIMPA DATABASE LOKAL
              </p>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 text-xs text-rose-900 text-left font-medium leading-relaxed">
              Proses ini akan <strong>MENGHAPUS & MENIMPA SELURUH DATA LOKAL</strong> saat ini dengan data yang ada di dalam file <strong className="text-slate-900">{selectedFile.name}</strong>.
            </div>

            {importErrorMsg && (
              <div className="bg-rose-100 text-rose-800 p-3 rounded-xl text-xs font-bold text-left">
                {importErrorMsg}
              </div>
            )}

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsConfirmingImport(false);
                  setSelectedFile(null);
                  setImportErrorMsg('');
                }}
                className="flex-1 py-3 border border-slate-300 rounded-xl font-bold text-slate-700 text-xs hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessingImport}
                onClick={handleProcessImport}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-rose-600/20 active:scale-95"
              >
                {isProcessingImport ? 'Memproses...' : 'Ya, Mulai Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION RESET MODAL */}
      {resetType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-black text-slate-900 text-xl">
                {resetType === 'transactions_only' ? 'Hapus Seluruh Transaksi?' : 'Reset Total Database?'}
              </h3>
              <p className="text-xs text-rose-600 font-bold mt-1 uppercase tracking-wider">
                ⚠️ TINDAKAN TIDAK DAPAT DIBATALKAN
              </p>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              {resetType === 'transactions_only'
                ? 'Seluruh riwayat Penjualan, Kasbon, Kulakan, dan Pengeluaran akan DIHAPUS BERSIH untuk ujicoba baru.'
                : 'Seluruh riwayat transaksi DAN Master Barang akan dikembalikan ke data sampel awal.'}
            </p>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setResetType(null)}
                className="flex-1 py-3 border border-slate-300 rounded-xl font-bold text-slate-700 text-xs hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessingReset}
                onClick={handleProcessReset}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-rose-600/20 active:scale-95"
              >
                {isProcessingReset ? 'Memproses...' : 'Ya, Bersihkan Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE PIN MODAL */}
      <ChangePinModal
        isOpen={isChangePinOpen}
        onClose={() => setIsChangePinOpen(false)}
      />
    </div>
  );
}
