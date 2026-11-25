import { db } from './database';
import { logService } from '../services/logService';

export const backupService = {
  // Unduh File Backup JSON
  async exportDatabase() {
    const products = await db.products.toArray();
    const sales = await db.sales.toArray();
    const sale_items = await db.sale_items.toArray();
    const stock_purchases = await db.stock_purchases.toArray();
    const expenses = await db.expenses.toArray();

    const backupPayload = {
      app: 'WarungPribadiDB',
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        products,
        sales,
        sale_items,
        stock_purchases,
        expenses
      }
    };

    const jsonString = JSON.stringify(backupPayload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const filename = `Backup_WarungPribadi_${dateStr}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Log Blackbox Audit
    await logService.addLog({
      type: 'SECURITY',
      level: 'INFO',
      action: 'Ekspor Backup JSON Berhasil',
      details: `File: ${filename} | ${products.length} Barang, ${sales.length} Transaksi, ${expenses.length} Pengeluaran`,
      actor: 'PEMILIK'
    });

    return {
      filename,
      counts: {
        products: products.length,
        sales: sales.length,
        sale_items: sale_items.length,
        stock_purchases: stock_purchases.length,
        expenses: expenses.length
      }
    };
  },

  // Pulihkan / Restore Data dari File Backup JSON
  async importDatabase(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const content = e.target.result;
          const parsed = JSON.parse(content);

          if (!parsed || parsed.app !== 'WarungPribadiDB' || !parsed.data) {
            throw new Error('Format file backup tidak sesuai! Pastikan Anda memilih file .json hasil ekspor dari WarungPribadiDB.');
          }

          const { products, sales, sale_items, stock_purchases, expenses } = parsed.data;

          if (!Array.isArray(products) || !Array.isArray(sales) || !Array.isArray(sale_items)) {
            throw new Error('Isi tabel data backup rusak atau tidak lengkap.');
          }

          await db.transaction('rw', [db.products, db.sales, db.sale_items, db.stock_purchases, db.expenses, db.activity_logs], async () => {
            // Bersihkan data lama di 5 tabel
            await db.products.clear();
            await db.sales.clear();
            await db.sale_items.clear();
            await db.stock_purchases.clear();
            await db.expenses.clear();

            // Masukkan data baru hasil restore
            if (products.length > 0) await db.products.bulkAdd(products);
            if (sales.length > 0) await db.sales.bulkAdd(sales);
            if (sale_items.length > 0) await db.sale_items.bulkAdd(sale_items);
            if (Array.isArray(stock_purchases) && stock_purchases.length > 0) {
              await db.stock_purchases.bulkAdd(stock_purchases);
            }
            if (Array.isArray(expenses) && expenses.length > 0) {
              await db.expenses.bulkAdd(expenses);
            }

            localStorage.setItem('warung_pribadi_seeded_v1', 'true');
          });

          // Log Blackbox Audit
          await logService.addLog({
            type: 'SECURITY',
            level: 'SECURITY',
            action: 'Restore Database dari Backup JSON',
            details: `File: "${file.name}" | Dipulihkan: ${products.length} Barang, ${sales.length} Transaksi, ${Array.isArray(expenses) ? expenses.length : 0} Pengeluaran`,
            actor: 'PEMILIK'
          });

          resolve({
            exportedAt: parsed.exportedAt,
            counts: {
              products: products.length,
              sales: sales.length,
              sale_items: sale_items.length,
              stock_purchases: Array.isArray(stock_purchases) ? stock_purchases.length : 0,
              expenses: Array.isArray(expenses) ? expenses.length : 0
            }
          });
        } catch (err) {
          logService.addLog({
            type: 'ERROR',
            level: 'ERROR',
            action: 'Gagal Restore Database',
            details: err.message,
            actor: 'PEMILIK'
          });
          reject(err);
        }
      };

      reader.onerror = () => reject(new Error('Gagal membaca file JSON.'));
      reader.readAsText(file);
    });
  }
};
