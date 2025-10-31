import amqp from 'amqplib';
import { CFG } from '../config.js';

async function test() {
  try {
    const conn = await amqp.connect(CFG.RABBIT_URL);
    const ch = await conn.createChannel();

    await ch.assertQueue(CFG.QUEUES.LOAD, {
      durable: true,
      arguments: { 'x-dead-letter-exchange': 'sales.etl.dlx' }
    });

    console.log('✅ RabbitMQ connected, queue:', CFG.QUEUES.LOAD);

    // Test gửi 1 message
    const testMsg = {
      order_key: 'O123',
      order_line_id: 1,
      store_code: 'S001',
      customer_phone: '0123456789',
      order_ts: '2025-10-30 10:00:00',
      item_sku: 'SKU001',
      item_name: 'Product A',
      category: 'Category 1',
      qty: 2,
      unit_price: 100,
      line_total: 200,
      currency: 'VND',
      source_tag: 'TEST'
    };

    await ch.sendToQueue(CFG.QUEUES.LOAD, Buffer.from(JSON.stringify(testMsg)), { persistent: true });
    console.log('✅ Test message sent to queue');

    await ch.close();
    await conn.close();
  } catch (err) {
    console.error('❌ RabbitMQ connection failed:', err);
  }
}

test();
