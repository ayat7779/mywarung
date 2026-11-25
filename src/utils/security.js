/**
  Modul Keamanan & Sanitasi Data (Anti-XSS, Validasi URL, & Rate Limiting)
 */

// Sanitasi Teks (Mencegah Injeksi Tag Script / HTML XSS)
export function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

// Validasi & Sanitasi URL Gambar (Memblokir skema berbahaya seperti javascript:, data:text/html)
export function sanitizeImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const cleanUrl = url.trim();
  if (cleanUrl === '') return '';

  // Hanya izinkan skema http:// dan https://
  const isHttp = /^https?:\/\//i.test(cleanUrl);
  if (!isHttp) {
    return ''; // Blokir URL berpotensi berbahaya
  }

  return cleanUrl;
}

// Rate Limiting Percobaan PIN (Mencegah Brute-Force Automated Attack)
const LOCKOUT_KEY = 'warung_pin_lockout_time';
const FAILED_ATTEMPTS_KEY = 'warung_pin_failed_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 1000; // 30 detik

export function checkPinRateLimit() {
  const lockoutTime = Number(localStorage.getItem(LOCKOUT_KEY) || 0);
  const now = Date.now();

  if (lockoutTime && now < lockoutTime) {
    const remainingSeconds = Math.ceil((lockoutTime - now) / 1000);
    return {
      isLocked: true,
      remainingSeconds,
      message: `Terlalu banyak percobaan PIN salah! Sistem terkunci demi keamanan. Coba lagi dalam ${remainingSeconds} detik.`
    };
  }

  if (lockoutTime && now >= lockoutTime) {
    // Reset lockout
    localStorage.removeItem(LOCKOUT_KEY);
    localStorage.setItem(FAILED_ATTEMPTS_KEY, '0');
  }

  return { isLocked: false, remainingSeconds: 0 };
}

export function recordFailedPinAttempt() {
  const currentAttempts = Number(localStorage.getItem(FAILED_ATTEMPTS_KEY) || 0) + 1;
  localStorage.setItem(FAILED_ATTEMPTS_KEY, String(currentAttempts));

  if (currentAttempts >= MAX_ATTEMPTS) {
    const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
    localStorage.setItem(LOCKOUT_KEY, String(lockoutUntil));
    return {
      isNowLocked: true,
      remainingSeconds: 30,
      message: '5x Percobaan PIN salah berturut-turut! Sistem terkunci otomatis selama 30 detik demi keamanan.'
    };
  }

  return {
    isNowLocked: false,
    remainingAttempts: MAX_ATTEMPTS - currentAttempts
  };
}

export function resetFailedPinAttempts() {
  localStorage.setItem(FAILED_ATTEMPTS_KEY, '0');
  localStorage.removeItem(LOCKOUT_KEY);
}
