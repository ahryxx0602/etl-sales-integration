/**
 * Service để lookup thông tin store
 */
export class StoreLookupService {
  constructor() {
    this.storesCache = null;
    this.newDbStoresCache = null;
  }

  /**
   * Load stores vào cache
   */
  async loadStores(oldDbModel, newDbModel) {
    if (!this.storesCache) {
      this.storesCache = await oldDbModel.getAllStores();
    }
    if (!this.newDbStoresCache) {
      this.newDbStoresCache = await newDbModel.getAllStores();
    }
  }

  /**
   * Normalize store code để so sánh
   */
  normalizeStoreCode(storeCode) {
    if (!storeCode) return null;
    return String(storeCode).trim().toUpperCase();
  }

  /**
   * Lookup store name từ store code
   */
  lookupStoreName(storeCode) {
    if (!storeCode) return null;

    const normalized = this.normalizeStoreCode(storeCode);
    if (!normalized) return null;

    // Tìm trong old_stores
    const store = this.storesCache?.find(s => {
      const sCode = this.normalizeStoreCode(s.store_code);
      return sCode === normalized;
    });

    if (store) {
      return store.store_name;
    }

    // Fallback: tìm trong new_db
    const newDbStore = this.newDbStoresCache?.find(s => {
      const sCode = this.normalizeStoreCode(s.store_code);
      return sCode === normalized;
    });

    return newDbStore?.store_name || null;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.storesCache = null;
    this.newDbStoresCache = null;
  }
}

