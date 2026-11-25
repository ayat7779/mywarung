import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedInitialData } from './db/database';
import Navbar from './components/Navbar';
import KasirPage from './pages/KasirPage';
import BarangPage from './pages/BarangPage';
import KulakanPage from './pages/KulakanPage';
import KasbonPage from './pages/KasbonPage';
import LaporanPage from './pages/LaporanPage';
import BackupPage from './pages/BackupPage';
import PinModal from './components/PinModal';
import ProfileModal from './components/ProfileModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('kasir');
  const [isSeeded, setIsSeeded] = useState(false);

  // Security PIN State for Backup page
  const [isBackupUnlocked, setIsBackupUnlocked] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // Shop Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileKey, setProfileKey] = useState(0); // Trigger re-render for profile updates

  // Live count for low stock warning badge
  const lowStockCount = useLiveQuery(async () => {
    const all = await db.products.toArray();
    return all.filter((p) => p.stock <= p.min_stock).length;
  }, []) || 0;

  // Live count for unpaid debts badge
  const unpaidDebtCount = useLiveQuery(async () => {
    return await db.sales.filter((s) => s.payment_type === 'debt' && !s.is_paid).count();
  }, []) || 0;

  useEffect(() => {
    seedInitialData().finally(() => {
      setIsSeeded(true);
    });
  }, []);

  // Secure tab navigation with immediate lock on exit
  const handleTabChange = (targetTab) => {
    if (targetTab === 'backup') {
      if (!isBackupUnlocked) {
        setIsPinModalOpen(true);
        return;
      }
    } else {
      // Kunci kembali halaman backup setiap kali pengguna berpindah ke menu lain
      setIsBackupUnlocked(false);
    }
    setActiveTab(targetTab);
  };

  const handlePinSuccess = () => {
    setIsBackupUnlocked(true);
    setActiveTab('backup');
  };

  if (!isSeeded) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold text-sm tracking-wide">Menyiapkan Database Warung...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Navigation Bar */}
      <Navbar
        key={profileKey}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        lowStockCount={lowStockCount}
        unpaidDebtCount={unpaidDebtCount}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* Main Page View */}
      <main className="flex-1">
        {activeTab === 'kasir' && <KasirPage />}
        {activeTab === 'barang' && <BarangPage />}
        {activeTab === 'kulakan' && <KulakanPage />}
        {activeTab === 'kasbon' && <KasbonPage />}
        {activeTab === 'laporan' && <LaporanPage />}
        {activeTab === 'backup' && <BackupPage />}
      </main>

      {/* PIN Verification Modal for Backup Access */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSuccess}
      />

      {/* Shop Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSaveSuccess={() => setProfileKey((prev) => prev + 1)}
      />
    </div>
  );
}
