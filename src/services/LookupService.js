/**
 * Main Lookup Service - Facade pattern để orchestrate các lookup services con
 */
import { StoreLookupService } from './lookup/StoreLookupService.js';
import { CustomerLookupService } from './lookup/CustomerLookupService.js';
import { ProductLookupService } from './lookup/ProductLookupService.js';

export class LookupService {
  constructor(oldDbModel, newDbModel) {
    this.oldDbModel = oldDbModel;
    this.newDbModel = newDbModel;
    
    // Tạo các sub-services
    this.storeLookup = new StoreLookupService();
    this.customerLookup = new CustomerLookupService();
    this.productLookup = new ProductLookupService();
  }

  /**
   * Load tất cả dữ liệu tham chiếu vào cache
   */
  async loadReferenceData() {
    await Promise.all([
      this.storeLookup.loadStores(this.oldDbModel, this.newDbModel),
      this.customerLookup.loadCustomers(this.oldDbModel, this.newDbModel),
      this.productLookup.loadProducts(this.oldDbModel, this.newDbModel),
    ]);
  }

  /**
   * Normalize store code
   */
  normalizeStoreCode(storeCode) {
    return this.storeLookup.normalizeStoreCode(storeCode);
  }

  /**
   * Normalize phone
   */
  normalizePhone(phone) {
    return this.customerLookup.normalizePhone(phone);
  }

  /**
   * Normalize SKU
   */
  normalizeSku(sku) {
    return this.productLookup.normalizeSku(sku);
  }

  /**
   * Lookup store name
   */
  lookupStoreName(storeCode) {
    return this.storeLookup.lookupStoreName(storeCode);
  }

  /**
   * Lookup customer
   */
  lookupCustomer(phone) {
    return this.customerLookup.lookupCustomer(phone);
  }

  /**
   * Lookup product
   */
  lookupProduct(sku) {
    return this.productLookup.lookupProduct(sku);
  }

  /**
   * Tạo Map từ array để lookup nhanh (deprecated - giữ lại để backward compatibility)
   */
  createStoreMap(stores) {
    const map = new Map();
    stores.forEach(s => {
      const key = this.normalizeStoreCode(s.store_code);
      if (key) map.set(key, s);
    });
    return map;
  }

  createCustomerMap(customers) {
    const map = new Map();
    customers.forEach(c => {
      const key = this.normalizePhone(c.phone);
      if (key) map.set(key, c);
    });
    return map;
  }

  createProductMap(products) {
    const map = new Map();
    products.forEach(p => {
      const key = this.normalizeSku(p.sku);
      if (key) map.set(key, p);
    });
    return map;
  }

  /**
   * Enrich một row dữ liệu với thông tin từ các bảng tham chiếu
   */
  enrichRow(row) {
    const storeCode = row.store_code || row.store;
    const phone = row.customer_phone || row.phone;
    const sku = row.item_sku || row.sku;

    const storeName = this.lookupStoreName(storeCode);
    const customer = this.lookupCustomer(phone);
    const product = this.lookupProduct(sku);

    return {
      ...row,
      store_code: storeCode,
      store_name: storeName,
      customer_phone: phone,
      customer_name: customer.full_name,
      customer_email: customer.email,
      item_sku: sku,
      product_name: product.product_name,
      category: product.category,
    };
  }

  /**
   * Clear cache (nếu cần reload dữ liệu)
   */
  clearCache() {
    this.storeLookup.clearCache();
    this.customerLookup.clearCache();
    this.productLookup.clearCache();
  }
}
