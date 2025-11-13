import { getRabbit, publish } from './rabbit.js';
import { CFG } from './config.js';

async function run() {
  const { _conn, ch } = await getRabbit();
  const payload = {
    order_id: 'T-100',
    product_code: 'abc_00123 ',
    qty: '2',
    order_date: '12/11/2025',
    total_price: '10 USD',
    source: 'test'
  };
  await publish(ch, CFG.ROUTING.TRANSFORM, payload);
  console.log('Published test -> transform');
  await ch.close();
  await _conn.close();
}

run().catch(e => { console.error(e); process.exit(1); });