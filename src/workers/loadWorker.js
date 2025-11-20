// src/workers/loadWorker.js
import { CFG } from '../config.js';
import { getRabbit } from '../rabbit.js';
import { getPool, getDWPool } from '../db.js';
import pino from 'pino';

const log = pino({ name: 'loadWorker' });

const pool = await getPool(); // etl_sales (staging)
const dw = await getDWPool(); // etl_dw (data warehouse)

const { ch } = await getRabbit();
await ch.prefetch(50);

/** 🧱 1️⃣ Upsert staging (etl_sales) **/
async function upsertStaging(line) {
  const sql = `
    INSERT INTO staging_order_lines
      (order_key, order_line_id, store_code, customer_phone, order_ts, item_sku, item_name, category, qty, unit_price, line_total, currency, source_tag)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      store_code=VALUES(store_code),
      customer_phone=VALUES(customer_phone),
      order_ts=VALUES(order_ts),
      item_name=VALUES(item_name),
      category=VALUES(category),
      qty=VALUES(qty),
      unit_price=VALUES(unit_price),
      line_total=VALUES(line_total),
      currency=VALUES(currency),
      source_tag=VALUES(source_tag)
  `;
  const args = [
    line.order_key,
    line.order_line_id,
    line.store_code,
    line.customer_phone,
    line.order_ts,
    line.item_sku,
    line.item_name,
    line.category,
    line.qty,
    line.unit_price,
    line.line_total,
    line.currency,
    line.source_tag
  ];

  await pool.query(sql, args);
}

/** 🧭 2️⃣ Upsert Dimension — STORE **/
async function upsertDimStore(store_code) {
  const [r] = await dw.query(
    `INSERT INTO dim_store (store_code)
     VALUES (?)
     ON DUPLICATE KEY UPDATE store_key = LAST_INSERT_ID(store_key)`,
    [store_code]
  );
  return r.insertId; // store_key
}

/** 🧭 3️⃣ Upsert Dimension — PRODUCT **/
async function upsertDimProduct(item_sku, item_name = null, category = null) {
  const [r] = await dw.query(
    `INSERT INTO dim_product (item_sku, item_name, category)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       item_name = COALESCE(VALUES(item_name), item_name),
       category = COALESCE(VALUES(category), category),
       product_key = LAST_INSERT_ID(product_key)`,
    [item_sku, item_name, category]
  );
  return r.insertId; // product_key
}

/** 🧭 4️⃣ Upsert Dimension — DATE **/
function toDateKey(order_ts) {
  const d = order_ts.slice(0, 10).replace(/-/g, ''); // 'YYYYMMDD'
  return Number(d);
}

async function upsertDimDate(order_ts) {
  const date = order_ts.slice(0, 10); // 'YYYY-MM-DD'

  await dw.query(
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
     ON DUPLICATE KEY UPDATE date_value = VALUES(date_value)`,
    [date, date, date, date, date, date, date]
  );

  return Number(date.replace(/-/g, ''));
}

/** 🚀 5️⃣ Insert Fact_Sales **/
async function insertFact(line) {
  const store_code = String(line.store_code || '').trim().toUpperCase();
  const product_sku = String(line.item_sku || '').trim();
  const product_name = line.item_name ?? null;
  const date_key = toDateKey(line.order_ts);

  const store_key = await upsertDimStore(store_code);
  const product_key = await upsertDimProduct(product_sku, product_name, line.category);
  await upsertDimDate(line.order_ts);

  await dw.query(
    `INSERT INTO fact_sales
      (order_key, order_line_id, date_key, store_key, product_key, qty, line_total, currency, source_tag, order_ts)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       qty = VALUES(qty),
       line_total = VALUES(line_total),
       currency = VALUES(currency),
       source_tag = VALUES(source_tag),
       order_ts = VALUES(order_ts)`,
    [
      line.order_key,
      line.order_line_id,
      date_key,
      store_key,
      product_key,
      line.qty,
      line.line_total,
      line.currency,
      line.source_tag,
      line.order_ts
    ]
  );
}

/** ⚙️ Worker consume queue **/
ch.consume(
  CFG.QUEUES.LOAD,
  async (msg) => {
    if (!msg) return;
    const line = JSON.parse(msg.content.toString());

    // Nếu order_line_id bị null => tạo tự động
    if (!line.order_line_id) {
      line.order_line_id = `${line.order_key}-${Date.now()}`;
    }

    try {
      await upsertStaging(line);
      await insertFact(line);
      ch.ack(msg);

      log.info({ order_key: line.order_key, sku: line.item_sku }, '[load] staging + DW ok');
    } catch (e) {
      log.error(e, 'load failed');
      ch.nack(msg, false, false); // gửi vào DLQ
    }
  },
  { noAck: false }
);

log.info('loadWorker started');
