import Dexie from 'dexie';

export const db = new Dexie('WarungPribadiDB');

db.version(1).stores({
  products: '++id, name, category, stock, min_stock',
  sales: '++id, date, payment_type, customer_name, is_paid, paid_at',
  sale_items: '++id, sale_id, product_id',
  stock_purchases: '++id, date, product_id',
  expenses: '++id, date, category'
});

db.version(2).stores({
  products: '++id, name, category, stock, min_stock',
  sales: '++id, date, payment_type, customer_name, is_paid, paid_at',
  sale_items: '++id, sale_id, product_id',
  stock_purchases: '++id, date, product_id',
  expenses: '++id, date, category',
  activity_logs: '++id, timestamp, type, level'
});

const DEFAULT_PRODUCTS = [
  {
    name: 'Indomie Goreng',
    category: 'Makanan',
    cost_price: 2800,
    sell_price: 3500,
    stock: 40,
    min_stock: 10,
    image_url: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&auto=format&fit=crop&q=80'
  },
  {
    name: 'Air Mineral 600ml',
    category: 'Minuman',
    cost_price: 1800,
    sell_price: 3000,
    stock: 24,
    min_stock: 6,
    image_url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=400&auto=format&fit=crop&q=80'
  },
  {
    name: 'Kopi Kapal Api Sachet',
    category: 'Minuman',
    cost_price: 1200,
    sell_price: 2000,
    stock: 30,
    min_stock: 10,
    image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80'
  },
  {
    name: 'Telur Ayam 1kg',
    category: 'Sembako',
    cost_price: 26000,
    sell_price: 29000,
    stock: 10,
    min_stock: 3,
    image_url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&auto=format&fit=crop&q=80'
  },
  {
    name: 'Minyak Goreng 1L',
    category: 'Sembako',
    cost_price: 14500,
    sell_price: 17000,
    stock: 15,
    min_stock: 5,
    image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=80'
  },
  {
    name: 'Beras Medium 1kg',
    category: 'Sembako',
    cost_price: 12500,
    sell_price: 14500,
    stock: 50,
    min_stock: 10,
    image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80'
  },
  {
    name: 'Sabun Cuci Piring 210ml',
    category: 'Perlengkapan',
    cost_price: 3500,
    sell_price: 5000,
    stock: 8,
    min_stock: 3,
    image_url: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=400&auto=format&fit=crop&q=80'
  },
  {
    name: 'Tabung Gas 3kg',
    category: 'Sembako',
    cost_price: 17000,
    sell_price: 20000,
    stock: 2,
    min_stock: 3,
    image_url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&auto=format&fit=crop&q=80'
  }
];

export async function seedInitialData() {
  const SEED_KEY = 'warung_pribadi_seeded_v1';
  const isAlreadySeeded = localStorage.getItem(SEED_KEY);

  if (!isAlreadySeeded) {
    const count = await db.products.count();
    if (count === 0) {
      await db.products.bulkAdd(DEFAULT_PRODUCTS);
    }
    localStorage.setItem(SEED_KEY, 'true');
  } else {
    // If already seeded once, do NOT re-insert default items even if table becomes empty!
    // Only patch missing image_url on existing records if any exist
    const allProducts = await db.products.toArray();
    for (const p of allProducts) {
      if (!p.image_url) {
        const foundSeed = DEFAULT_PRODUCTS.find((item) => item.name === p.name);
        if (foundSeed) {
          await db.products.update(p.id, { image_url: foundSeed.image_url });
        }
      }
    }
  }
}

// Reset seluruh data ke kondisi awal bersih untuk ujicoba
export async function resetDatabaseToInitial() {
  return await db.transaction('rw', [db.products, db.sales, db.sale_items, db.stock_purchases, db.expenses, db.activity_logs], async () => {
    await db.sales.clear();
    await db.sale_items.clear();
    await db.stock_purchases.clear();
    await db.expenses.clear();
    await db.products.clear();
    await db.activity_logs.clear();
    await db.products.bulkAdd(DEFAULT_PRODUCTS);
    localStorage.setItem('warung_pribadi_seeded_v1', 'true');
  });
}

// Hapus hanya seluruh transaksi (penjualan, kasbon, kulakan, pengeluaran) tanpa menghapus master barang
export async function clearAllTransactionsOnly() {
  return await db.transaction('rw', [db.sales, db.sale_items, db.stock_purchases, db.expenses, db.activity_logs], async () => {
    await db.sales.clear();
    await db.sale_items.clear();
    await db.stock_purchases.clear();
    await db.expenses.clear();
    await db.activity_logs.clear();
  });
}
