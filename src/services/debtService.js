import { db } from '../db/database';
import { logService } from './logService';

export const debtService = {
  // Ambil semua transaksi Kasbon yang BELUM LUNAS
  async getUnpaidDebts() {
    const sales = await db.sales
      .filter((s) => s.payment_type === 'debt' && !s.is_paid)
      .reverse()
      .toArray();

    const saleIds = sales.map((s) => s.id);
    const saleItems = await db.sale_items.filter((item) => saleIds.includes(item.sale_id)).toArray();
    const products = await db.products.toArray();

    const productMap = {};
    products.forEach((p) => {
      productMap[p.id] = p;
    });

    return sales.map((sale) => {
      const items = saleItems
        .filter((item) => item.sale_id === sale.id)
        .map((item) => ({
          ...item,
          product_name: productMap[item.product_id]?.name || 'Barang Dihapus'
        }));

      return {
        ...sale,
        items
      };
    });
  },

  // Ambil riwayat Kasbon yang SUDAH LUNAS
  async getPaidDebts(limit = 50) {
    const sales = await db.sales
      .filter((s) => s.payment_type === 'debt' && s.is_paid)
      .reverse()
      .toArray();

    const limitedSales = sales.slice(0, limit);
    const saleIds = limitedSales.map((s) => s.id);
    const saleItems = await db.sale_items.filter((item) => saleIds.includes(item.sale_id)).toArray();
    const products = await db.products.toArray();

    const productMap = {};
    products.forEach((p) => {
      productMap[p.id] = p;
    });

    return limitedSales.map((sale) => {
      const items = saleItems
        .filter((item) => item.sale_id === sale.id)
        .map((item) => ({
          ...item,
          product_name: productMap[item.product_id]?.name || 'Barang Dihapus'
        }));

      return {
        ...sale,
        items
      };
    });
  },

  // Pelunasan Kasbon Sekali Ketuk
  async payDebt(saleId) {
    const sale = await db.sales.get(saleId);
    if (!sale) {
      await logService.addLog({
        type: 'ERROR',
        level: 'WARNING',
        action: 'Gagal Pelunasan Kasbon',
        details: `Transaksi nota #${saleId} tidak ditemukan.`,
        actor: 'KASIR'
      });
      throw new Error('Data transaksi kasbon tidak ditemukan.');
    }

    const now = new Date().toISOString();
    const updated = await db.sales.update(saleId, {
      is_paid: true,
      paid_at: now
    });

    // Log Blackbox Audit
    await logService.addLog({
      type: 'DEBT_PAYMENT',
      level: 'INFO',
      action: `Pelunasan Kasbon Nota #${saleId}`,
      details: `Pelanggan: ${sale.customer_name || '-'} | Nominal Pelunasan: Rp ${(sale.total_amount || 0).toLocaleString('id-ID')}`,
      actor: 'KASIR'
    });

    return updated;
  }
};
