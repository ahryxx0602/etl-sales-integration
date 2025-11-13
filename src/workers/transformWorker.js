<<<<<<< HEAD
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
=======
import pino from 'pino';
import crypto from 'node:crypto';
import { getRabbit, publish } from '../rabbit.js';
import { CFG } from '../config.js';
import Redis from 'ioredis';

const log = pino({ name: 'transform_worker' });

// Tỷ giá mặc định (có thể override bằng CURRENCY_RATES env JSON)
const DEFAULT_RATES = { USD: 24000, EUR: 26000, JPY: 180, VND: 1 };
const ENV_RATES = (() => {
  try {
    return process.env.CURRENCY_RATES ? JSON.parse(process.env.CURRENCY_RATES) : null;
  } catch (e) {
    return null;
  }
})();
const RATES = { ...DEFAULT_RATES, ...(ENV_RATES || {}) };

// tạo client Redis (URL có thể đặt qua env REDIS_URL)
const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

// Chuẩn hoá ngày -> YYYY-MM-DD
function parseDateToIso(s) {
  if (!s) return null;
  const str = String(s).trim();
  const fmts = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
    /^\d{2}[-\/]\d{2}[-\/]\d{4}$/, // DD-MM-YYYY or DD/MM/YYYY
    /^\d{2}\.\d{2}\.\d{4}$/ // DD.MM.YYYY
  ];
  for (const re of fmts) {
    if (re.test(str)) {
      // handle slashes/dots
      const normalized = str.replace(/\//g, '-').replace(/\./g, '-');
      // try to convert DD-MM-YYYY -> YYYY-MM-DD
      if (/^\d{2}-\d{2}-\d{4}$/.test(normalized)) {
        const [d, m, y] = normalized.split('-');
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
      return normalized;
    }
  }
  // fallback: attempt Date parse
  const dt = new Date(str);
  if (!isNaN(dt.getTime())) {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return null;
}

// Extract số tiền và currency nếu có
function extractAmountAndCurrency(raw) {
  if (raw == null) return { value: null, currency: null };
  if (typeof raw === 'number') return { value: raw, currency: null };
  const s = String(raw).trim();
  if (s === '') return { value: null, currency: null };

  let cur = null;
  if (/[₫đ]|vnd/i.test(s)) cur = 'VND';
  else if (/\bUSD\b|\$/i.test(s)) cur = 'USD';
  else if (/\bEUR\b|€/i.test(s)) cur = 'EUR';
  else if (/\bJPY\b|¥/i.test(s)) cur = 'JPY';

  let num = s.replace(/[^\d,.\-]/g, '');
  const neg = num.startsWith('-');
  num = num.replace(/^-/, '');

  if (num.includes('.') && num.includes(',')) {
    if (num.lastIndexOf(',') > num.lastIndexOf('.')) {
      num = num.replace(/\./g, '').replace(',', '.');
    } else {
      num = num.replace(/,/g, '');
    }
  } else if (num.includes(',')) {
    const after = num.split(',').pop();
    if (after.length <= 2) num = num.replace(',', '.');
    else num = num.replace(/,/g, '');
  }
>>>>>>> main

  const v = parseFloat(num);
  if (isNaN(v)) return { value: null, currency: cur };
  return { value: neg ? -v : v, currency: cur };
}

// Chuẩn hoá SKU: uppercase, loại ký tự lạ, format LETTERS-NUM
function normalizeSku(sku) {
  if (!sku && sku !== 0) return null;
  let s = String(sku).trim().toUpperCase();
  s = s.replace(/[^A-Z0-9]/g, '');
  if (!s) return null;
  const m = s.match(/^([A-Z]+)0*([0-9]+)$/);
  if (m) return `${m[1]}-${m[2]}`;
  return s;
}

function hashKey(parts) {
  return crypto.createHash('sha256').update(parts.join('||')).digest('hex');
}

async function run() {
  const { _conn, ch } = await getRabbit();
  log.info('Transform worker ready, consuming:', CFG.QUEUES.TRANSFORM);

  // không dùng in-memory set => dùng Redis set để dedupe, và Redis INCR cho order counters
  const DEDUPE_KEY = 'etl:dedupe'; // set key
  const DEDUPE_TTL = 60 * 60 * 24; // giữ 24 giờ (tùy chỉnh)

  // consume messages from transform queue
  await ch.consume(CFG.QUEUES.TRANSFORM, async (msg) => {
    if (!msg) return;
    try {
      const raw = JSON.parse(msg.content.toString());
      // thực hiện transform
      const r = { ...raw };

      // order_date
      if (r.order_date || r.date || r.created_at) {
        r.order_date = parseDateToIso(r.order_date || r.date || r.created_at) || r.order_date;
      } else {
        r.order_date = null;
      }

      // sku
      r.product_code_clean = normalizeSku(r.product_code || r.sku || r.item_sku || r.sku_code);

      // quantity
      const qty = Number(r.quantity ?? r.qty ?? r.qty_order ?? 1) || 1;
      r.quantity = qty;

      // money -> total_vnd
      const amtRaw = r.total_price ?? r.amount ?? r.line_total ?? r.total;
      let { value: amtVal, currency: amtCur } = extractAmountAndCurrency(amtRaw);

      if (amtVal == null) {
        const unitRaw = r.unit_price ?? r.price;
        const { value: unitVal, currency: unitCur } = extractAmountAndCurrency(unitRaw);
        if (unitVal != null) {
          amtVal = unitVal * qty;
          amtCur = unitCur || amtCur;
        }
      }

      if (amtVal == null) {
        log.warn({ msg: raw }, 'missing amount, nack and ack to DLQ');
        // reject -> send to DLX by nack(false,false) to route to DLX configured
        ch.nack(msg, false, false);
        return;
      }

      const curCode = (amtCur || 'VND').toUpperCase();
      const rate = RATES[curCode] ?? 1;
      const totalVnd = Math.round(amtVal * rate * 100) / 100;
      r.total_price_vnd = totalVnd;
      r.currency = curCode;
      r.unit_price_vnd = qty ? Math.round((totalVnd / qty) * 100) / 100 : null;

      // order_line_id: incremental per order_id
      const orderId = r.order_id || r.orderKey || r.order_key || r.orderNumber || r.id || 'unknown';
      const cnt = (orderCounters.get(orderId) || 0) + 1;
      orderCounters.set(orderId, cnt);
      r.order_line_id = `${orderId}-${cnt}`;

      // dedupe: key gồm orderId, sku, date, qty, total_vnd
      const dedupeParts = [
        String(orderId),
        String(r.product_code_clean ?? ''),
        String(r.order_date ?? ''),
        String(Number.isInteger(qty) ? qty : qty),
        String(totalVnd)
      ];
      const hk = hashKey(dedupeParts);
      // SADD trả về 1 nếu add mới, 0 nếu đã tồn tại
      const added = await redis.sadd(DEDUPE_KEY, hk);
      if (added === 0) {
        log.info({ orderId, sku: r.product_code_clean }, 'duplicate (redis), ack and skip');
        ch.ack(msg);
        return;
      }
      // set TTL nếu chưa có
      const ttl = await redis.ttl(DEDUPE_KEY);
      if (ttl === -1) await redis.expire(DEDUPE_KEY, DEDUPE_TTL);

      // publish cleaned record vào routing CLEAN (queue clean_data_queue)
      await publish(ch, CFG.ROUTING.CLEAN, { type: 'clean_row', ...r });

      ch.ack(msg);
      log.info({ order_line_id: r.order_line_id }, 'processed and published clean record');
    } catch (err) {
      log.error({ err: String(err) }, 'processing failed, nack to DLX');
      try { ch.nack(msg, false, false); } catch (e) { /* ignore */ }
    }
  }, { noAck: false });

  // keep process alive
  process.once('SIGINT', async () => {
    log.info('Shutting down transform worker');
    await ch.close(); await _conn.close();
    await redis.quit();
    process.exit(0);
  });
}

run().catch(e => {
  console.error('transform_worker error', e);
  process.exit(1);
});