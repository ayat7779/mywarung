import React, { useState, useEffect } from 'react';
import { X, Store, Save, Image as ImageIcon, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';
import { profileService } from '../services/profileService';

const LOGO_PRESETS = [
  { name: 'Default Store', url: '' },
  { name: 'Warung Kelontong', url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=150&auto=format&fit=crop&q=80' },
  { name: 'Toko Sembako', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&auto=format&fit=crop&q=80' },
  { name: 'Kedai / Minimarket', url: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=150&auto=format&fit=crop&q=80' }
];

export default function ProfileModal({ isOpen, onClose, onSaveSuccess }) {
  const [formData, setFormData] = useState({
    name: 'Warung Pribadi',
    subtitle: 'Kasir, Stok, Kasbon & Laporan',
    address: 'Jl. Sederhana No. 1, Indonesia',
    logo_url: ''
  });

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      const current = profileService.getProfile();
      setFormData(current);
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Nama warung tidak boleh kosong.');
      return;
    }

    try {
      const updated = profileService.updateProfile(formData);
      setSuccessMsg('Profil warung berhasil diperbarui!');
      if (onSaveSuccess) onSaveSuccess(updated);

      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || 'Gagal menyimpan profil warung.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-100 text-slate-800 my-8">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Store className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Pengaturan Profil Warung</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-center space-x-2 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Live Header Logo Preview */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center space-x-3 shadow-md">
          {formData.logo_url ? (
            <img
              src={formData.logo_url}
              alt="Logo Warung"
              onError={(e) => { e.target.style.display = 'none'; }}
              className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-500 shrink-0"
            />
          ) : (
            <div className="bg-emerald-500 p-2.5 rounded-xl text-slate-900 shrink-0">
              <Store className="w-6 h-6 stroke-[2.5]" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h4 className="font-black text-base leading-tight truncate text-white">
              {formData.name || 'Nama Warung'}
            </h4>
            <p className="text-[11px] text-emerald-400 font-medium truncate">
              {formData.subtitle || 'Slogan Warung'}
            </p>
            <p className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center space-x-1">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0 inline" />
              <span>{formData.address || 'Alamat Warung'}</span>
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Nama Warung */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nama Warung <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Warung Berkah Pak Budi"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Slogan / Subtitle */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Slogan / Subtitle Warung
            </label>
            <input
              type="text"
              placeholder="Contoh: Toko Kelontong & Sembako Murah"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Alamat Warung (u/ Struk Belanja) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Alamat Warung (Dicetak di Struk)
            </label>
            <input
              type="text"
              placeholder="Contoh: Jl. Mawar No. 12, RT 03/05"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* URL Logo Warung */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
              <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>URL Foto/Logo Warung (Opsional)</span>
            </label>

            {/* Quick Logo Presets */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {LOGO_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setFormData({ ...formData, logo_url: preset.url })}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                    formData.logo_url === preset.url
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>

            <input
              type="url"
              placeholder="https://domain.com/logo-warung.jpg"
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-slate-300 rounded-xl font-bold text-slate-700 text-xs hover:bg-slate-100 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center justify-center space-x-1.5 transition"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Profil</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
