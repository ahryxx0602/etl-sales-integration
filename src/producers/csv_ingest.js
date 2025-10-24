import fs from 'node:fs';
import path from 'node:path';
import { CFG } from '../config.js';
import { getRabbit, publish } from '../rabbit.js';
import pino from 'pino';

const log = pino({ name: 'csv_ingest' });

const dir = CFG.CSV_DIR;

const { _conn, ch } = await getRabbit();
try {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.csv'));
  for (const f of files) {
    const full = path.join(dir, f);
    const msg = {
      type: 'csv_file',
      path: full,
      source_tag: 'csv',
      detected_at: new Date().toISOString()
    };
    await publish(ch, CFG.ROUTING.VALIDATE, msg);
    log.info({ file: full }, 'queued file for validate');
  }
} finally {
  await ch.close(); await _conn.close();
}
