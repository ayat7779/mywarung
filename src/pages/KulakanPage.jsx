import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { inventoryService } from '../services/inventoryService';
import { formatRupiah, formatDate } from '../utils/formatters';
import ProductImage from '../components/ProductImage';
import {
  Truck,
  PlusCircle,
  SlidersHorizontal,
  History,
  AlertCircle,
  CheckCircle2,
  Package,
  TrendingUp,
  MinusCircle
} from 'lucide-react';

const ADJUSTMENT_PRESETS = [
  'Barang Rusak / Pecah / Kadaluarsa',
  'Dipakai Sendiri / Keluarga',
  'Koreksi Stok Fisik (Opname)',
  'Bonus / Hadiah dari Supplier'
];

export default function KulakanPage() {
  const products = useLiveQuery(() => db.products.toArray(), []) || [];

  const [activeSubTab, setActiveSubTab] = useState('kulakan'); // 'kulakan' | 'penyesuaian'

  // Form Kulakan State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [purchaseQty, setPurchaseQty] = useState('');
  const [unitCostInput, setUnitCostInput] = useState('');
  const [kulakanError, setKulakanError] = useState('');
  const [kulakanSuccess, setKulakanSuccess] = useState('');
  const [isSubmittingKulakan, setIsSubmittingKulakan] = useState(false);

  // Form Penyesuaian State
  const [adjustProductId, setAdjustProductId] = useState('');
  const [adjustType, setAdjustType] = useState('kurang'); // 'kurang' | 'tambah'
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNote, setAdjustNote] = useState('Barang Rusak / Pecah / Kadaluarsa');
  const [adjustError, setAdjustError] = useState('');
  const [adjustSuccess, setAdjustSuccess] = useState('');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  // Riwayat Kulakan
  const [recentPurchases, setRecentPurchases] = useState([]);

  const loadRecentPurchases = async () => {
    const list = await inventoryService.getRecentPurchases(15);
    setRecentPurchases(list);
  };

  useEffect(() => {
    loadRecentPurchases();
  }, [products]);

  // Selected Product Info Helpers
  const selectedProduct = products.find((p) => p.id === Number(selectedProductId));
  const adjustProduct = products.find((p) => p.id === Number(adjustProductId));

  // Auto set unitCostInput when selectedProduct changes
  useEffect(() => {
    if (selectedProduct) {
      setUnitCostInput(String(selectedProduct.cost_price || ''));
    }
  }, [selectedProductId]);

  const purchaseTotalCost = (Number(purchaseQty) || 0) * (Number(unitCostInput) || 0);

  // Handle Kulakan Submit
  const handleKulakanSubmit = async (e) => {
    e.preventDefault();
    setKulakanError('');
    setKulakanSuccess('');

    try {
      setIsSubmittingKulakan(true);
      await inventoryService.recordStockPurchase({
        productId: selectedProductId,
        qty: purchaseQty,
        unitCost: unitCostInput
      });

      setKulakanSuccess(`Berhasil mencatat kulakan "${selectedProduct?.name}" (+${purchaseQty} unit). Stok baru: ${(selectedProduct?.stock || 0) + Number(purchaseQty)}.`);
      setSelectedProductId('');
      setPurchaseQty('');
      setUnitCostInput('');
      await loadRecentPurchases();
    } catch (err) {
      setKulakanError(err.message || 'Gagal menyimpan data kulakan.');
    } finally {
      setIsSubmittingKulakan(false);
    }
  };

  // Handle Penyesuaian Submit
  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    setAdjustError('');
    setAdjustSuccess('');

    try {
      setIsSubmittingAdjust(true);
      const newStock = await inventoryService.adjustStock({
        productId: adjustProductId,
        type: adjustType,
        qty: adjustQty,
        note: adjustNote
      });

      setAdjustSuccess(`Berhasil menyesuaikan stok "${adjustProduct?.name}". Stok terbaru kini ${newStock} unit.`);
      setAdjustProductId('');
      setAdjustQty('');
    } catch (err) {
      setAdjustError(err.message || 'Gagal menyimpan penyesuaian stok.');
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Kulakan & Penyesuaian Stok
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Catat stok masuk dari supplier (kulakan) atau atur penyesuaian stok fisik opname/barang rusak.
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 space-x-2">
        <button
          onClick={() => setActiveSubTab('kulakan')}
          className={`flex items-center space-x-2 py-3 px-4 font-bold text-sm border-b-2 transition ${
            activeSubTab === 'kulakan'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Catat Kulakan (Stok Masuk)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('penyesuaian')}
          className={`flex items-center space-x-2 py-3 px-4 font-bold text-sm border-b-2 transition ${
            activeSubTab === 'penyesuaian'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Penyesuaian Stok (Opname/Rusak)</span>
        </button>
      </div>

      {/* SUB-TAB 1: KULAKAN (STOK MASUK) */}
      {activeSubTab === 'kulakan' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Input Kulakan (5 cols on lg) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                <PlusCircle className="w-5 h-5" />
              </div>
              <h2 className="font-extrabold text-base text-slate-900">Form Stok Masuk / Kulakan</h2>
            </div>

            {kulakanError && (
              <div className="flex items-center space-x-2 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{kulakanError}</span>
              </div>
            )}

            {kulakanSuccess && (
              <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{kulakanSuccess}</span>
              </div>
            )}

            <form onSubmit={handleKulakanSubmit} className="space-y-4">
              {/* Pilih Barang */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Pilih Barang <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">-- Pilih Barang dari Master --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stok: {p.stock} | Modal: {formatRupiah(p.cost_price)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Detail Info Barang terpilih */}
              {selectedProduct && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex items-center space-x-3">
                  <ProductImage
                    src={selectedProduct.image_url}
                    alt={selectedProduct.name}
                    className="w-12 h-12 rounded-lg border border-slate-200"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">{selectedProduct.name}</span>
                    <span className="text-slate-500">Stok Saat Ini: <strong className="text-slate-800">{selectedProduct.stock} unit</strong></span>
                    <span className="block text-emerald-700 font-bold mt-0.5">Harga Modal Lama: {formatRupiah(selectedProduct.cost_price)}</span>
                  </div>
                </div>
              )}

              {/* Jumlah Unit Masuk & Harga Modal Per Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Jumlah Masuk (Qty) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Contoh: 10"
                    value={purchaseQty}
                    onChange={(e) => setPurchaseQty(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Harga Modal/Unit (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={unitCostInput}
                    onChange={(e) => setUnitCostInput(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Calculated Total Cost */}
              {purchaseTotalCost > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">TOTAL BIAYA KULAKAN:</span>
                  <span className="font-black text-emerald-700 text-base">{formatRupiah(purchaseTotalCost)}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingKulakan}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-600/20 text-sm transition active:scale-98 flex items-center justify-center space-x-2"
              >
                <PlusCircle className="w-5 h-5" />
                <span>{isSubmittingKulakan ? 'Memproses...' : 'Simpan Data Kulakan'}</span>
              </button>
            </form>
          </div>

          {/* Tabel Riwayat Kulakan Terbaru (7 cols on lg) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-slate-700" />
                <h2 className="font-extrabold text-base text-slate-900">Riwayat Kulakan Terbaru</h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">15 Terakhir</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3 rounded-l-lg">Tanggal</th>
                    <th className="py-2.5 px-3">Barang</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Modal/Unit</th>
                    <th className="py-2.5 px-3 text-right rounded-r-lg">Total Modal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {recentPurchases.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-400">
                        Belum ada riwayat kulakan.
                      </td>
                    </tr>
                  ) : (
                    recentPurchases.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                          {formatDate(item.date)}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          <div className="flex items-center space-x-2">
                            <ProductImage
                              src={item.image_url}
                              alt={item.product_name}
                              className="w-7 h-7 rounded-lg border border-slate-200"
                              iconClassName="w-4 h-4 text-slate-400"
                            />
                            <span>{item.product_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-black text-emerald-700">
                          +{item.qty}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-600 font-mono">
                          {formatRupiah(item.unit_cost)}
                        </td>
                        <td className="py-3 px-3 text-right font-extrabold text-slate-900 font-mono">
                          {formatRupiah(item.total_cost)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: PENYESUAIAN STOK */}
      {activeSubTab === 'penyesuaian' && (
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900">Form Penyesuaian Stok Fisik</h2>
              <p className="text-xs text-slate-500">Gunakan form ini jika ada barang opname, rusak/kadaluarsa, atau dipakai pribadi.</p>
            </div>
          </div>

          {adjustError && (
            <div className="flex items-center space-x-2 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{adjustError}</span>
            </div>
          )}

          {adjustSuccess && (
            <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{adjustSuccess}</span>
            </div>
          )}

          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            {/* Pilih Barang */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Pilih Barang <span className="text-rose-500">*</span>
              </label>
              <select
                value={adjustProductId}
                onChange={(e) => setAdjustProductId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">-- Pilih Barang yang Akan Disesuaikan --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stok Saat Ini: {p.stock} unit)
                  </option>
                ))}
              </select>
            </div>

            {/* Info Product terpilih */}
            {adjustProduct && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex items-center space-x-3">
                <ProductImage
                  src={adjustProduct.image_url}
                  alt={adjustProduct.name}
                  className="w-12 h-12 rounded-lg border border-slate-200"
                />
                <div>
                  <span className="font-bold text-slate-900 block">{adjustProduct.name}</span>
                  <span className="text-slate-600">Stok Fisik Saat Ini: <strong className="text-slate-900 text-sm font-black">{adjustProduct.stock} unit</strong></span>
                </div>
              </div>
            )}

            {/* Jenis Penyesuaian: Kurangi / Tambah */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Aksi Penyesuaian <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('kurang')}
                  className={`py-3 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 border transition ${
                    adjustType === 'kurang'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <MinusCircle className="w-4 h-4" />
                  <span>Kurangi Stok (Opname / Rusak)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdjustType('tambah')}
                  className={`py-3 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 border transition ${
                    adjustType === 'tambah'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Tambah Stok (Koreksi / Bonus)</span>
                </button>
              </div>
            </div>

            {/* Jumlah Penyesuaian (Qty) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Jumlah Penyesuaian (Unit) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                placeholder="Contoh: 2"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Alasan Penyesuaian */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Alasan Penyesuaian <span className="text-rose-500">*</span>
              </label>

              {/* Preset buttons */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {ADJUSTMENT_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAdjustNote(preset)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      adjustNote === preset
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Ketik alasan singkat..."
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingAdjust}
              className={`w-full py-3.5 text-white font-extrabold rounded-xl shadow-lg text-sm transition active:scale-98 flex items-center justify-center space-x-2 ${
                adjustType === 'kurang' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span>{isSubmittingAdjust ? 'Memproses...' : 'Simpan Penyesuaian Stok'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
