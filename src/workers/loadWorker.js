import { CFG } from '../config.js';
import { getRabbit } from '../rabbit.js';
import { getPool } from '../db.js';
import pino from 'pino';

const log = pino({ name: 'loadWorker' });
const pool = await getPool();
const { conn, ch } = await getRabbit();
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
      currency=VALUES(currency)
  `;
  const args = [
    line.order_key, line.store_code, line.customer_phone, line.order_ts,
    line.item_sku, line.item_name, line.qty, line.unit_price, line.line_total,
    line.currency, line.source_tag
  ];
  await pool.query(sql, args);
}

async function rollupDW(order_key) {
  const [rows] = await pool.query(
    `SELECT order_key, store_code, order_ts, currency, source_tag,
            SUM(qty) AS items, SUM(line_total) AS grand_total
     FROM staging_order_lines
     WHERE order_key = ?
     GROUP BY order_key, store_code, order_ts, currency, source_tag`,
    [order_key]
  );
  if (rows.length === 0) return;

  const r = rows[0];
  await pool.query(`
    INSERT INTO dw_sales (order_key, store_code, order_ts, items, grand_total, currency, source_tag)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      store_code=VALUES(store_code),
      order_ts=VALUES(order_ts),
      items=VALUES(items),
      grand_total=VALUES(grand_total),
      currency=VALUES(currency)
  `, [r.order_key, r.store_code, r.order_ts, r.items, r.grand_total, r.currency, r.source_tag]);
}

ch.consume(CFG.QUEUES.LOAD, async (msg) => {
  if (!msg) return;
  const line = JSON.parse(msg.content.toString());
  try {
    await upsertStaging(line);
    await rollupDW(line.order_key);
    ch.ack(msg);
  } catch (e) {
    log.error(e, 'load failed');
    ch.nack(msg, false, false);
  }
}, { noAck: false });

log.info('loadWorker started');
