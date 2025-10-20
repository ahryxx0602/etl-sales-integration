import { getPool } from '../db.js';
import { getRabbit, publish } from '../rabbit.js';
import { CFG } from '../config.js';
import pino from 'pino';

const log = pino({ name: 'db_ingest' });
const pool = await getPool();
const { conn, ch } = await getRabbit();

try {
  const [rows] = await pool.query(
    'SELECT order_id, store_code, customer_phone, order_date, item_sku, item_name, qty, unit_price, currency, source_tag FROM source_pos_orders ORDER BY id DESC LIMIT 500'
  );
  for (const r of rows) {
    await publish(ch, CFG.ROUTING.VALIDATE, { type: 'row', ...r });
  }
  log.info({ count: rows.length }, 'queued rows from DB');
} finally {
  await ch.close(); await conn.close();
  await pool.end();
}
