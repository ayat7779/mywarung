import { db } from '../db/database';
import { sanitizeText } from '../utils/security';

export const logService = {
  /**
   * Catat Log Aktivitas Aplikasi (Blackbox Audit Log)
   * @param {Object} param0
   * @param {string} param0.type - 'TRANSACTION' | 'DEBT_PAYMENT' | 'PURCHASE' | 'STOCK_ADJUSTMENT' | 'EXPENSE' | 'PRODUCT_MUTATION' | 'SECURITY' | 'ERROR'
   * @param {string} param0.level - 'INFO' | 'WARNING' | 'SECURITY' | 'ERROR'
   * @param {string} param0.action - Judul aksi / aktivitas
   * @param {string|Object} param0.details - Detail rincian pesan
   * @param {string} [param0.actor='SYSTEM'] - 'KASIR' | 'PEMILIK' | 'SYSTEM'
   */
  async addLog({ type, level = 'INFO', action, details, actor = 'SYSTEM' }) {
    try {
      const now = new Date().toISOString();
      const detailsStr = typeof details === 'object' ? JSON.stringify(details) : String(details || '');

      await db.activity_logs.add({
        timestamp: now,
        type,
        level,
        action: sanitizeText(action),
        details: sanitizeText(detailsStr),
        actor
      });
    } catch (err) {
      console.error('Gagal mencatat log aktivitas:', err);
    }
  },

  async getRecentLogs(limit = 100, typeFilter = 'ALL') {
    let logs = await db.activity_logs.orderBy('timestamp').reverse().limit(limit).toArray();
    if (typeFilter && typeFilter !== 'ALL') {
      logs = logs.filter((l) => l.type === typeFilter);
    }
    return logs;
  },

  async clearLogs() {
    return await db.activity_logs.clear();
  }
};
