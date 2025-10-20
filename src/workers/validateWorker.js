import { getRabbit, publish } from '../rabbit.js';
import { CFG } from '../config.js';
import pino from 'pino';
import { z } from 'zod';
import fs from 'node:fs';
import { parse } from 'csv-parse';

const log = pino({ name: 'validateWorker' });

const RowSchema = z.object({
  type: z.literal('row'),
  order_id: z.string().min(1),
  store_code: z.string().min(1),
  customer_phone: z.string().optional().nullable(),
  order_date: z.union([z.string(), z.date()]),
  item_sku: z.string().min(1),
  item_name: z.string().optional().nullable(),
  qty: z.number().int().or(z.string().transform(v => parseInt(v,10))),
  unit_price: z.number().or(z.string().transform(v => parseFloat(v))),
  currency: z.string().default('VND'),
  source_tag: z.string().default('csv')
});

const { conn, ch } = await getRabbit();
await ch.prefetch(10);

ch.consume(CFG.QUEUES.VALIDATE, async (msg) => {
  if (!msg) return;
  try {
    const body = JSON.parse(msg.content.toString());

    if (body.type === 'csv_file') {
      // stream file, push từng dòng dạng 'row'
      const parser = fs.createReadStream(body.path)
        .pipe(parse({ columns: true, trim: true }));

      for await (const rec of parser) {
        const payload = {
          type: 'row',
          order_id: String(rec.order_id ?? rec.orderId ?? '').trim(),
          store_code: String(rec.store_code ?? rec.store ?? '').trim(),
          customer_phone: rec.customer_phone ?? rec.phone ?? null,
          order_date: rec.order_date ?? rec.date,
          item_sku: String(rec.item_sku ?? rec.sku ?? '').trim(),
          item_name: rec.item_name ?? rec.name ?? null,
          qty: rec.qty,
          unit_price: rec.unit_price ?? rec.price,
          currency: rec.currency ?? 'VND',
          source_tag: body.source_tag ?? 'csv'
        };
        // validate nhanh; nếu lỗi, ném sang DLQ
        const parsed = RowSchema.parse(payload);
        await publish(ch, CFG.ROUTING.TRANSFORM, parsed);
      }

      ch.ack(msg);
      return;
    }

    if (body.type === 'row') {
      const parsed = RowSchema.parse(body);
      await publish(ch, CFG.ROUTING.TRANSFORM, parsed);
      ch.ack(msg);
      return;
    }

    throw new Error('unknown message type');

  } catch (e) {
    log.error(e, 'validation failed');
    ch.nack(msg, false, false); // gửi sang DLQ
  }
}, { noAck: false });

log.info('validateWorker started');
console.log('[validate] file/row OK → transform:', (body.type==='row'?body.order_id:body.path));
