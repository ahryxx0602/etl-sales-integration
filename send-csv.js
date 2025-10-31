// send-csv.js
import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { getRabbit } from './src/rabbit.js';
import { CFG } from './src/config.js';

// 🔧 Hàm làm sạch số
const cleanNumber = (v) => Number(String(v || '').replace(/[^\d.-]/g, '') || 0);

// 🔧 Chuẩn hóa ngày (đổi "/" → "-")
const normalizeDate = (s) => (s ? s.replace(/\//g, '-') : '');

async function main() {
  const csvArg = process.argv[2]; // Đường dẫn file CSV
  if (!csvArg) {
    console.error('❌ Usage: node send-csv.js <path_to_csv>');
    process.exit(1);
  }

  const filePath = path.resolve(csvArg);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`📤 Sending records from: ${filePath}`);

  // Kết nối RabbitMQ
  const { ch } = await getRabbit();
  await ch.assertQueue(CFG.QUEUES.LOAD, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': `${CFG.EXCHANGE}.dlx`,
    },
  });

  // Đọc CSV
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let count = 0;
  for await (const line of rl) {
    if (!line.trim() || line.startsWith('order_key')) continue;

    // ⚠️ Sửa lại: CSV phân cách bằng dấu phẩy
    const [
      order_key,
      order_line_id,
      store_code,
      customer_phone,
      order_ts,
      item_sku,
      item_name,
      qty,
      unit_price,
      line_total,
      currency,
      source_tag,
    ] = line.split(',');

    // Tạo message chuẩn
    const msg = {
      order_key,
      order_line_id: Number(order_line_id) || null,
      store_code,
      customer_phone,
      order_ts: normalizeDate(order_ts),
      item_sku,
      item_name,
      category: 'Unknown',
      qty: cleanNumber(qty),
      unit_price: cleanNumber(unit_price),
      line_total: cleanNumber(line_total),
      currency,
      source_tag,
    };

    // Gửi vào queue
    ch.sendToQueue(CFG.QUEUES.LOAD, Buffer.from(JSON.stringify(msg)), {
      persistent: true,
    });

    count++;
  }

  console.log(`✅ ${count} message(s) sent to queue "${CFG.QUEUES.LOAD}"`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
