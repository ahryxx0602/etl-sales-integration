/**
 * API Service - Tối ưu với generic function
 */
const API_BASE = '/api/etl';

// Generic API call function
async function apiCall(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.message || `Failed: ${endpoint}`);
  return result;
}

export const apiService = {
  async getStats() {
    const result = await apiCall('/stats');
    return result.data;
  },

  // Generic paginated getter
  async getPaginated(endpoint, limit = 25, offset = 0) {
    const result = await apiCall(`${endpoint}?limit=${limit}&offset=${offset}`);
    return { data: result.data, total: result.total };
  },

  // Specific getters using generic function
  getStores: (limit, offset) => apiService.getPaginated('/stores', limit, offset),
  getCustomers: (limit, offset) => apiService.getPaginated('/customers', limit, offset),
  getProducts: (limit, offset) => apiService.getPaginated('/products', limit, offset),
  getOrders: (limit, offset) => apiService.getPaginated('/orders', limit, offset),
  getOrderItems: (limit, offset) => apiService.getPaginated('/order-items', limit, offset),
  getLogs: (limit, offset) => apiService.getPaginated('/logs', limit, offset),

  // Process endpoints
  async processOldDb() {
    const result = await apiCall('/process/old-db', { method: 'POST' });
    return result.result;
  },

  async processCsvFolder() {
    const result = await apiCall('/process/csv-folder', { method: 'POST' });
    return result.result;
  }
};
