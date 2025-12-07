/**
 * Service để lookup thông tin product
 */
export class ProductLookupService {
  constructor() {
    this.productsCache = null;
    this.newDbProductsCache = null;
  }

  /**
   * Load products vào cache
   */
  async loadProducts(oldDbModel, newDbModel) {
    if (!this.productsCache) {
      this.productsCache = await oldDbModel.getAllProducts();
    }
    if (!this.newDbProductsCache) {
      this.newDbProductsCache = await newDbModel.getAllProducts();
    }
  }

  /**
   * Normalize SKU để so sánh
   */
  normalizeSku(sku) {
    if (!sku) return null;
    return String(sku).trim().toUpperCase();
  }

  /**
   * Lookup product info từ SKU
   */
  lookupProduct(sku) {
    if (!sku) return { product_name: null, category: null };

    const normalized = this.normalizeSku(sku);
    if (!normalized) return { product_name: null, category: null };

    // Tìm trong old_products
    const product = this.productsCache?.find(p => {
      const pSku = this.normalizeSku(p.sku);
      return pSku === normalized;
    });

    if (product) {
      return {
        product_name: product.product_name,
        category: product.category,
      };
    }

    // Fallback: tìm trong new_db
    const newDbProduct = this.newDbProductsCache?.find(p => {
      const pSku = this.normalizeSku(p.sku);
      return pSku === normalized;
    });

    return {
      product_name: newDbProduct?.product_name || null,
      category: newDbProduct?.category || null,
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.productsCache = null;
    this.newDbProductsCache = null;
  }
}

