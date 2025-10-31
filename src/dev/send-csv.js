import fs from 'fs';
import readline from 'readline';
import { getRabbit } from './rabbit.js';
import { CFG } from './config.js';

async function main() {
  const { ch } = await getRabbit();
  await ch.assertQueue(CFG.QUEUES.LOAD, { durable: true });

  const fileStream = fs.createReadStream('./dev/send.test');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let count = 0;
  for await (const line of rl) {
    if (!line.trim() || line.startsWith('order_key')) continue; // bỏ header hoặc dòng rỗng

    const [
      order_key, order_line_id, store_code, customer_phone, order_ts,
      item_sku, item_name, qty, unit_price, line_total, currency, source_tag
    ] = line.split('\t'); // nếu file dùng tab, đổi thành ',' nếu CSV

    const msg = {
      order_key,
      order_line_id: Number(order_line_id),
      store_code,
      customer_phone,
      order_ts,
      item_sku,
      item_name,
      category: 'Unknown', // nếu file chưa có cột category
      qty: Number(qty),
      unit_price: Number(unit_price),
      line_total: Number(line_total),
      currency,
      source_tag
    };

    ch.sendToQueue(CFG.QUEUES.LOAD, Buffer.from(JSON.stringify(msg)));
    count++;
  }

  console.log(`✅ ${count} message(s) sent to etl.load`);
  process.exit(0);
}

main().catch(console.error);
