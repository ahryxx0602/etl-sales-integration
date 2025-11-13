import { getRabbit } from './rabbit.js';
import { CFG } from './config.js';

async function run() {
  const { _conn, ch } = await getRabbit();
  console.log('Listening on', CFG.QUEUES.CLEAN);
  await ch.consume(CFG.QUEUES.CLEAN, msg => {
    if (!msg) return;
    try {
      const data = JSON.parse(msg.content.toString());
      console.log('CLEAN MSG:', JSON.stringify(data, null, 2));
      ch.ack(msg);
    } catch (e) {
      console.error('consume error', e);
      ch.nack(msg, false, false);
    }
  }, { noAck: false });
}
run().catch(e => { console.error(e); process.exit(1); });