import React, { useState, useEffect } from 'react';
import { X, PackagePlus, Save, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import ProductImage from './ProductImage';

const CATEGORIES = ['Makanan', 'Minuman', 'Sembako', 'Perlengkapan', 'Rokok', 'Lainnya'];

export default function ProductFormModal({ isOpen, onClose, onSave, productToEdit }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Makanan',
    cost_price: '',
    sell_price: '',
    stock: '',
    min_stock: '5',
    image_url: ''
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name || '',
        category: productToEdit.category || 'Makanan',
        cost_price: productToEdit.cost_price !== undefined ? String(productToEdit.cost_price) : '',
        sell_price: productToEdit.sell_price !== undefined ? String(productToEdit.sell_price) : '',
        stock: productToEdit.stock !== undefined ? String(productToEdit.stock) : '',
        min_stock: productToEdit.min_stock !== undefined ? String(productToEdit.min_stock) : '5',
        image_url: productToEdit.image_url || ''
      });
    } else {
      setFormData({
        name: '',
        category: 'Makanan',
        cost_price: '',
        sell_price: '',
        stock: '10',
        min_stock: '5',
        image_url: ''
      });
    }
    setError('');
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Nama barang tidak boleh kosong.');
      return;
    }

    const costPrice = Number(formData.cost_price);
    const sellPrice = Number(formData.sell_price);
    const stock = Number(formData.stock);
    const minStock = Number(formData.min_stock);

    if (isNaN(costPrice) || costPrice < 0) {
      setError('Harga modal harus berupa angka 0 atau lebih.');
      return;
    }
    if (isNaN(sellPrice) || sellPrice < 0) {
      setError('Harga jual harus berupa angka 0 atau lebih.');
      return;
    }
    if (isNaN(stock) || stock < 0) {
      setError('Stok harus berupa angka 0 atau lebih.');
      return;
    }
    if (isNaN(minStock) || minStock < 0) {
      setError('Minimal stok harus berupa angka 0 atau lebih.');
      return;
    }

    try {
      await onSave({
        ...formData,
        cost_price: costPrice,
        sell_price: sellPrice,
        stock: stock,
        min_stock: minStock
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan barang.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 my-8">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <PackagePlus className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-lg">
              {productToEdit ? 'Edit Barang' : 'Tambah Barang Baru'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center space-x-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Gambar Barang Preview & Input */}
          <div className="flex items-center space-x-4 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <ProductImage
              src={formData.image_url}
              alt={formData.name || 'Preview'}
              className="w-16 h-16 rounded-xl border border-slate-200"
              iconClassName="w-8 h-8 text-slate-400"
            />
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>URL Gambar Barang (Opsional)</span>
              </label>
              <input
                type="url"
                placeholder="https://domain.com/gambar.jpg"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Nama Barang */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nama Barang <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Indomie Goreng"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition font-medium text-slate-800"
              required
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Kategori Barang
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat })}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    formData.category === cat
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Atau ketik kategori lain..."
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
            />
          </div>

          {/* Harga Modal & Harga Jual Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Harga Modal (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Harga Jual (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={formData.sell_price}
                onChange={(e) => setFormData({ ...formData, sell_price: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700"
                required
              />
            </div>
          </div>

          {/* Profit info helper */}
          {formData.sell_price && formData.cost_price && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2 text-xs font-medium text-emerald-800 flex justify-between items-center">
              <span>Perkiraan Keuntungan:</span>
              <span className="font-bold">
                {formatRupiah(Math.max(0, Number(formData.sell_price) - Number(formData.cost_price)))} / unit
              </span>
            </div>
          )}

          {/* Stok & Minimal Stok Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Jumlah Stok Saat Ini <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Batas Minimal Stok (Alert) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="5"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-amber-700"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">Peringatan muncul jika stok ≤ batas ini.</p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-100 transition text-sm"
            >
              Batal
            </button>

            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/25 transition active:scale-95 text-sm"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Barang</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
