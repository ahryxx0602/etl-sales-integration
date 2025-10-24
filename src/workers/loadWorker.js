// src/workers/loadWorker.js
import { CFG } from '../config.js';
import { getRabbit } from '../rabbit.js';
import { getPool, getDWPool } from '../db.js';
import pino from 'pino';

const log = pino({ name: 'loadWorker' });

const pool = await getPool();     // etl_sales (staging)
const dw   = await getDWPool();   // etl_dw (star schema)

const { ch } = await getRabbit();
await ch.prefetch(50);

async function upsertStaging(line) {
  const sql = `
    INSERT INTO staging_order_lines
      (order_key, store_code, customer_phone, order_ts, item_sku, item_name, qty, unit_price, line_total, currency, source_tag)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      store_code=VALUES(store_code),
      customer_phone=VALUES(customer_phone),
      order_ts=VALUES(order_ts),
      item_name=VALUES(item_name),
      qty=VALUES(qty),
      unit_price=VALUES(unit_price),
      line_total=VALUES(line_total),
      currency=VALUES(currency),
      source_tag=VALUES(source_tag)
  `;
  const args = [
    line.order_key, line.store_code, line.customer_phone, line.order_ts,
    line.item_sku, line.item_name, line.qty, line.unit_price, line.line_total,
    line.currency, line.source_tag,
  ];
  await pool.query(sql, args);
}

/** Helpers cho DW (MySQL trick: lấy key kể cả khi tồn tại) **/
async function upsertDimStore(store_code) {
  const [r] = await dw.query(
    `INSERT INTO dim_store (store_code) VALUES (?)
     ON DUPLICATE KEY UPDATE store_key = LAST_INSERT_ID(store_key)`,
    [store_code]
  );
  return r.insertId; // store_key
}

async function upsertDimProduct(item_sku, item_name = null) {
  const [r] = await dw.query(
    `INSERT INTO dim_product (item_sku, item_name) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE
       item_name = COALESCE(VALUES(item_name), item_name),
       product_key = LAST_INSERT_ID(product_key)`,
    [item_sku, item_name]
  );
  return r.insertId; // product_key
}

function toDateKey(order_ts) {
  // order_ts là 'YYYY-MM-DD HH:mm:ss'
  const d = order_ts.slice(0, 10).replace(/-/g, ''); // 'YYYYMMDD'
  return Number(d);
}

async function upsertDimDate(order_ts) {
  const date = order_ts.slice(0, 10); // 'YYYY-MM-DD'
  const [_row] = await dw.query(
    `INSERT INTO dim_date (date_key, date_value, year, month, day, dow, month_name)
     VALUES (
       DATE_FORMAT(?, '%Y%m%d')+0,
       DATE(?),
       YEAR(?),
       MONTH(?),
       DAY(?),
       DAYOFWEEK(?),
       DATE_FORMAT(?, '%b')
     )
     ON DUPLICATE KEY UPDATE
       date_value = VALUES(date_value)`,
    [date, date, date, date, date, date, date]
  );
  // date_key = YYYYMMDD
  return Number(date.replace(/-/g, ''));
}

async function insertFact(line) {
  const store_code = String(line.store_code || '').trim().toUpperCase();
  const product_sku = String(line.item_sku || '').trim();
  const product_name = line.item_name ?? null;
  const date_key = toDateKey(line.order_ts);

  // Upsert dimensions (lấy keys)
  const [store_key, product_key] = await Promise.all([
    upsertDimStore(store_code),
    upsertDimProduct(product_sku, product_name),
    upsertDimDate(line.order_ts) // đảm bảo tồn tại
  ]).then(([s, p]) => [s, p]);

  // Idempotent theo (order_key, product_key)
  await dw.query(
    `INSERT INTO fact_sales
      (order_key, date_key, store_key, product_key, qty, line_total, currency, source_tag, order_ts)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       qty = VALUES(qty),
       line_total = VALUES(line_total),
       currency = VALUES(currency),
       source_tag = VALUES(source_tag),
       order_ts = VALUES(order_ts)`,
    [
      line.order_key, date_key, store_key, product_key,
      line.qty, line.line_total, line.currency, line.source_tag, line.order_ts
    ]
  );
}

ch.consume(
  CFG.QUEUES.LOAD,
  async (msg) => {
    if (!msg) return;
    const line = JSON.parse(msg.content.toString());
    try {
      // 1) Lưu staging (etl_sales)
      await upsertStaging(line);

      // 2) Đổ vào Star Schema (etl_dw)
      await insertFact(line);

      ch.ack(msg);
      log.info({ order_key: line.order_key, sku: line.item_sku }, '[load] staging + star DW ok');
    } catch (e) {
      log.error(e, 'load failed');
      ch.nack(msg, false, false); // DLQ
    }
  },
  { noAck: false }
);

log.info('loadWorker started');
