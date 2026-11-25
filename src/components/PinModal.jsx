import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, KeyRound, AlertCircle, Delete } from 'lucide-react';
import { pinService } from '../services/pinService';

export default function PinModal({ isOpen, onClose, onSuccess }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const processVerify = (pinToTest) => {
    try {
      if (pinService.verifyPin(pinToTest)) {
        setError('');
        onSuccess();
        onClose();
      }
    } catch (err) {
      setError(err.message || 'PIN Pemilik Toko Salah! Silakan coba lagi.');
      setPin('');
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value.replace(/\D/g, ''); // numbers only
    if (val.length <= 6) {
      setPin(val);
      setError('');

      if (val.length === 4) {
        processVerify(val);
      }
    }
  };

  const handleKeyPress = (num) => {
    setError('');
    setPin((prevPin) => {
      if (prevPin.length >= 6) return prevPin;
      const nextPin = prevPin + num;
      if (nextPin.length === 4) {
        setTimeout(() => processVerify(nextPin), 50);
      }
      return nextPin;
    });
  };

  const handleDeleteKey = () => {
    setError('');
    setPin((prev) => prev.slice(0, -1));
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!pin) return;
    processVerify(pin);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Akses Keamanan Backup</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <p className="text-xs text-slate-500 font-medium">
            Masukkan PIN Pemilik Toko untuk mengakses menu Backup & Restore.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <div className="relative">
            <input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={handleInputChange}
              placeholder="••••"
              className="w-full text-center text-2xl font-black tracking-[0.5em] py-2 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
              autoFocus
            />
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex items-center justify-center space-x-2 bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl text-xs font-bold animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Default PIN Hint */}
          <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl text-[11px] text-slate-500 font-medium flex items-center justify-center space-x-1.5">
            <KeyRound className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>PIN Bawaan Awal: <strong className="text-slate-800 font-bold">1234</strong></span>
          </div>

          {/* Onscreen Keypad for Mobile & Touchscreens */}
          <div className="grid grid-cols-3 gap-2 pt-1 max-w-[260px] mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(String(num))}
                className="py-2.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-800 font-black text-lg rounded-2xl transition active:scale-95 shadow-sm"
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setPin('')}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-xs rounded-2xl transition active:scale-95"
            >
              Hapus
            </button>

            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="py-2.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-800 font-black text-lg rounded-2xl transition active:scale-95 shadow-sm"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleDeleteKey}
              className="py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold rounded-2xl transition flex items-center justify-center active:scale-95"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={pin.length < 4}
            className={`w-full py-3 rounded-2xl font-extrabold text-xs transition shadow-md mt-2 ${
              pin.length >= 4
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            Buka Menu Backup
          </button>
        </form>
      </div>
    </div>
  );
}
