/**
 * Main Application với Alpine.js
 */
import { apiService } from './modules/api.js';
import { utils } from './modules/utils.js';
import { tableConfigs } from './modules/components.js';

// Register Alpine.js component - ensure it's registered before Alpine initializes
function registerAlpineComponent() {
  const componentData = getComponentData();
  
  // Try to register immediately if Alpine is already available
  if (typeof window.Alpine !== 'undefined' && window.Alpine.data) {
    window.Alpine.data('etlApp', () => componentData);
    return;
  }
  
  // Otherwise, wait for alpine:init event
  document.addEventListener('alpine:init', () => {
    window.Alpine.data('etlApp', () => componentData);
  }, { once: true });
}

function getComponentData() {
  return {
    // Stats
    stats: {
      stores: 0,
      customers: 0,
      products: 0,
      orders: 0,
      orderItems: 0
    },

    // Active tab
    activeTab: 'process',

    // Process result
    processResult: null,
    processing: false,

    // Table data states
    stores: { data: [], loading: false, error: null, page: 1, pageSize: 25, total: 0 },
    customers: { data: [], loading: false, error: null, page: 1, pageSize: 25, total: 0 },
    products: { data: [], loading: false, error: null, page: 1, pageSize: 25, total: 0 },
    orders: { data: [], loading: false, error: null, page: 1, pageSize: 25, total: 0 },
    orderItems: { data: [], loading: false, error: null, page: 1, pageSize: 25, total: 0 },
    logs: { data: [], loading: false, error: null, page: 1, pageSize: 25, total: 0 },

    init() {
      this.loadStats();
      // Auto refresh stats every 5 seconds
      setInterval(() => this.loadStats(), 5000);
    },

    // Tab management
    switchTab(tab) {
      this.activeTab = tab;
      if (tab !== 'process') {
        this.loadTable(tab);
      }
    },

    // Load stats
    async loadStats() {
      try {
        this.stats = await apiService.getStats();
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    },

    // Generic table loader - tối ưu với mapping
    async loadTable(tableName) {
      const state = this[tableName];
      if (!state) return;

      state.loading = true;
      state.error = null;

      try {
        const limit = state.pageSize;
        const offset = (state.page - 1) * limit;

        // Map table names to API methods
        const apiMap = {
          stores: apiService.getStores,
          customers: apiService.getCustomers,
          products: apiService.getProducts,
          orders: apiService.getOrders,
          orderItems: apiService.getOrderItems,
          logs: apiService.getLogs
        };

        const apiMethod = apiMap[tableName];
        if (!apiMethod) throw new Error(`Unknown table: ${tableName}`);

        const result = await apiMethod(limit, offset);
        state.data = result.data || [];
        state.total = result.total || 0;
      } catch (error) {
        state.error = error.message;
        state.data = [];
        state.total = 0;
      } finally {
        state.loading = false;
      }
    },

    // Pagination
    goToPage(tableName, page) {
      const state = this[tableName];
      if (!state) return;

      const totalPages = Math.ceil(state.total / state.pageSize);
      if (page < 1 || page > totalPages) return;

      state.page = page;
      this.loadTable(tableName);
    },

    changePageSize(tableName, pageSize) {
      const state = this[tableName];
      if (!state) return;

      state.pageSize = parseInt(pageSize);
      state.page = 1;
      this.loadTable(tableName);
    },

    // Get pagination info
    getPaginationInfo(tableName) {
      const state = this[tableName];
      if (!state) return null;
      return utils.calculatePagination(state.page, state.pageSize, state.total);
    },

    // Process ETL
    async processData() {
      this.processing = true;
      this.processResult = null;

      try {
        const results = {
          csv: null,
          oldDb: null,
          errors: []
        };

        // Process CSV
        try {
          results.csv = await apiService.processCsvFolder();
        } catch (error) {
          results.errors.push({ source: 'CSV', error: error.message });
        }

        // Process Old DB
        try {
          results.oldDb = await apiService.processOldDb();
        } catch (error) {
          results.errors.push({ source: 'Old DB', error: error.message });
        }

        this.processResult = results;
        this.loadStats();

        // Reload logs if on logs tab
        if (this.activeTab === 'logs') {
          this.loadTable('logs');
        }
      } catch (error) {
        this.processResult = { error: error.message };
      } finally {
        this.processing = false;
      }
    },

    // Format helpers
    formatDate: utils.formatDate,
    formatNumber: utils.formatNumber,
    formatCurrency: utils.formatCurrency,

    // Get table config
    getTableConfig(tableName) {
      return tableConfigs[tableName] || null;
    },

    // Get cell value
    getCellValue(row, column) {
      if (column.formatter) {
        return column.formatter(row);
      }
      return row[column.key] || '-';
    }
  };
}

// Register component immediately
registerAlpineComponent();
