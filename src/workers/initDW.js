import fs from 'fs/promises';
import path from 'path';
import { getDWPool } from '../db.js';
import pino from 'pino';

const log = pino({ name: 'initDW' });
const dw = await getDWPool();

async function runSQL(file) {
  const fullPath = path.resolve('sql', file);
  const content = await fs.readFile(fullPath, 'utf-8');
  log.info(`Running ${file}...`);
  await dw.query(content);
  log.info(`✅ Done: ${file}`);
}

async function main() {
  try {
    await runSQL('create_dw_schema.sql');
    await runSQL('create_views.sql');
    log.info('🎉 DW Schema initialized successfully!');
  } catch (err) {
    log.error(err, '❌ Failed to initialize DW schema');
  } finally {
    await dw.end();
  }
}

main();
