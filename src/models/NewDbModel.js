import { upsertAndGetId, paginateQuery, queryWithFilters, ensureUtf8Charset } from '../utils/dbHelpers.js';

/**
 * Model để tương tác với new_db (Data Warehouse)
 * 
 * Chịu trách nhiệm:
 * - CRUD operations cho dimension tables (stores, customers, products)
 * - CRUD operations cho fact tables (orders, order_items)
 * - Logging operations (etl_logs)
 * - Query operations với pagination
 * 
 * @class NewDbModel
 */
export class NewDbModel {
  /**
   * Tạo instance NewDbModel
   * @param {Promise<Object>} pool - MySQL pool (Promise)
   */
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Upsert store
   * @param {string} storeCode - Store code
   * @param {string|null} storeName - Store name (có thể null)
   * @returns {Promise<number>} Store ID
   */
  async upsertStore(storeCode, storeName) {
    const pool = await this.pool;
    await ensureUtf8Charset(pool);
    
    // Nếu storeName là null/undefined, chỉ insert store_code
    if (storeName === null || storeName === undefined) {
      const [result] = await pool.query(
        `INSERT INTO stores (store_code, store_name)
         VALUES (?, NULL)
         ON DUPLICATE KEY UPDATE store_code = store_code`,
        [storeCode]
      );
    } else {
      // Sử dụng helper function
      return await upsertAndGetId(
        pool,
        'stores',
        'store_code',
        storeCode,
        { store_code: storeCode, store_name: storeName },
        { updateFields: ['store_name'] }
      );
    }
    
    await ensureUtf8Charset(pool);
    const [rows] = await pool.query('SELECT id FROM stores WHERE store_code = ?', [storeCode]);
    return rows[0].id;
  }

  /**
   * Upsert customer
   * @param {string} phone - Phone number
   * @param {string|null} fullName - Full name (có thể null)
   * @param {string|null} email - Email (có thể null)
   * @returns {Promise<number|null>} Customer ID
   */
  async upsertCustomer(phone, fullName = null, email = null) {
    const pool = await this.pool;
    await ensureUtf8Charset(pool);
    return await upsertAndGetId(
      pool,
      'customers',
      'phone',
      phone,
      { phone, full_name: fullName, email },
      { updateFields: ['full_name', 'email'], idField: 'id' }
    );
  }

  /**
   * Upsert product
   * @param {string} sku - SKU
   * @param {string} productName - Product name
   * @param {string|null} category - Category (có thể null)
   * @returns {Promise<number>} Product ID
   */
  async upsertProduct(sku, productName, category = null) {
    const pool = await this.pool;
    await ensureUtf8Charset(pool);
    return await upsertAndGetId(
      pool,
      'products',
      'sku',
      sku,
      { sku, product_name: productName, category },
      { updateFields: ['product_name', 'category'], idField: 'id' }
    );
  }

  /**
   * Upsert order
   * @param {string} orderCode - Order code
   * @param {number} storeId - Store ID
   * @param {number|null} customerId - Customer ID (có thể null)
   * @param {string} orderDatetime - Order datetime
   * @returns {Promise<number>} Order ID
   */
  async upsertOrder(orderCode, storeId, customerId, orderDatetime) {
    const pool = await this.pool;
    await ensureUtf8Charset(pool);
    return await upsertAndGetId(
      pool,
      'orders',
      'order_code',
      orderCode,
      { order_code: orderCode, store_id: storeId, customer_id: customerId, order_datetime: orderDatetime },
      { updateFields: ['store_id', 'customer_id', 'order_datetime'], idField: 'id' }
    );
  }

  // Order Items
  async insertOrderItem(orderId, productId, qty, unitPrice, currency = 'VND') {
    const pool = await this.pool;
    await ensureUtf8Charset(pool);
    const [result] = await pool.query(
      `INSERT INTO order_items (order_id, product_id, qty, unit_price, currency)
       VALUES (?, ?, ?, ?, ?)`,
      [orderId, productId, qty, unitPrice, currency]
    );
    return result.insertId;
  }

  // ETL Logs
  async insertLog(sourceTable, sourceType, recordId, orderCode, status, message, errorDetails = null) {
    const pool = await this.pool;
    await ensureUtf8Charset(pool);
    const [result] = await pool.query(
      `INSERT INTO etl_logs (source_table, source_type, record_id, order_code, status, message, error_details)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [sourceTable, sourceType, recordId, orderCode, status, message, errorDetails ? JSON.stringify(errorDetails) : null]
    );
    return result.insertId;
  }

  // Get stats
  async getStats() {
    const pool = await this.pool;
    await ensureUtf8Charset(pool);
    const [stores] = await pool.query('SELECT COUNT(*) as count FROM stores');
    const [customers] = await pool.query('SELECT COUNT(*) as count FROM customers');
    const [products] = await pool.query('SELECT COUNT(*) as count FROM products');
    const [orders] = await pool.query('SELECT COUNT(*) as count FROM orders');
    const [orderItems] = await pool.query('SELECT COUNT(*) as count FROM order_items');
    const [logs] = await pool.query('SELECT COUNT(*) as count FROM etl_logs');
    
    return {
      stores: stores[0].count,
      customers: customers[0].count,
      products: products[0].count,
      orders: orders[0].count,
      orderItems: orderItems[0].count,
      logs: logs[0].count,
    };
  }

  /**
   * Get ETL logs với pagination và filtering
   * @param {number} limit - Số lượng records
   * @param {number} offset - Số records bỏ qua
   * @param {string|null} status - Filter theo status
   * @returns {Promise<{data: Array, total: number}>} Logs và tổng số
   */
  async getLogs(limit = 100, offset = 0, status = null) {
    const pool = await this.pool;
    await ensureUtf8Charset(pool);
    return await queryWithFilters(
      pool,
      'SELECT * FROM etl_logs',
      'SELECT COUNT(*) as total FROM etl_logs',
      status ? { status } : {},
      limit,
      offset
    );
  }

  // Get all stores (for batch lookup)
  async getAllStores() {
    const pool = await this.pool;
    await ensureUtf8Charset(pool);
    const [rows] = await pool.query('SELECT * FROM stores');
    return rows;
  }

  // Get all customers (for batch lookup)
  async getAllCustomers() {
    const pool = await this.pool;
    await ensureUtf8Charset(pool);
    const [rows] = await pool.query('SELECT * FROM customers');
    return rows;
  }

  // Get all products (for batch lookup)
  async getAllProducts() {
    const pool = await this.pool;
    await ensureUtf8Charset(pool);
    const [rows] = await pool.query('SELECT * FROM products');
    return rows;
  }

  /**
   * Get stores với pagination
   * @param {number} limit - Số lượng records
   * @param {number} offset - Số records bỏ qua
   * @returns {Promise<{data: Array, total: number}>} Stores và tổng số
   */
  async getStores(limit = 100, offset = 0) {
    const pool = await this.pool;
    await ensureUtf8Charset(pool);
    return await paginateQuery(
      pool,
      'SELECT * FROM stores ORDER BY id DESC',
      'SELECT COUNT(*) as total FROM stores',
      [],
      limit,
      offset
    );
  }

  /**
   * Get customers với pagination
   * @param {number} limit - Số lượng records
   * @param {number} offset - Số records bỏ qua
   * @returns {Promise<{data: Array, total: number}>} Customers và tổng số
   */
  async getCustomers(limit = 100, offset = 0) {
    const pool = await this.pool;
    await ensureUtf8Charset(pool);
    return await paginateQuery(
      pool,
      'SELECT * FROM customers ORDER BY id DESC',
      'SELECT COUNT(*) as total FROM customers',
      [],
      limit,
      offset
    );
  }

  /**
   * Get products với pagination
   * @param {number} limit - Số lượng records
   * @param {number} offset - Số records bỏ qua
   * @returns {Promise<{data: Array, total: number}>} Products và tổng số
   */
  async getProducts(limit = 100, offset = 0) {
    const pool = await this.pool;
    await ensureUtf8Charset(pool);
    return await paginateQuery(
      pool,
      'SELECT * FROM products ORDER BY id DESC',
      'SELECT COUNT(*) as total FROM products',
      [],
      limit,
      offset
    );
  }

  /**
   * Get orders với pagination
   * @param {number} limit - Số lượng records
   * @param {number} offset - Số records bỏ qua
   * @returns {Promise<{data: Array, total: number}>} Orders và tổng số
   */
  async getOrders(limit = 100, offset = 0) {
    const pool = await this.pool;
    await ensureUtf8Charset(pool);
    return await paginateQuery(
      pool,
      `SELECT o.*, s.store_code, s.store_name, c.full_name as customer_name, c.phone as customer_phone
       FROM orders o
       LEFT JOIN stores s ON o.store_id = s.id
       LEFT JOIN customers c ON o.customer_id = c.id
       ORDER BY o.id DESC`,
      'SELECT COUNT(*) as total FROM orders',
      [],
      limit,
      offset
    );
  }

  /**
   * Get order items với pagination
   * @param {number} limit - Số lượng records
   * @param {number} offset - Số records bỏ qua
   * @returns {Promise<{data: Array, total: number}>} Order items và tổng số
   */
  async getOrderItems(limit = 100, offset = 0) {
    const pool = await this.pool;
    await ensureUtf8Charset(pool);
    return await paginateQuery(
      pool,
      `SELECT oi.*, o.order_code, p.product_name, p.sku
       FROM order_items oi
       LEFT JOIN orders o ON oi.order_id = o.id
       LEFT JOIN products p ON oi.product_id = p.id
       ORDER BY oi.id DESC`,
      'SELECT COUNT(*) as total FROM order_items',
      [],
      limit,
      offset
    );
  }
}
