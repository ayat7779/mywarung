import { db } from '../db/database';
import { sanitizeText, sanitizeImageUrl } from '../utils/security';

export const productService = {
  async getAllProducts() {
    return await db.products.toArray();
  },

  async isProductInSales(productId) {
    const count = await db.sale_items.where('product_id').equals(productId).count();
    return count > 0;
  },

  async addProduct(product) {
    const newProduct = {
      name: sanitizeText(product.name),
      category: sanitizeText(product.category) || 'Umum',
      cost_price: Number(product.cost_price) || 0,
      sell_price: Number(product.sell_price) || 0,
      stock: Number(product.stock) || 0,
      min_stock: Number(product.min_stock) || 0,
      image_url: sanitizeImageUrl(product.image_url)
    };
    return await db.products.add(newProduct);
  },

  async updateProduct(id, product) {
    const updatedProduct = {
      name: sanitizeText(product.name),
      category: sanitizeText(product.category) || 'Umum',
      cost_price: Number(product.cost_price) || 0,
      sell_price: Number(product.sell_price) || 0,
      stock: Number(product.stock) || 0,
      min_stock: Number(product.min_stock) || 0,
      image_url: sanitizeImageUrl(product.image_url)
    };
    return await db.products.update(id, updatedProduct);
  },

  async deleteProduct(id) {
    const hasSales = await this.isProductInSales(id);
    if (hasSales) {
      throw new Error(
        'Barang ini tidak dapat dihapus karena sudah memiliki riwayat transaksi penjualan. Demi pengamanan & keakuratan laporan data, barang pernah laku dilarang dihapus.'
      );
    }
    return await db.products.delete(id);
  }
};
