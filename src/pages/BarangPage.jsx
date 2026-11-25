import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { productService } from '../services/productService';
import { formatRupiah } from '../utils/formatters';
import ProductFormModal from '../components/ProductFormModal';
import ProductImage from '../components/ProductImage';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Boxes,
  X,
  CheckCircle2,
  ShieldAlert,
  Lock
} from 'lucide-react';

export default function BarangPage() {
  const products = useLiveQuery(() => db.products.toArray(), []) || [];

  // Live query for sale_items to aggregate units sold per product
  const soldStats = useLiveQuery(async () => {
    const items = await db.sale_items.toArray();
    const stats = {};
    for (const item of items) {
      stats[item.product_id] = (stats[item.product_id] || 0) + (item.qty || 0);
    }
    return stats;
  }, []) || {};

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);

  // Delete Confirm / Protected Modal
  const [deleteTargetProduct, setDeleteTargetProduct] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  // Categories list
  const categories = useMemo(() => {
    const cats = ['Semua'];
    products.forEach((p) => {
      if (p.category && !cats.includes(p.category)) {
        cats.push(p.category);
      }
    });
    return cats;
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Stat Counters
  const totalProducts = products.length;
  const totalStock = useMemo(() => products.reduce((acc, p) => acc + (p.stock || 0), 0), [products]);
  const lowStockProducts = useMemo(() => products.filter((p) => p.stock <= p.min_stock), [products]);

  // Handlers
  const handleOpenAddModal = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (formData) => {
    if (productToEdit) {
      await productService.updateProduct(productToEdit.id, formData);
    } else {
      await productService.addProduct(formData);
    }
  };

  const handleDeleteProduct = async (id) => {
    setDeleteError('');
    try {
      await productService.deleteProduct(id);
      setDeleteTargetProduct(null);
    } catch (err) {
      setDeleteError(err.message || 'Gagal menghapus barang.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-8 space-y-6">
      {/* Top Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Master Data Barang
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Kelola foto, stok, harga modal, harga jual, dan batas peringatan stok.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center space-x-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition active:scale-95 text-sm"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Tambah Barang Baru</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Total Jenis Barang</span>
            <span className="text-2xl font-black text-slate-900">{totalProducts}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Total Stok Fisik</span>
            <span className="text-2xl font-black text-slate-900">{totalStock} <span className="text-xs text-slate-400 font-normal">unit</span></span>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border shadow-sm flex items-center space-x-4 transition ${
          lowStockProducts.length > 0 ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'
        }`}>
          <div className={`p-3 rounded-xl ${
            lowStockProducts.length > 0 ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-100 text-slate-500'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className={`text-xs font-bold uppercase tracking-wider block ${
              lowStockProducts.length > 0 ? 'text-rose-800' : 'text-slate-500'
            }`}>
              Stok Menipis / Habis
            </span>
            <span className={`text-2xl font-black ${
              lowStockProducts.length > 0 ? 'text-rose-700' : 'text-slate-900'
            }`}>
              {lowStockProducts.length} <span className="text-xs font-normal">barang</span>
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama barang..."
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

          {/* Low Stock Quick Filter */}
          <button
            onClick={() => {
              if (selectedCategory === 'STOK_MENIPIS') {
                setSelectedCategory('Semua');
              } else {
                setSelectedCategory('STOK_MENIPIS');
              }
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 border transition ${
              selectedCategory === 'STOK_MENIPIS'
                ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Filter Stok Menipis ({lowStockProducts.length})</span>
          </button>
        </div>

        {/* Categories Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto pt-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table (Desktop & Tablet) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Nama Barang</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4 text-right">Modal</th>
                <th className="py-3.5 px-4 text-right">Harga Jual</th>
                <th className="py-3.5 px-4 text-right">Untung / Unit</th>
                <th className="py-3.5 px-4 text-center">Stok / Min</th>
                <th className="py-3.5 px-4 text-center">Status / Penjualan</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    Tidak ada data barang.
                  </td>
                </tr>
              ) : (
                filteredProducts
                  .filter((p) => selectedCategory !== 'STOK_MENIPIS' || p.stock <= p.min_stock)
                  .map((p) => {
                    const profit = p.sell_price - p.cost_price;
                    const isOutOfStock = p.stock <= 0;
                    const isLowStock = p.stock > 0 && p.stock <= p.min_stock;
                    const totalSold = soldStats[p.id] || 0;
                    const isProtected = totalSold > 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div className="flex items-center space-x-3">
                            <ProductImage
                              src={p.image_url}
                              alt={p.name}
                              className="w-10 h-10 rounded-xl border border-slate-200"
                            />
                            <span className="truncate">{p.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-md font-semibold">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-600 font-mono">
                          {formatRupiah(p.cost_price)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600 font-mono">
                          {formatRupiah(p.sell_price)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-700 font-mono">
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs">
                            +{formatRupiah(profit)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`font-black ${isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-slate-800'}`}>
                            {p.stock}
                          </span>
                          <span className="text-slate-400 text-xs"> / {p.min_stock}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            {isOutOfStock ? (
                              <span className="bg-rose-100 text-rose-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                                Habis
                              </span>
                            ) : isLowStock ? (
                              <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center justify-center space-x-1 inline-flex">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                                <span>Stok Menipis</span>
                              </span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                Stok Aman
                              </span>
                            )}

                            {/* Badge Pernah Laku */}
                            {isProtected && (
                              <span className="bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                                <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                                <span>Pernah Laku ({totalSold} unit)</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="Edit Barang"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteError('');
                                setDeleteTargetProduct(p);
                              }}
                              className={`p-2 rounded-lg transition ${
                                isProtected
                                  ? 'text-slate-300 hover:text-indigo-600 hover:bg-indigo-50'
                                  : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              }`}
                              title={isProtected ? 'Barang Pernah Laku (Dilindungi)' : 'Hapus Barang'}
                            >
                              {isProtected ? <Lock className="w-4 h-4 text-indigo-500" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Products Cards View (Mobile) */}
      <div className="md:hidden space-y-3">
        {filteredProducts
          .filter((p) => selectedCategory !== 'STOK_MENIPIS' || p.stock <= p.min_stock)
          .map((p) => {
            const isOutOfStock = p.stock <= 0;
            const isLowStock = p.stock > 0 && p.stock <= p.min_stock;
            const totalSold = soldStats[p.id] || 0;
            const isProtected = totalSold > 0;

            return (
              <div key={p.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <ProductImage
                      src={p.image_url}
                      alt={p.name}
                      className="w-12 h-12 rounded-xl border border-slate-200"
                    />
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {p.category}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base mt-0.5">{p.name}</h3>

                      {isProtected && (
                        <span className="inline-flex items-center space-x-1 mt-1 bg-indigo-50 border border-indigo-200 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                          <span>Pernah Laku ({totalSold} unit)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {isOutOfStock ? (
                    <span className="bg-rose-100 text-rose-800 text-xs font-black px-2.5 py-1 rounded-full">
                      Habis
                    </span>
                  ) : isLowStock ? (
                    <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Menipis ({p.stock})</span>
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
                      Stok: {p.stock}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl text-xs font-medium border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Harga Modal:</span>
                    <span className="font-semibold text-slate-700">{formatRupiah(p.cost_price)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Harga Jual:</span>
                    <span className="font-extrabold text-emerald-600">{formatRupiah(p.sell_price)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500 font-semibold">
                    Min Stock: <span className="text-slate-800">{p.min_stock}</span>
                  </span>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(p)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs flex items-center space-x-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        setDeleteError('');
                        setDeleteTargetProduct(p);
                      }}
                      className={`px-3 py-1.5 font-bold rounded-lg text-xs flex items-center space-x-1 ${
                        isProtected
                          ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                      }`}
                    >
                      {isProtected ? <Lock className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                      <span>{isProtected ? 'Terkunci' : 'Hapus'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Add / Edit Form Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        productToEdit={productToEdit}
      />

      {/* Delete / Protection Modal */}
      {deleteTargetProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100 text-center">
            {soldStats[deleteTargetProduct.id] > 0 ? (
              <>
                <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Barang Tidak Dapat Dihapus!</h3>
                  <div className="mt-2 bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-950 font-medium leading-relaxed">
                    Barang <span className="font-bold text-indigo-900">"{deleteTargetProduct.name}"</span> memiliki riwayat transaksi penjualan (<span className="font-bold">{soldStats[deleteTargetProduct.id]} unit terjual</span>).
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Demi keakuratan laporan dan keamanan data transaksi, barang yang pernah laku dilarang dihapus. Anda hanya dapat mengubah nama, harga, atau mengurangi stoknya.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => setDeleteTargetProduct(null)}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md"
                  >
                    Saya Mengerti
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Hapus Barang Ini?</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Barang <span className="font-bold text-slate-800">"{deleteTargetProduct.name}"</span> belum pernah laku. Data yang dihapus tidak dapat dikembalikan.
                  </p>
                </div>

                {deleteError && (
                  <div className="text-xs text-rose-600 font-bold bg-rose-50 p-2 rounded-lg">
                    {deleteError}
                  </div>
                )}

                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={() => setDeleteTargetProduct(null)}
                    className="flex-1 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 text-xs hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(deleteTargetProduct.id)}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20"
                  >
                    Ya, Hapus
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
