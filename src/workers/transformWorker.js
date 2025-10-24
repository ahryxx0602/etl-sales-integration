// transformWorker.js
import { getRabbit, publish } from '../rabbit.js';
import { CFG } from '../config.js';
import pino from 'pino';
const log = pino({ name: 'transformWorker' });

function parseLocalDate(input) {
  const s = String(input).trim().replace('T',' ');
  // yyyy-mm-dd HH:mm[:ss]  hoặc  dd-mm-yyyy HH:mm[:ss]  hoặc có dấu '/' cũng được
  let m = s.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2}).*?(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
  let Y,M,D,h,i,sec;
  if (m) { [,Y,M,D,h,i,sec] = m; }
  else {
    m = s.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4}).*?(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
    if (!m) throw new Error('Bad date: '+input);
    [,D,M,Y,h,i,sec] = m;
  }
  const dt = new Date(+Y, +M-1, +D, +h, +i, +(sec||0)); // local time
  const pad = n => String(n).padStart(2,'0');
  return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
}

function normCurrency(cur='VND') {
  // gom các biến thể: vnd, VNĐ, vnđ, 'VND '
  const x = String(cur).trim().toUpperCase().replaceAll('Đ','D');
  return x === 'VNĐ' ? 'VND' : x;
}

const { conn, ch } = await getRabbit();
await ch.prefetch(20);

ch.consume(CFG.QUEUES.TRANSFORM, async (msg) => {
  if (!msg) return;
  try {
    const r = JSON.parse(msg.content.toString());

    const qty = Number(r.qty) || 0;
    const price = Number(r.unit_price) || 0;

    const transformed = {
      order_key: `${r.order_id}|${r.source_tag}`,
      store_code: String(r.store_code||'').trim().toUpperCase(),
      customer_phone: r.customer_phone ?? null,
      order_ts: parseLocalDate(r.order_date),                // ✅
      item_sku: String(r.item_sku||'').trim(),
      item_name: r.item_name ?? null,
      qty,
      unit_price: +price.toFixed(2),
      line_total: +(qty*price).toFixed(2),
      currency: normCurrency(r.currency),                    // ✅
      source_tag: r.source_tag
    };

    await publish(ch, CFG.ROUTING.LOAD, transformed);
    ch.ack(msg);
  } catch (e) {
    log.error(e, 'transform failed');  // xem log lý do nếu còn rớt
    ch.nack(msg, false, false);        // vẫn gửi sang DLQ
  }
}, { noAck: false });

log.info('transformWorker started');
