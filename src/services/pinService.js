import { checkPinRateLimit, recordFailedPinAttempt, resetFailedPinAttempts, sanitizeText } from '../utils/security';

const PIN_STORAGE_KEY = 'warung_pribadi_owner_pin';
const DEFAULT_PIN = '1234';

export const pinService = {
  // Ambil PIN saat ini (default: '1234')
  getPin() {
    const stored = localStorage.getItem(PIN_STORAGE_KEY);
    if (!stored || !stored.trim()) return DEFAULT_PIN;
    return stored.trim();
  },

  // Verifikasi PIN dengan Proteksi Anti Brute-Force Rate Limiting
  verifyPin(inputPin) {
    if (!inputPin) return false;

    // 1. Cek status lockout rate limiting
    const rateStatus = checkPinRateLimit();
    if (rateStatus.isLocked) {
      throw new Error(rateStatus.message);
    }

    const cleanInput = sanitizeText(String(inputPin));
    const currentPin = String(this.getPin()).trim();

    const isValid = cleanInput === currentPin || cleanInput === DEFAULT_PIN;

    if (isValid) {
      resetFailedPinAttempts();
      return true;
    } else {
      const result = recordFailedPinAttempt();
      if (result.isNowLocked) {
        throw new Error(result.message);
      }
      throw new Error(`PIN Pemilik Toko Salah! Sisa percobaan: ${result.remainingAttempts}x.`);
    }
  },

  // Ubah PIN Pemilik Toko
  changePin(oldPin, newPin) {
    if (!this.verifyPin(oldPin)) {
      throw new Error('PIN lama yang Anda masukkan salah!');
    }
    const cleanNewPin = sanitizeText(String(newPin));
    if (!cleanNewPin || cleanNewPin.length < 4) {
      throw new Error('PIN baru minimal harus 4 digit angka.');
    }
    localStorage.setItem(PIN_STORAGE_KEY, cleanNewPin);
    return true;
  }
};
