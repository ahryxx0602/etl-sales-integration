// src/workers/transformWorker.js
import fs from 'fs';
import path from 'path';
import pino from 'pino';
import { getRabbit, publish } from '../rabbit.js';
import { CFG } from '../config.js';

const log = pino({ name: 'transformWorker' });

/** --- Load Category Map --- **/
const categoryMapPath = path.resolve('./config/category-map.json');
let categoryMap = {};
if (fs.existsSync(categoryMapPath)) {
  categoryMap = JSON.parse(fs.readFileSync(categoryMapPath, 'utf8'));
  log.info(`✅ Đã load ${Object.keys(categoryMap).length} category map`);
} else {
  log.warn('⚠️ Không tìm thấy file category map, mặc định category = "Khác"');
}

/** --- Kết nối RabbitMQ --- **/
const { ch } = await getRabbit();
await ch.prefetch(20);

/** --- Helper: chuẩn hoá dữ liệu --- **/
function normalizeCurrency(value) {
  if (!value) return 0;
  // Loại bỏ ký tự không phải số, dấu chấm, dấu trừ
  const v = parseFloat(String(value).replace(/[^\d.-]/g, ''));
  return isNaN(v) ? 0 : +v.toFixed(2);
}

function normalizeDate(dateStr) {
  if (!dateStr) return null;
  // Hỗ trợ định dạng dd/MM/yyyy hoặc dd-MM-yyyy
  const parts = dateStr.includes('/')
    ? dateStr.split('/')
    : dateStr.split('-');
  let d;
  if (parts.length >= 3) {
    const [day, month, rest] = parts;
    const [year, time] = rest.split(' ');
    d = new Date(`${year}-${month}-${day} ${time || '00:00'}`);
  } else {
    d = new Date(dateStr);
  }
  return isNaN(d.getTime())
    ? null
    : d.toISOString().slice(0, 19).replace('T', ' ');
}

function mapCategory(item_name = '') {
  const name = item_name.toLowerCase();
  for (const [key, cat] of Object.entries(categoryMap)) {
    if (name.includes(key.toLowerCase())) return cat;
  }
  log.warn(`⚠️ Không tìm thấy category cho: ${item_name}`);
  return 'Khác';
}

/** --- Worker chính --- **/
ch.consume(
  CFG.QUEUES.TRANSFORM,
  async (msg) => {
    if (!msg) return;
    try {
      const r = JSON.parse(msg.content.toString());

      // --- Chuẩn hoá dữ liệu ---
      const order_ts = normalizeDate(r.order_date);
      const qty = Number(r.qty) || 0;
      const unit_price = normalizeCurrency(r.unit_price);
      const line_total = +(qty * unit_price).toFixed(2);
      const category = mapCategory(r.item_name || '');

      // --- Tính các trường bổ sung ---
      const order_line_id = `${r.order_id}-${r.item_sku}`;
      const total_price = line_total;

      // --- Dữ liệu chuẩn cuối cùng ---
      const transformed = {
        order_key: `${r.order_id}|${r.source_tag}`,
        order_line_id,
        store_code: (r.store_code || '').trim(),
        customer_phone: r.customer_phone || null,
        order_ts,
        item_sku: (r.item_sku || '').trim(),
        item_name: r.item_name || null,
        qty,
        unit_price,
        line_total,
        total_price,
        category,
        currency: (r.currency || 'VND').toUpperCase(),
        source_tag: r.source_tag,
      };

      // --- Gửi qua hàng đợi load ---
      await publish(ch, CFG.ROUTING.LOAD, transformed);
      ch.ack(msg);

      log.info(`[transform] OK → ${transformed.order_key} | ${transformed.item_name} | ${transformed.category}`);
    } catch (e) {
      log.error(e, '❌ transform failed');
      ch.nack(msg, false, false); // Gửi vào DLQ (dead-letter queue)
    }
  },
  { noAck: false }
);

log.info('transformWorker started');
