import { ensureUtf8Charset } from '../utils/dbHelpers.js';

export class OldDbModel {
  constructor(pool) {
    this.pool = pool;
  }

  async getAllStores() {
    const pool = await this.pool;
    await ensureUtf8Charset(pool);
    const [rows] = await pool.query('SELECT * FROM old_stores');
    return rows;
  }

  async getAllCustomers() {
    const pool = await this.pool;
    await ensureUtf8Charset(pool);
    const [rows] = await pool.query('SELECT * FROM old_customers');
    return rows;
  }

  async getAllProducts() {
    const pool = await this.pool;
    await ensureUtf8Charset(pool);
    const [rows] = await pool.query('SELECT * FROM old_products');
    return rows;
  }

  async getAllOrders() {
    const pool = await this.pool;
    await ensureUtf8Charset(pool);
    const [rows] = await pool.query('SELECT * FROM old_orders');
    return rows;
  }

  async getOrderItemsByOrderCode(orderCode) {
    const pool = await this.pool;
    await ensureUtf8Charset(pool);
    const [rows] = await pool.query(
      'SELECT * FROM old_order_items WHERE order_code = ?',
      [orderCode]
    );
    return rows;
  }

  async getAllRawOrders() {
    const pool = await this.pool;
    await ensureUtf8Charset(pool);
    const [rows] = await pool.query('SELECT * FROM raw_orders ORDER BY id');
    return rows;
  }

  async insertRawOrder(data) {
    const pool = await this.pool;
    await ensureUtf8Charset(pool);
    const [result] = await pool.query(
      `INSERT INTO raw_orders 
       (order_id, store_code, customer_phone, order_date, item_sku, item_name, qty, unit_price, currency, source_file)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.order_id,
        data.store_code,
        data.customer_phone,
        data.order_date,
        data.item_sku,
        data.item_name,
        data.qty,
        data.unit_price,
        data.currency,
        data.source_file,
      ]
    );
    return result.insertId;
  }
}
