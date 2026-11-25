import { db } from '../db/database';
import { sanitizeText } from '../utils/security';
import { logService } from './logService';

export const inventoryService = {
  // Catat Kulakan / Stok Masuk
  async recordStockPurchase({ productId, qty, unitCost }) {
    const productNumId = Number(productId);
    const qtyNum = Number(qty);
    const unitCostNum = Number(unitCost);

    if (!productNumId || isNaN(productNumId)) {
      throw new Error('Silakan pilih barang terlebih dahulu.');
    }
    if (!qtyNum || qtyNum <= 0) {
      throw new Error('Jumlah unit masuk harus lebih dari 0.');
    }
    if (isNaN(unitCostNum) || unitCostNum < 0) {
      throw new Error('Harga modal per unit harus berupa angka 0 atau lebih.');
    }

    try {
      const result = await db.transaction('rw', db.products, db.stock_purchases, db.activity_logs, async () => {
        const product = await db.products.get(productNumId);
        if (!product) {
          throw new Error('Barang tidak ditemukan di database.');
        }

        const now = new Date().toISOString();
        const totalCost = qtyNum * unitCostNum;

        // 1. Catat riwayat kulakan di stock_purchases
        const purchaseId = await db.stock_purchases.add({
          date: now,
          product_id: productNumId,
          qty: qtyNum,
          unit_cost: unitCostNum,
          total_cost: totalCost
        });

        // 2. Tambah stok barang dan perbarui harga modal ke harga kulakan terbaru
        await db.products.update(productNumId, {
          stock: product.stock + qtyNum,
          cost_price: unitCostNum
        });

        // Log Blackbox Audit
        await logService.addLog({
          type: 'PURCHASE',
          level: 'INFO',
          action: `Kulakan Stok: ${product.name}`,
          details: `Masuk: +${qtyNum} unit | Modal/unit: Rp ${unitCostNum.toLocaleString('id-ID')} | Total: Rp ${totalCost.toLocaleString('id-ID')} | Stok Baru: ${product.stock + qtyNum}`,
          actor: 'KASIR'
        });

        return purchaseId;
      });

      return result;
    } catch (err) {
      await logService.addLog({
        type: 'ERROR',
        level: 'ERROR',
        action: 'Gagal Catat Kulakan',
        details: err.message,
        actor: 'KASIR'
      });
      throw err;
    }
  },

  // Penyesuaian Stok (Opname / Barang Rusak / Dipakai Sendiri / Koreksi)
  async adjustStock({ productId, type, qty, note }) {
    const productNumId = Number(productId);
    const qtyNum = Number(qty);
    const cleanNote = sanitizeText(note);

    if (!productNumId || isNaN(productNumId)) {
      throw new Error('Silakan pilih barang terlebih dahulu.');
    }
    if (!qtyNum || qtyNum <= 0) {
      throw new Error('Jumlah penyesuaian harus lebih dari 0.');
    }
    if (!cleanNote) {
      throw new Error('Alasan penyesuaian stok wajib diisi.');
    }

    try {
      const result = await db.transaction('rw', db.products, db.activity_logs, async () => {
        const product = await db.products.get(productNumId);
        if (!product) {
          throw new Error('Barang tidak ditemukan di database.');
        }

        let newStock = product.stock;
        if (type === 'kurang') {
          if (product.stock < qtyNum) {
            throw new Error(`Stok "${product.name}" saat ini hanya tersisa ${product.stock} unit. Tidak bisa dikurangi ${qtyNum} unit.`);
          }
          newStock = product.stock - qtyNum;
        } else if (type === 'tambah') {
          newStock = product.stock + qtyNum;
        } else {
          throw new Error('Jenis penyesuaian harus "tambah" atau "kurang".');
        }

        await db.products.update(productNumId, {
          stock: newStock
        });

        // Log Blackbox Audit
        await logService.addLog({
          type: 'STOCK_ADJUSTMENT',
          level: 'WARNING',
          action: `Penyesuaian Stok: ${product.name}`,
          details: `Aksi: ${type === 'kurang' ? '-' : '+'}${qtyNum} unit | Alasan: "${cleanNote}" | Stok Lama: ${product.stock} -> Baru: ${newStock}`,
          actor: 'KASIR'
        });

        return newStock;
      });

      return result;
    } catch (err) {
      await logService.addLog({
        type: 'ERROR',
        level: 'WARNING',
        action: 'Gagal Penyesuaian Stok',
        details: err.message,
        actor: 'KASIR'
      });
      throw err;
    }
  },

  // Riwayat Kulakan Terbaru
  async getRecentPurchases(limit = 20) {
    const purchases = await db.stock_purchases.orderBy('date').reverse().limit(limit).toArray();
    const products = await db.products.toArray();
    const productMap = {};
    products.forEach((p) => {
      productMap[p.id] = p;
    });

    return purchases.map((p) => ({
      ...p,
      product_name: productMap[p.product_id]?.name || 'Barang Dihapus',
      category: productMap[p.product_id]?.category || '-',
      image_url: productMap[p.product_id]?.image_url || ''
    }));
  }
};
