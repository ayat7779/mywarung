import { db } from '../db/database';
import { sanitizeText } from '../utils/security';
import { logService } from './logService';

export const saleService = {
  async processCheckout({ items, paymentType, customerName = '', cashPaid = 0 }) {
    if (!items || items.length === 0) {
      await logService.addLog({
        type: 'ERROR',
        level: 'WARNING',
        action: 'Gagal Checkout Kasir',
        details: 'Keranjang belanja masih kosong.',
        actor: 'KASIR'
      });
      throw new Error('Keranjang belanja masih kosong.');
    }

    const cleanCustomerName = sanitizeText(customerName);

    if (paymentType === 'debt' && !cleanCustomerName) {
      await logService.addLog({
        type: 'ERROR',
        level: 'WARNING',
        action: 'Gagal Checkout Kasbon',
        details: 'Transaksi kasbon ditolak karena nama pelanggan kosong.',
        actor: 'KASIR'
      });
      throw new Error('Nama pelanggan wajib diisi untuk transaksi Kasbon.');
    }

    try {
      const result = await db.transaction('rw', db.products, db.sales, db.sale_items, db.activity_logs, async () => {
        let totalAmount = 0;
        let totalCost = 0;
        const saleItemSnapshots = [];

        // 1. Pre-check stock & calculate totals
        for (const item of items) {
          const product = await db.products.get(item.product.id);
          if (!product) {
            throw new Error(`Barang "${item.product.name}" tidak ditemukan.`);
          }
          if (product.stock < item.qty) {
            throw new Error(`Stok "${product.name}" tidak mencukupi (Sisa stok: ${product.stock}).`);
          }

          const itemTotalAmount = item.qty * product.sell_price;
          const itemTotalCost = item.qty * product.cost_price;

          totalAmount += itemTotalAmount;
          totalCost += itemTotalCost;

          saleItemSnapshots.push({
            product_id: product.id,
            product_name: product.name,
            qty: item.qty,
            unit_price: product.sell_price,
            unit_cost: product.cost_price
          });
        }

        const now = new Date().toISOString();
        const isPaid = paymentType !== 'debt';

        // 2. Add Sale record
        const saleId = await db.sales.add({
          date: now,
          total_amount: totalAmount,
          total_cost: totalCost,
          payment_type: paymentType,
          customer_name: cleanCustomerName,
          is_paid: isPaid,
          paid_at: isPaid ? now : null
        });

        // 3. Add Sale Items & Update Stock atomically
        for (const snapshot of saleItemSnapshots) {
          await db.sale_items.add({
            sale_id: saleId,
            product_id: snapshot.product_id,
            qty: snapshot.qty,
            unit_price: snapshot.unit_price,
            unit_cost: snapshot.unit_cost
          });

          // Decrement stock
          const currentProd = await db.products.get(snapshot.product_id);
          await db.products.update(snapshot.product_id, {
            stock: currentProd.stock - snapshot.qty
          });
        }

        const changeAmount = paymentType === 'cash' ? Math.max(0, cashPaid - totalAmount) : 0;

        // Log Blackbox Audit Activity
        const itemsSummary = saleItemSnapshots.map((i) => `${i.product_name} (${i.qty}x)`).join(', ');
        await logService.addLog({
          type: 'TRANSACTION',
          level: 'INFO',
          action: `Penjualan #${saleId} (${paymentType.toUpperCase()})`,
          details: `Total: Rp ${totalAmount.toLocaleString('id-ID')} | Pelanggan: ${cleanCustomerName || '-'} | Items: ${itemsSummary}`,
          actor: 'KASIR'
        });

        return {
          saleId,
          date: now,
          items: saleItemSnapshots,
          totalAmount,
          totalCost,
          paymentType,
          customerName: cleanCustomerName,
          cashPaid: paymentType === 'cash' ? cashPaid : totalAmount,
          changeAmount,
          isPaid
        };
      });

      return result;
    } catch (err) {
      await logService.addLog({
        type: 'ERROR',
        level: 'ERROR',
        action: 'Gagal Transaksi Penjualan',
        details: err.message,
        actor: 'KASIR'
      });
      throw err;
    }
  }
};
