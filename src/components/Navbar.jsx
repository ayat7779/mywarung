import React from 'react';
import { ShoppingCart, Package, BookOpen, BarChart3, Store, Truck, HardDrive, Edit3 } from 'lucide-react';
import { profileService } from '../services/profileService';

export default function Navbar({ activeTab, setActiveTab, lowStockCount = 0, unpaidDebtCount = 0, onOpenProfile }) {
  const shopProfile = profileService.getProfile();

  return (
    <>
      {/* Desktop & Tablet Header */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Shop Profile Clickable Area */}
            <div
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => setActiveTab('kasir')}
            >
              <div className="relative">
                {shopProfile.logo_url ? (
                  <img
                    src={shopProfile.logo_url}
                    alt={shopProfile.name}
                    onError={(e) => { e.target.style.display = 'none'; }}
                    className="w-10 h-10 rounded-xl object-cover border-2 border-emerald-500 shadow-md group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="bg-emerald-500 p-2 rounded-xl text-slate-900 shadow-md group-hover:scale-105 transition-transform">
                    <Store className="w-6 h-6 stroke-[2.5]" />
                  </div>
                )}

                {/* Quick Edit Badge on Logo */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenProfile) onOpenProfile();
                  }}
                  className="absolute -bottom-1 -right-1 bg-slate-800 text-emerald-400 p-1 rounded-full border border-slate-700 hover:bg-slate-700 hover:text-white transition shadow"
                  title="Ubah Profil & Logo Warung"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>

              <div>
                <h1 className="font-extrabold text-base sm:text-lg tracking-wide leading-tight text-white flex items-center space-x-1">
                  <span>{shopProfile.name || 'Warung Pribadi'}</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-medium truncate max-w-[180px]">
                  {shopProfile.subtitle || 'Kasir, Stok, Kasbon & Backup'}
                </p>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1.5">
              <button
                onClick={() => setActiveTab('kasir')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  activeTab === 'kasir'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-[1.02]'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Kasir</span>
              </button>

              <button
                onClick={() => setActiveTab('barang')}
                className={`relative flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  activeTab === 'barang'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-[1.02]'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Barang</span>
                {lowStockCount > 0 && (
                  <span className="flex items-center justify-center bg-rose-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">
                    {lowStockCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('kulakan')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  activeTab === 'kulakan'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-[1.02]'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Kulakan</span>
              </button>

              <button
                onClick={() => setActiveTab('kasbon')}
                className={`relative flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  activeTab === 'kasbon'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-[1.02]'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Kasbon</span>
                {unpaidDebtCount > 0 && (
                  <span className="flex items-center justify-center bg-amber-500 text-slate-950 text-[11px] font-black px-1.5 py-0.5 rounded-full shadow-sm">
                    {unpaidDebtCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('laporan')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  activeTab === 'laporan'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-[1.02]'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Laporan</span>
              </button>

              <button
                onClick={() => setActiveTab('backup')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  activeTab === 'backup'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-[1.02]'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <HardDrive className="w-4 h-4" />
                <span>Backup</span>
              </button>

              {/* Edit Shop Profile Button */}
              <button
                onClick={onOpenProfile}
                className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition"
                title="Pengaturan Profil & Logo Warung"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </nav>

            {/* Mobile Top Header Action Buttons */}
            <div className="md:hidden flex items-center space-x-1.5">
              <button
                onClick={onOpenProfile}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:text-white text-xs font-bold flex items-center space-x-1"
                title="Profil Warung"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="text-[10px]">Profil</span>
              </button>

              <button
                onClick={() => setActiveTab('backup')}
                className={`p-2 rounded-xl text-xs font-bold flex items-center space-x-1 border transition ${
                  activeTab === 'backup'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
                title="Backup & Restore Data"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span className="text-[10px]">Backup</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-30 px-1 py-1.5 shadow-2xl">
        <div className="grid grid-cols-5 gap-0.5">
          <button
            onClick={() => setActiveTab('kasir')}
            className={`flex flex-col items-center justify-center py-2 rounded-xl text-[10px] font-semibold transition-all ${
              activeTab === 'kasir'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingCart className="w-4 h-4 mb-0.5" />
            <span>Kasir</span>
          </button>

          <button
            onClick={() => setActiveTab('barang')}
            className={`relative flex flex-col items-center justify-center py-2 rounded-xl text-[10px] font-semibold transition-all ${
              activeTab === 'barang'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4 mb-0.5" />
            <span>Barang</span>
            {lowStockCount > 0 && (
              <span className="absolute top-0.5 right-1 bg-rose-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {lowStockCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('kulakan')}
            className={`flex flex-col items-center justify-center py-2 rounded-xl text-[10px] font-semibold transition-all ${
              activeTab === 'kulakan'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Truck className="w-4 h-4 mb-0.5" />
            <span>Kulakan</span>
          </button>

          <button
            onClick={() => setActiveTab('kasbon')}
            className={`relative flex flex-col items-center justify-center py-2 rounded-xl text-[10px] font-semibold transition-all ${
              activeTab === 'kasbon'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4 mb-0.5" />
            <span>Kasbon</span>
            {unpaidDebtCount > 0 && (
              <span className="absolute top-0.5 right-1 bg-amber-500 text-slate-950 text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {unpaidDebtCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('laporan')}
            className={`flex flex-col items-center justify-center py-2 rounded-xl text-[10px] font-semibold transition-all ${
              activeTab === 'laporan'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4 mb-0.5" />
            <span>Laporan</span>
          </button>
        </div>
      </div>
    </>
  );
}
