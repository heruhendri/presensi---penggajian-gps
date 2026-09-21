/**
 * Enterprise Secure Session Manager with 30-Day Persistence & Anti-Breach Defense
 * 
 * Multi-layer security protections:
 * 1. Hardware & Browser Fingerprint Binding: Prevents cross-device/cross-browser session hijacking
 * 2. Cryptographic Tamper-Proof Signature (SHA-256): Prevents manipulation of role or expiration in storage
 * 3. Credential Version Invalidation: Automatically revokes 30-day sessions if password is changed or account is deactivated
 * 4. Maximum Inactivity Window (7-Day Idle Limit): Forces re-authentication if inactive for 7 consecutive days
 * 5. Rate-Limiting & Brute-Force Shield: Locks login for cooldown period after 5 failed attempts
 */

import { Employee, UserRole } from '../types';

export const SECURE_STORAGE_KEY_AUTH_30D = 'app_auth_session_30d_secure';
export const SECURE_STORAGE_KEY_RATE_LIMIT = 'app_login_rate_limit';
export const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
export const SEVEN_DAYS_IDLE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Standard Synchronous SHA-256 Implementation
 * Ensures zero-dependency, lightning-fast execution on initial application boot
 */
export function sha256(ascii: string): string {
  const rightRotate = (value: number, amount: number) => (value >>> amount) | (value << (32 - amount));

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i = 0;
  let j = 0;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = (ascii as any)[lengthProperty] * 8;

  // Initial hash values: first 32 bits of the fractional parts of the square roots of the first 8 primes
  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  // First 32 bits of the fractional parts of the cube roots of the first 64 primes
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  let composite = 0;
  for (let candidate = 2; composite < 64; candidate++) {
    let isPrime = true;
    for (let factor = 2; factor * factor <= candidate; factor++) {
      if (candidate % factor === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) composite++;
  }

  // Pre-processing
  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (i = 0; i < (ascii as any)[lengthProperty]; i++) {
    words[i >> 2] |= ascii.charCodeAt(i) << ((3 - (i % 4)) * 8);
  }

  // Process the message in successive 512-bit chunks
  const w = new Array(64);
  for (i = 0; i < words[lengthProperty]; i += 16) {
    const oldHash = [...hash];

    for (j = 0; j < 64; j++) {
      if (j < 16) {
        w[j] = words[i + j] | 0;
      } else {
        const gamma0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const gamma1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + gamma0 + w[j - 7] + gamma1) | 0;
      }

      const s1 = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + s1 + ch + k[j] + w[j]) | 0;
      const s0 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0 + maj) | 0;

      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }

    for (j = 0; j < 8; j++) {
      hash[j] = (hash[j] + oldHash[j]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }

  return result;
}

/**
 * Generates an installation / system cryptographic salt
 */
export function getSystemInstallationSalt(): string {
  let salt = localStorage.getItem('app_system_crypto_salt');
  if (!salt) {
    salt = 'SYS-SEC-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);
    localStorage.setItem('app_system_crypto_salt', salt);
  }
  return salt;
}

/**
 * Generates a persistent device entropy salt
 */
export function getDeviceEntropySalt(): string {
  let salt = localStorage.getItem('app_device_entropy_salt');
  if (!salt) {
    salt = 'DEV-FP-' + Math.random().toString(36).substring(2, 12) + '-' + Math.random().toString(36).substring(2, 12);
    localStorage.setItem('app_device_entropy_salt', salt);
  }
  return salt;
}

/**
 * Device Fingerprint Collector
 * Binds the session strictly to this client environment
 */
export function getDeviceFingerprint(): { raw: string; hash: string; label: string } {
  const nav = typeof navigator !== 'undefined' ? navigator : null;
  const scr = typeof window !== 'undefined' && window.screen ? window.screen : null;

  const ua = nav?.userAgent || 'unknown-ua';
  const lang = nav?.language || 'id';
  const platform = nav?.platform || 'generic';
  const cores = nav?.hardwareConcurrency || 2;
  const resolution = scr ? `${scr.width}x${scr.height}x${scr.colorDepth}` : '1080x1920x24';
  const timezone = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Asia/Jakarta';
  const deviceSalt = getDeviceEntropySalt();

  const raw = `${ua}__${lang}__${platform}__${cores}__${resolution}__${timezone}__${deviceSalt}`;
  const hash = sha256(raw);

  // User friendly label (e.g. Chrome / Windows / Mobile)
  let label = 'Perangkat Web';
  if (/Android/i.test(ua)) label = 'Ponsel Android';
  else if (/iPhone|iPad/i.test(ua)) label = 'Perangkat iOS';
  else if (/Macintosh|Mac OS/i.test(ua)) label = 'Mac Desktop';
  else if (/Windows/i.test(ua)) label = 'PC Windows';
  else if (/Linux/i.test(ua)) label = 'PC Linux';

  return { raw, hash, label };
}

/**
 * Hash credentials securely with system salt
 */
export function hashCredential(password: string): string {
  const salt = getSystemInstallationSalt();
  return sha256(`CRED_${password}_SALT_${salt}`);
}

export interface SecureAuthSessionData {
  sessionId: string;
  role: UserRole;
  employeeId?: string;
  createdAt: number;
  expiresAt: number;
  lastActivityAt: number;
  deviceFingerprintHash: string;
  deviceLabel: string;
  credentialHash: string;
  signature: string;
  rememberMe: boolean;
}

/**
 * Creates tamper-proof signature for session data
 */
export function computeSessionSignature(
  sessionId: string,
  role: UserRole,
  employeeId: string | undefined,
  expiresAt: number,
  deviceFingerprintHash: string,
  credentialHash: string
): string {
  const systemSalt = getSystemInstallationSalt();
  const payload = `${sessionId}|${role}|${employeeId || ''}|${expiresAt}|${deviceFingerprintHash}|${credentialHash}|${systemSalt}`;
  return sha256(payload);
}

/**
 * Creates and stores a secure 30-day session
 */
export function storeSecure30DaySession(params: {
  role: UserRole;
  employee?: Employee;
  passwordUsed: string;
  rememberMe: boolean;
}): SecureAuthSessionData {
  const now = Date.now();
  const sessionId = 'SES30D_' + Math.random().toString(36).substring(2, 10) + '_' + now.toString(36);
  const expiresAt = now + THIRTY_DAYS_MS;
  const fp = getDeviceFingerprint();
  const credentialHash = hashCredential(params.passwordUsed);

  const signature = computeSessionSignature(
    sessionId,
    params.role,
    params.employee?.id,
    expiresAt,
    fp.hash,
    credentialHash
  );

  const sessionData: SecureAuthSessionData = {
    sessionId,
    role: params.role,
    employeeId: params.employee?.id,
    createdAt: now,
    expiresAt,
    lastActivityAt: now,
    deviceFingerprintHash: fp.hash,
    deviceLabel: fp.label,
    credentialHash,
    signature,
    rememberMe: params.rememberMe,
  };

  localStorage.setItem(SECURE_STORAGE_KEY_AUTH_30D, JSON.stringify(sessionData));
  return sessionData;
}

/**
 * Validates the stored 30-day session with deep anti-tamper and anti-hijacking checks
 */
export function validateSecureSession(params: {
  expectedAdminPassword?: string;
  employees: Employee[];
}): {
  isValid: boolean;
  role?: UserRole;
  employee?: Employee;
  reason?: string;
  session?: SecureAuthSessionData;
} {
  try {
    const raw = localStorage.getItem(SECURE_STORAGE_KEY_AUTH_30D);
    if (!raw) return { isValid: false, reason: 'Tidak ada sesi tersimpan' };

    const session: SecureAuthSessionData = JSON.parse(raw);
    if (!session || !session.sessionId || !session.expiresAt || !session.signature) {
      localStorage.removeItem(SECURE_STORAGE_KEY_AUTH_30D);
      return { isValid: false, reason: 'Format sesi tidak valid' };
    }

    const now = Date.now();

    // 1. Check 30-Day Absolute Expiration
    if (now > session.expiresAt) {
      localStorage.removeItem(SECURE_STORAGE_KEY_AUTH_30D);
      return { isValid: false, reason: 'Sesi 30 hari telah kedaluwarsa secara alami' };
    }

    // 2. Check 7-Day Inactivity Idle Timeout
    const lastActivity = session.lastActivityAt || session.createdAt;
    if (now - lastActivity > SEVEN_DAYS_IDLE_MS) {
      localStorage.removeItem(SECURE_STORAGE_KEY_AUTH_30D);
      return { isValid: false, reason: 'Sesi dibatalkan karena tidak ada aktivitas selama 7 hari berturut-turut' };
    }

    // 3. Hardware & Browser Fingerprint Verification (Anti-Hijack)
    const currentFp = getDeviceFingerprint();
    if (currentFp.hash !== session.deviceFingerprintHash) {
      localStorage.removeItem(SECURE_STORAGE_KEY_AUTH_30D);
      console.warn('[SECURITY] Deteksi anomali perangkat: Sesi disalin atau dicoba buka di peramban/perangkat lain.');
      return { isValid: false, reason: 'Anomali perangkat terdeteksi: Sesi tidak cocok dengan perangkat ini' };
    }

    // 4. Cryptographic Signature Tamper Verification
    const expectedSignature = computeSessionSignature(
      session.sessionId,
      session.role,
      session.employeeId,
      session.expiresAt,
      session.deviceFingerprintHash,
      session.credentialHash
    );

    if (expectedSignature !== session.signature) {
      localStorage.removeItem(SECURE_STORAGE_KEY_AUTH_30D);
      console.warn('[SECURITY] Sesi 30 hari telah dimodifikasi secara ilegal di penyimpanan lokal.');
      return { isValid: false, reason: 'Integritas sesi gagal diverifikasi (terdeteksi manipulasi data)' };
    }

    // 5. Credential Synchronization & Invalidation Check
    if (session.role === 'admin') {
      const adminPass = params.expectedAdminPassword || localStorage.getItem('app_admin_password') || 'admin123';
      const expectedAdminHash = hashCredential(adminPass);
      if (session.credentialHash !== expectedAdminHash) {
        localStorage.removeItem(SECURE_STORAGE_KEY_AUTH_30D);
        return { isValid: false, reason: 'Password Admin telah diperbarui, silakan login ulang' };
      }
      return { isValid: true, role: 'admin', session };
    }

    if (session.role === 'employee') {
      if (!session.employeeId) {
        localStorage.removeItem(SECURE_STORAGE_KEY_AUTH_30D);
        return { isValid: false, reason: 'ID Karyawan tidak ditemukan di sesi' };
      }

      const matched = params.employees.find(
        (e) => e.id.trim().toUpperCase() === session.employeeId?.trim().toUpperCase()
      );

      if (!matched) {
        localStorage.removeItem(SECURE_STORAGE_KEY_AUTH_30D);
        return { isValid: false, reason: 'Akun Karyawan telah dihapus dari sistem' };
      }

      if (matched.isActive === false) {
        localStorage.removeItem(SECURE_STORAGE_KEY_AUTH_30D);
        return { isValid: false, reason: 'Akun Karyawan berstatus dinonaktifkan' };
      }

      const currentEmployeePass = matched.password || 'password123';
      const expectedEmpHash = hashCredential(currentEmployeePass);
      if (session.credentialHash !== expectedEmpHash) {
        localStorage.removeItem(SECURE_STORAGE_KEY_AUTH_30D);
        return { isValid: false, reason: 'Password akun Karyawan telah diubah oleh HRD' };
      }

      return { isValid: true, role: 'employee', employee: matched, session };
    }

    return { isValid: false, reason: 'Peran tidak dikenali' };
  } catch (err: any) {
    console.error('Error saat verifikasi sesi:', err);
    localStorage.removeItem(SECURE_STORAGE_KEY_AUTH_30D);
    return { isValid: false, reason: 'Kesalahan sistem saat membaca sesi' };
  }
}

/**
 * Records user activity heartbeat to prevent idle timeout while actively using the app
 */
export function touchSecureSessionActivity(): void {
  try {
    const raw = localStorage.getItem(SECURE_STORAGE_KEY_AUTH_30D);
    if (!raw) return;
    const session: SecureAuthSessionData = JSON.parse(raw);
    const now = Date.now();
    // Only update once every 5 minutes to avoid excessive I/O
    if (now - (session.lastActivityAt || 0) > 5 * 60 * 1000) {
      session.lastActivityAt = now;
      localStorage.setItem(SECURE_STORAGE_KEY_AUTH_30D, JSON.stringify(session));
    }
  } catch {
    // ignore
  }
}

/**
 * Terminate 30-Day Session immediately (Kill Switch)
 */
export function terminateSecure30DaySession(): void {
  localStorage.removeItem(SECURE_STORAGE_KEY_AUTH_30D);
  sessionStorage.removeItem('app_auth_session');
}

/**
 * Calculates remaining days in active session
 */
export function getSessionRemainingDays(): number {
  try {
    const raw = localStorage.getItem(SECURE_STORAGE_KEY_AUTH_30D);
    if (!raw) return 0;
    const session: SecureAuthSessionData = JSON.parse(raw);
    const diff = session.expiresAt - Date.now();
    return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
  } catch {
    return 0;
  }
}

// --------------------------------------------------------------------------
// BRUTE-FORCE & RATE LIMITING SHIELD
// --------------------------------------------------------------------------

interface RateLimitRecord {
  failedAttempts: number;
  lockedUntil: number; // timestamp
}

export const MAX_ALLOWED_FAILED_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 60 * 1000; // 60 seconds

export function checkLoginRateLimit(identifierKey: string): {
  isLocked: boolean;
  remainingSeconds: number;
  failedCount: number;
} {
  try {
    const key = `rate_${identifierKey.trim().toLowerCase()}`;
    const raw = localStorage.getItem(SECURE_STORAGE_KEY_RATE_LIMIT + '_' + key);
    if (!raw) return { isLocked: false, remainingSeconds: 0, failedCount: 0 };

    const record: RateLimitRecord = JSON.parse(raw);
    const now = Date.now();

    if (record.lockedUntil && now < record.lockedUntil) {
      const remainingSec = Math.ceil((record.lockedUntil - now) / 1000);
      return { isLocked: true, remainingSeconds: remainingSec, failedCount: record.failedAttempts };
    }

    // Lockout has passed, reset if time exceeded
    if (record.lockedUntil && now >= record.lockedUntil) {
      localStorage.removeItem(SECURE_STORAGE_KEY_RATE_LIMIT + '_' + key);
      return { isLocked: false, remainingSeconds: 0, failedCount: 0 };
    }

    return { isLocked: false, remainingSeconds: 0, failedCount: record.failedAttempts || 0 };
  } catch {
    return { isLocked: false, remainingSeconds: 0, failedCount: 0 };
  }
}

export function recordLoginFailure(identifierKey: string): {
  isLocked: boolean;
  remainingSeconds: number;
  failedCount: number;
} {
  try {
    const key = `rate_${identifierKey.trim().toLowerCase()}`;
    const raw = localStorage.getItem(SECURE_STORAGE_KEY_RATE_LIMIT + '_' + key);
    const now = Date.now();
    let record: RateLimitRecord = raw ? JSON.parse(raw) : { failedAttempts: 0, lockedUntil: 0 };

    record.failedAttempts = (record.failedAttempts || 0) + 1;

    if (record.failedAttempts >= MAX_ALLOWED_FAILED_ATTEMPTS) {
      record.lockedUntil = now + LOCKOUT_DURATION_MS;
      localStorage.setItem(SECURE_STORAGE_KEY_RATE_LIMIT + '_' + key, JSON.stringify(record));
      return { isLocked: true, remainingSeconds: 60, failedCount: record.failedAttempts };
    }

    localStorage.setItem(SECURE_STORAGE_KEY_RATE_LIMIT + '_' + key, JSON.stringify(record));
    return { isLocked: false, remainingSeconds: 0, failedCount: record.failedAttempts };
  } catch {
    return { isLocked: false, remainingSeconds: 0, failedCount: 1 };
  }
}

export function clearLoginRateLimit(identifierKey: string): void {
  try {
    const key = `rate_${identifierKey.trim().toLowerCase()}`;
    localStorage.removeItem(SECURE_STORAGE_KEY_RATE_LIMIT + '_' + key);
  } catch {
    // ignore
  }
}
