/**
 * Service để lookup thông tin customer
 */
export class CustomerLookupService {
  constructor() {
    this.customersCache = null;
    this.newDbCustomersCache = null;
  }

  /**
   * Load customers vào cache
   */
  async loadCustomers(oldDbModel, newDbModel) {
    if (!this.customersCache) {
      this.customersCache = await oldDbModel.getAllCustomers();
    }
    if (!this.newDbCustomersCache) {
      this.newDbCustomersCache = await newDbModel.getAllCustomers();
    }
  }

  /**
   * Normalize phone để so sánh
   */
  normalizePhone(phone) {
    if (!phone) return null;
    return String(phone).trim().replace(/[^0-9]/g, '');
  }

  /**
   * Lookup customer info từ phone
   */
  lookupCustomer(phone) {
    if (!phone) return { full_name: null, email: null };

    const normalized = this.normalizePhone(phone);
    if (!normalized) return { full_name: null, email: null };

    // Tìm trong old_customers
    const customer = this.customersCache?.find(c => {
      const cPhone = this.normalizePhone(c.phone);
      return cPhone === normalized;
    });

    if (customer) {
      return {
        full_name: customer.full_name,
        email: customer.email,
      };
    }

    // Fallback: tìm trong new_db
    const newDbCustomer = this.newDbCustomersCache?.find(c => {
      const cPhone = this.normalizePhone(c.phone);
      return cPhone === normalized;
    });

    return {
      full_name: newDbCustomer?.full_name || null,
      email: newDbCustomer?.email || null,
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.customersCache = null;
    this.newDbCustomersCache = null;
  }
}

