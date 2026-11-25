import React, { useState } from 'react';
import { X, Receipt, Save, AlertCircle, ShoppingBag, User } from 'lucide-react';
import { financeService } from '../services/financeService';

export default function ExpenseFormModal({ isOpen, onClose, onSuccess }) {
  const [category, setCategory] = useState('operational'); // 'operational' | 'personal_draw'
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 16));

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!note.trim()) {
      setError('Catatan pengeluaran wajib diisi.');
      return;
    }

    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Nominal pengeluaran harus berupa angka lebih besar dari 0.');
      return;
    }

    try {
      setIsSubmitting(true);
      await financeService.addExpense({
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
        category,
        note,
        amount: amountNum
      });

      // Reset
      setNote('');
      setAmount('');
      setError('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan pengeluaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 my-8">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
            <h2 className="font-extrabold text-base">Catat Pengeluaran Kas</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-800">
          {error && (
            <div className="flex items-center space-x-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Kategori Pengeluaran */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Jenis Pengeluaran <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCategory('operational')}
                className={`p-3 rounded-2xl text-left border transition flex flex-col justify-between space-y-1 ${
                  category === 'operational'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md font-bold'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <ShoppingBag className="w-4 h-4" />
                  <span className="text-xs font-extrabold">Biaya Warung</span>
                </div>
                <span className="text-[10px] font-normal opacity-80">
                  Plastik, listrik, bensin belanja, lakban
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('personal_draw')}
                className={`p-3 rounded-2xl text-left border transition flex flex-col justify-between space-y-1 ${
                  category === 'personal_draw'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-md font-bold'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <User className="w-4 h-4" />
                  <span className="text-xs font-extrabold">Ambil Pribadi</span>
                </div>
                <span className="text-[10px] font-normal opacity-80">
                  Uang kas u/ keperluan rumah tangga
                </span>
              </button>
            </div>
          </div>

          {/* Nominal Pengeluaran */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nominal Uang Keluar (Rp) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Catatan Pengeluaran */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Catatan Singkat <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Beli kantong plastik 2 pak"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Tanggal & Waktu */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Tanggal & Waktu
            </label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-xl border border-slate-300 font-bold text-slate-700 text-xs hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-lg shadow-emerald-600/20 text-xs transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengeluaran</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
