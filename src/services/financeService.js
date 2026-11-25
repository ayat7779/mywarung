import { db } from '../db/database';
import { sanitizeText } from '../utils/security';
import { logService } from './logService';

export const financeService = {
  // Catat Pengeluaran Baru
  async addExpense({ date, category, note, amount }) {
    const amountNum = Number(amount);
    const cleanNote = sanitizeText(note);

    if (!category || !['operational', 'personal_draw'].includes(category)) {
      throw new Error('Kategori pengeluaran tidak valid.');
    }
    if (!cleanNote) {
      throw new Error('Catatan pengeluaran wajib diisi.');
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      throw new Error('Nominal pengeluaran harus berupa angka lebih besar dari 0.');
    }

    const expenseDate = date ? new Date(date).toISOString() : new Date().toISOString();

    const expenseId = await db.expenses.add({
      date: expenseDate,
      category,
      note: cleanNote,
      amount: amountNum
    });

    // Log Blackbox Audit
    const categoryLabel = category === 'operational' ? 'Biaya Warung' : 'Ambil Pribadi';
    await logService.addLog({
      type: 'EXPENSE',
      level: 'INFO',
      action: `Catat Pengeluaran: ${categoryLabel}`,
      details: `Catatan: "${cleanNote}" | Nominal: Rp ${amountNum.toLocaleString('id-ID')}`,
      actor: 'KASIR'
    });

    return expenseId;
  },

  // Hapus Pengeluaran jika Salah Input
  async deleteExpense(id) {
    const expense = await db.expenses.get(id);
    if (expense) {
      await logService.addLog({
        type: 'EXPENSE',
        level: 'WARNING',
        action: 'Hapus Catatan Pengeluaran',
        details: `Catatan: "${expense.note}" | Nominal: Rp ${(expense.amount || 0).toLocaleString('id-ID')}`,
        actor: 'KASIR'
      });
    }
    return await db.expenses.delete(id);
  },

  // Ambil Daftar Pengeluaran Berdasarkan Filter Waktu
  async getExpensesList(startISO, endISO) {
    return await db.expenses
      .filter((e) => e.date >= startISO && e.date <= endISO)
      .reverse()
      .toArray();
  },

  // Perhitungan Laporan Rugi Laba & Arus Kas
  async getFinancialReport(startISO, endISO) {
    // 1. Ambil Penjualan (Sales) periode ini
    const salesInPeriod = await db.sales
      .filter((s) => s.date >= startISO && s.date <= endISO)
      .toArray();

    let totalSales = 0; // Omzet
    let totalCostOfGoodsSold = 0; // HPP (Modal Barang Terjual)
    let cashOrQrisSales = 0; // Uang Masuk dari Penjualan Langsung

    salesInPeriod.forEach((s) => {
      totalSales += s.total_amount || 0;
      totalCostOfGoodsSold += s.total_cost || 0;
      if (s.payment_type === 'cash' || s.payment_type === 'qris') {
        cashOrQrisSales += s.total_amount || 0;
      }
    });

    // 2. Ambil Pelunasan Kasbon yang LUNAS pada periode ini (berdasarkan paid_at)
    const debtsPaidInPeriod = await db.sales
      .filter((s) => s.payment_type === 'debt' && s.is_paid && s.paid_at && s.paid_at >= startISO && s.paid_at <= endISO)
      .toArray();

    let debtCollected = 0;
    debtsPaidInPeriod.forEach((s) => {
      debtCollected += s.total_amount || 0;
    });

    // 3. Ambil Pengeluaran (Expenses) periode ini
    const expensesInPeriod = await db.expenses
      .filter((e) => e.date >= startISO && e.date <= endISO)
      .toArray();

    let operationalExpenses = 0; // Beban Operasional Warung
    let personalDraws = 0; // Pengambilan Pribadi

    expensesInPeriod.forEach((e) => {
      if (e.category === 'operational') {
        operationalExpenses += e.amount || 0;
      } else if (e.category === 'personal_draw') {
        personalDraws += e.amount || 0;
      }
    });

    // 4. Ambil Belanja Kulakan (Stock Purchases) periode ini
    const purchasesInPeriod = await db.stock_purchases
      .filter((p) => p.date >= startISO && p.date <= endISO)
      .toArray();

    let stockPurchasesCost = 0;
    purchasesInPeriod.forEach((p) => {
      stockPurchasesCost += p.total_cost || 0;
    });

    // Kalkulasi Hasil Rugi Laba
    const grossProfit = totalSales - totalCostOfGoodsSold;
    const netProfit = grossProfit - operationalExpenses;

    // Kalkulasi Arus Kas (Uang Nyata)
    const totalCashIn = cashOrQrisSales + debtCollected;
    const totalCashOut = stockPurchasesCost + operationalExpenses + personalDraws;
    const netCashFlow = totalCashIn - totalCashOut;

    return {
      totalSales,
      totalCostOfGoodsSold,
      grossProfit,
      operationalExpenses,
      netProfit,
      personalDraws,

      // Detail Cashflow
      cashOrQrisSales,
      debtCollected,
      totalCashIn,
      stockPurchasesCost,
      totalCashOut,
      netCashFlow,

      // Raw counts for info
      salesCount: salesInPeriod.length,
      expensesCount: expensesInPeriod.length,
      purchasesCount: purchasesInPeriod.length
    };
  }
};
