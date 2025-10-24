import amqp from 'amqplib';
import { CFG } from './config.js';

export async function getRabbit() {
  const _conn = await amqp.connect(CFG.RABBIT_URL);
  const ch = await _conn.createChannel();

  // exchange chính + DLX
  await ch.assertExchange(CFG.EXCHANGE, 'direct', { durable: true });
  await ch.assertExchange(`${CFG.EXCHANGE}.dlx`, 'fanout', { durable: true });

  // khai báo queues + bind
  await ch.assertQueue(CFG.QUEUES.VALIDATE, {
    durable: true,
    deadLetterExchange: `${CFG.EXCHANGE}.dlx`
  });
  await ch.assertQueue(CFG.QUEUES.TRANSFORM, {
    durable: true,
    deadLetterExchange: `${CFG.EXCHANGE}.dlx`
  });
  await ch.assertQueue(CFG.QUEUES.LOAD, {
    durable: true,
    deadLetterExchange: `${CFG.EXCHANGE}.dlx`
  });
  await ch.assertQueue(CFG.QUEUES.DLQ, { durable: true });

  await ch.bindQueue(CFG.QUEUES.VALIDATE, CFG.EXCHANGE, CFG.ROUTING.VALIDATE);
  await ch.bindQueue(CFG.QUEUES.TRANSFORM, CFG.EXCHANGE, CFG.ROUTING.TRANSFORM);
  await ch.bindQueue(CFG.QUEUES.LOAD, CFG.EXCHANGE, CFG.ROUTING.LOAD);

  await ch.bindQueue(CFG.QUEUES.DLQ, `${CFG.EXCHANGE}.dlx`, '');

  return { _conn, ch };
}

export async function publish(ch, routingKey, payload) {
  const ok = ch.publish(
    CFG.EXCHANGE,
    routingKey,
    Buffer.from(JSON.stringify(payload)),
    { persistent: true, contentType: 'application/json' }
  );
  if (!ok) console.warn('Publish backpressure:', routingKey);
}
