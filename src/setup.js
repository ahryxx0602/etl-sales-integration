import { getRabbit } from './rabbit.js';
import { getPool } from './db.js';

const { conn, ch } = await getRabbit();
console.log('RabbitMQ ok');
const pool = await getPool();
await pool.query('SELECT 1');
console.log('MySQL ok');
await ch.close(); await conn.close(); process.exit(0);
