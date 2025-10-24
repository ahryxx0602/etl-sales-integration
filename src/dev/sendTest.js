import { getRabbit, publish } from '../rabbit.js';
import { CFG } from '../config.js';

const { _conn, ch } = await getRabbit();
await publish(ch, CFG.ROUTING.VALIDATE, {
  type: '_row',
  order_id: 'TEST001',
  store_code: 'DN01',
  customer_phone: '0900000000',
  order_date: '2025-10-20 10:00:00',
  item_sku: 'SKU-DEMO',
  item_name: 'Adapter 65W',
  qty: 2,
  unit_price: 150000,
  currency: 'VND',
  source_tag: 'test'
});
console.log('✅ Sent test message');
await ch.close();
await _conn.close();
// trigger ci
