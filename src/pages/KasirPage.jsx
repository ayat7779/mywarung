import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { saleService } from '../services/saleService';
import { formatRupiah } from '../utils/formatters';
import ReceiptModal from '../components/ReceiptModal';
import ProductImage from '../components/ProductImage';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  AlertTriangle,
  Banknote,
  QrCode,
  UserCheck,
  Check,
  ChevronUp,
  X
} from 'lucide-react';

export default function KasirPage() {
  const products = useLiveQuery(() => db.products.toArray(), []) || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  // Cart State
  const [cart, setCart] = useState([]);
  const [paymentType, setPaymentType] = useState('cash'); // 'cash' | 'qris' | 'debt'
  const [customerName, setCustomerName] = useState('');
  const [cashPaidInput, setCashPaidInput] = useState('');

  // UI state
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Receipt Modal State
  const [receiptData, setReceiptData] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Mobile cart sheet open state
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Dynamic Categories
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

  // Cart Total
  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty * item.product.sell_price, 0);
  }, [cart]);

  // Total items in cart
  const totalCartQty = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }, [cart]);

  // Cart actions
  const addToCart = (product) => {
    if (product.stock <= 0) return;

    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex((item) => item.product.id === product.id);
      if (existingIdx > -1) {
        const currentQty = prevCart[existingIdx].qty;
        if (currentQty >= product.stock) {
          setErrorMsg(`Stok "${product.name}" hanya tersedia ${product.stock} unit.`);
          setTimeout(() => setErrorMsg(''), 3000);
          return prevCart;
        }
        const updated = [...prevCart];
        updated[existingIdx] = {
          ...updated[existingIdx],
          qty: currentQty + 1
        };
        return updated;
      } else {
        return [...prevCart, { product, qty: 1 }];
      }
    });
  };

  const updateCartQty = (productId, newQty) => {
    const targetItem = cart.find((item) => item.product.id === productId);
    if (!targetItem) return;

    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQty > targetItem.product.stock) {
      setErrorMsg(`Stok "${targetItem.product.name}" maksimal ${targetItem.product.stock} unit.`);
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId ? { ...item, qty: newQty } : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setCashPaidInput('');
    setErrorMsg('');
  };

  const cashPaidNumeric = Number(cashPaidInput) || 0;
  const changeAmount = Math.max(0, cashPaidNumeric - totalAmount);

  // Preset cash buttons
  const handleQuickCash = (amount) => {
    setCashPaidInput(String(amount));
  };

  // Process Checkout
  const handleCheckout = async () => {
    setErrorMsg('');

    if (cart.length === 0) {
      setErrorMsg('Keranjang belanja masih kosong.');
      return;
    }

    if (paymentType === 'debt' && !customerName.trim()) {
      setErrorMsg('Nama pelanggan wajib diisi jika memilih Kasbon (Hutang).');
      return;
    }

    if (paymentType === 'cash' && cashPaidInput && cashPaidNumeric < totalAmount) {
      setErrorMsg(`Nominal pembayaran tunai kurang dari total (${formatRupiah(totalAmount)}).`);
      return;
    }

    try {
      setIsProcessing(true);
      const result = await saleService.processCheckout({
        items: cart,
        paymentType,
        customerName,
        cashPaid: paymentType === 'cash' ? (cashPaidInput ? cashPaidNumeric : totalAmount) : totalAmount
      });

      // Show receipt
      setReceiptData(result);
      setIsReceiptOpen(true);

      // Reset cart
      clearCart();
      setIsMobileCartOpen(false);
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat checkout.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-8">
      {/* Top Search & Filter Header */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Kasir Penjualan
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Pilih barang untuk menambah ke keranjang transaksi.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari barang atau kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
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
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-150 ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Products on Left, Cart on Right (Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Products Column (8 cols on lg) */}
        <div className="lg:col-span-7 xl:col-span-8">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-sm my-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-700 text-base">Barang Tidak Ditemukan</h3>
              <p className="text-xs text-slate-500 mt-1">Coba kata kunci lain atau tambah barang baru di menu Master Barang.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.stock <= 0;
                const isLowStock = p.stock > 0 && p.stock <= p.min_stock;
                const inCartItem = cart.find((item) => item.product.id === p.id);

                return (
                  <div
                    key={p.id}
                    onClick={() => !isOutOfStock && addToCart(p)}
                    className={`relative bg-white rounded-2xl p-3 border transition-all duration-150 flex flex-col justify-between group overflow-hidden ${
                      isOutOfStock
                        ? 'opacity-60 border-slate-200 bg-slate-50 cursor-not-allowed'
                        : 'border-slate-200 hover:border-emerald-500 hover:shadow-lg cursor-pointer active:scale-[0.98]'
                    }`}
                  >
                    {/* Product Image Container */}
                    <div className="relative w-full h-28 sm:h-32 rounded-xl overflow-hidden mb-2 bg-slate-100 border border-slate-100">
                      <ProductImage
                        src={p.image_url}
                        alt={p.name}
                        className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                        iconClassName="w-8 h-8 text-slate-400"
                      />

                      {/* Floating Category & Stock Badges */}
                      <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none gap-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900/80 text-white backdrop-blur-md truncate max-w-[80px]">
                          {p.category}
                        </span>

                        {isOutOfStock ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-600 text-white shadow-sm">
                            Habis
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950 flex items-center space-x-0.5 shadow-sm">
                            <AlertTriangle className="w-3 h-3 text-slate-950" />
                            <span>Sisa {p.stock}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium bg-slate-900/70 text-slate-200 px-2 py-0.5 rounded-md backdrop-blur-md">
                            Stok: {p.stock}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="mb-2">
                      <h3 className="font-bold text-slate-800 text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors">
                        {p.name}
                      </h3>
                      <p className="font-extrabold text-emerald-600 text-sm sm:text-base mt-1">
                        {formatRupiah(p.sell_price)}
                      </p>
                    </div>

                    {/* Action Button & In Cart Badge */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-auto">
                      {inCartItem ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black px-2 py-1 rounded-lg">
                          {inCartItem.qty}x di keranjang
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Klik u/ Beli</span>
                      )}

                      <button
                        disabled={isOutOfStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isOutOfStock) addToCart(p);
                        }}
                        className={`p-2 rounded-xl transition ${
                          isOutOfStock
                            ? 'bg-slate-200 text-slate-400'
                            : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold shadow-sm'
                        }`}
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop Shopping Cart Column (4 cols on lg) */}
        <div className="hidden lg:block lg:col-span-5 xl:col-span-4 sticky top-20">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100vh-100px)]">
            {/* Cart Header */}
            <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-emerald-400" />
                <h2 className="font-bold text-base">Keranjang Penjualan</h2>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-2 py-1 rounded hover:bg-slate-800 transition"
                >
                  Kosongkan
                </button>
              )}
            </div>

            {/* Error Banner inside Cart */}
            {errorMsg && (
              <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 text-xs text-rose-700 font-semibold flex items-center justify-between">
                <span>{errorMsg}</span>
                <button onClick={() => setErrorMsg('')} className="text-rose-400 hover:text-rose-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Cart Items List */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1 min-h-[180px] max-h-[320px] divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-semibold">Keranjang masih kosong</p>
                  <p className="text-[11px] text-slate-400">Pilih barang dari daftar di sebelah kiri.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="pt-3 first:pt-0 flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                      <ProductImage
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-10 h-10 rounded-lg border border-slate-200"
                        iconClassName="w-5 h-5 text-slate-400"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-800 text-xs truncate">{item.product.name}</h4>
                        <p className="text-xs text-emerald-600 font-extrabold mt-0.5">
                          {formatRupiah(item.product.sell_price)}
                        </p>
                      </div>
                    </div>

                    {/* Qty Controls */}
                    <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
                      <button
                        onClick={() => updateCartQty(item.product.id, item.qty - 1)}
                        className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-700 font-bold hover:bg-rose-50 hover:text-rose-600 transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <input
                        type="number"
                        min="1"
                        max={item.product.stock}
                        value={item.qty}
                        onChange={(e) => updateCartQty(item.product.id, Number(e.target.value))}
                        className="w-9 text-center text-xs font-black bg-transparent focus:outline-none"
                      />

                      <button
                        onClick={() => updateCartQty(item.product.id, item.qty + 1)}
                        className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-700 font-bold hover:bg-emerald-50 hover:text-emerald-600 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-400 hover:text-rose-500 p-1 transition"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer & Checkout Form */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-4">
              {/* Total Summary */}
              <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <div>
                  <span className="text-xs text-slate-500 font-semibold uppercase block">Total Belanja</span>
                  <span className="text-xs text-slate-400">{totalCartQty} item</span>
                </div>
                <span className="text-xl font-black text-slate-900">{formatRupiah(totalAmount)}</span>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentType('cash')}
                    className={`flex items-center justify-center space-x-1 py-2 px-2 rounded-xl text-xs font-bold transition border ${
                      paymentType === 'cash'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Tunai</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentType('qris')}
                    className={`flex items-center justify-center space-x-1 py-2 px-2 rounded-xl text-xs font-bold transition border ${
                      paymentType === 'qris'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QRIS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentType('debt')}
                    className={`flex items-center justify-center space-x-1 py-2 px-2 rounded-xl text-xs font-bold transition border ${
                      paymentType === 'debt'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Kasbon</span>
                  </button>
                </div>
              </div>

              {/* Conditional Payment Inputs */}
              {paymentType === 'cash' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Nominal Uang Bayar (Rp)</label>
                  <input
                    type="number"
                    placeholder={`Min: ${formatRupiah(totalAmount)}`}
                    value={cashPaidInput}
                    onChange={(e) => setCashPaidInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />

                  {/* Quick Cash Buttons */}
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => handleQuickCash(totalAmount)}
                      className="text-[11px] font-bold px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700"
                    >
                      Uang Pas
                    </button>
                    {[10000, 20000, 50000, 100000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleQuickCash(amt)}
                        className="text-[11px] font-bold px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700"
                      >
                        {formatRupiah(amt)}
                      </button>
                    ))}
                  </div>

                  {cashPaidNumeric > 0 && (
                    <div className="flex justify-between items-center text-xs pt-1 font-bold">
                      <span className="text-slate-600">Kembalian:</span>
                      <span className={cashPaidNumeric >= totalAmount ? 'text-emerald-600 text-sm' : 'text-rose-500'}>
                        {formatRupiah(changeAmount)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {paymentType === 'debt' && (
                <div>
                  <label className="block text-xs font-bold text-rose-800 mb-1">
                    Nama Pelanggan <span className="text-rose-600">* Wajib</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pak Budi / Bu Ani"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              )}

              {/* Checkout Button */}
              <button
                disabled={cart.length === 0 || isProcessing}
                onClick={handleCheckout}
                className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center space-x-2 shadow-lg transition active:scale-98 ${
                  cart.length === 0 || isProcessing
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                    : paymentType === 'debt'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25'
                }`}
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span>
                  {isProcessing
                    ? 'Memproses...'
                    : paymentType === 'debt'
                    ? 'Catat Kasbon (Hutang)'
                    : 'Bayar Sekarang'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Floating Bottom Bar to open Cart */}
      <div className="lg:hidden fixed bottom-16 left-4 right-4 z-20">
        <button
          onClick={() => setIsMobileCartOpen(true)}
          className="w-full bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between border border-slate-700"
        >
          <div className="flex items-center space-x-3">
            <div className="relative p-2 bg-emerald-500 text-slate-900 rounded-xl">
              <ShoppingCart className="w-5 h-5" />
              {totalCartQty > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900">
                  {totalCartQty}
                </span>
              )}
            </div>
            <div className="text-left">
              <span className="text-xs text-slate-400 font-medium block">Keranjang Transaksi</span>
              <span className="font-extrabold text-base text-emerald-400">{formatRupiah(totalAmount)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-1 font-bold text-xs bg-slate-800 px-3 py-2 rounded-xl text-emerald-400">
            <span>Buka</span>
            <ChevronUp className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* Mobile Cart Sheet / Modal */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-emerald-400" />
                <h2 className="font-bold text-base">Keranjang Belanja</h2>
              </div>
              <button
                onClick={() => setIsMobileCartOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-rose-50 px-4 py-2 text-xs text-rose-700 font-semibold border-b border-rose-200">
                {errorMsg}
              </div>
            )}

            <div className="p-4 overflow-y-auto space-y-3 flex-1 divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-slate-400">Keranjang masih kosong</div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="pt-3 first:pt-0 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <ProductImage
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-10 h-10 rounded-lg border border-slate-200"
                        iconClassName="w-5 h-5 text-slate-400"
                      />
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs">{item.product.name}</h4>
                        <p className="text-xs text-emerald-600 font-bold">{formatRupiah(item.product.sell_price)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
                      <button
                        onClick={() => updateCartQty(item.product.id, item.qty - 1)}
                        className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-black">{item.qty}</span>
                      <button
                        onClick={() => updateCartQty(item.product.id, item.qty + 1)}
                        className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700">TOTAL:</span>
                <span className="font-black text-xl text-slate-900">{formatRupiah(totalAmount)}</span>
              </div>

              {/* Payment selector */}
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => setPaymentType('cash')}
                  className={`py-2 text-xs font-bold rounded-xl border ${
                    paymentType === 'cash' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'
                  }`}
                >
                  Tunai
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('qris')}
                  className={`py-2 text-xs font-bold rounded-xl border ${
                    paymentType === 'qris' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'
                  }`}
                >
                  QRIS
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('debt')}
                  className={`py-2 text-xs font-bold rounded-xl border ${
                    paymentType === 'debt' ? 'bg-rose-600 text-white' : 'bg-white text-slate-700'
                  }`}
                >
                  Kasbon
                </button>
              </div>

              {paymentType === 'cash' && (
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder={`Nominal Uang Bayar (Min: ${formatRupiah(totalAmount)})`}
                    value={cashPaidInput}
                    onChange={(e) => setCashPaidInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold"
                  />

                  {/* Quick Cash Buttons */}
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => handleQuickCash(totalAmount)}
                      className="text-[11px] font-bold px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700"
                    >
                      Uang Pas
                    </button>
                    {[10000, 20000, 50000, 100000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleQuickCash(amt)}
                        className="text-[11px] font-bold px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700"
                      >
                        {formatRupiah(amt)}
                      </button>
                    ))}
                  </div>

                  {cashPaidNumeric > 0 && (
                    <div className="flex justify-between items-center text-xs pt-1 font-bold">
                      <span className="text-slate-600">Kembalian:</span>
                      <span className={cashPaidNumeric >= totalAmount ? 'text-emerald-600 text-sm' : 'text-rose-500'}>
                        {formatRupiah(changeAmount)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {paymentType === 'debt' && (
                <input
                  type="text"
                  placeholder="Nama Pelanggan (Wajib)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-sm font-bold"
                />
              )}

              <button
                disabled={cart.length === 0 || isProcessing}
                onClick={handleCheckout}
                className="w-full py-3.5 bg-emerald-600 text-white font-extrabold rounded-xl text-sm shadow-lg"
              >
                Bayar Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receiptData={receiptData}
      />
    </div>
  );
}
