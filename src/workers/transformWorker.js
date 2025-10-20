import { getRabbit, publish } from '../rabbit.js';
import { CFG } from '../config.js';
import pino from 'pino';

const log = pino({ name: 'transformWorker' });

const { conn, ch } = await getRabbit();
await ch.prefetch(20);

ch.consume(CFG.QUEUES.TRANSFORM, async (msg) => {
  if (!msg) return;
  try {
    const r = JSON.parse(msg.content.toString());

    // chuẩn hoá
    const order_ts = new Date(r.order_date);
    if (isNaN(order_ts.getTime())) throw new Error('Bad date');

    const qty = Number(r.qty) || 0;
    const price = Number(r.unit_price) || 0;
    const line_total = +(qty * price).toFixed(2);

    const transformed = {
      order_key: `${r.order_id}|${r.source_tag}`,
      store_code: r.store_code.trim(),
      customer_phone: r.customer_phone ?? null,
      order_ts: order_ts.toISOString().slice(0,19).replace('T',' '),
      item_sku: r.item_sku.trim(),
      item_name: r.item_name ?? null,
      qty,
      unit_price: +price.toFixed(2),
      line_total,
      currency: (r.currency || 'VND').toUpperCase(),
      source_tag: r.source_tag
    };

    await publish(ch, CFG.ROUTING.LOAD, transformed);
    ch.ack(msg);
  } catch (e) {
    log.error(e, 'transform failed');
    ch.nack(msg, false, false);
  }
}, { noAck: false });

log.info('transformWorker started');
console.log('[transform] → load:', transformed.order_key);
