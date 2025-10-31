import { getRabbit, publish } from '../rabbit.js';
import { CFG } from '../config.js';

const { ch } = await getRabbit();

const path = process.argv[2];
const source_tag = process.argv[3] || 'csv';

if (!path) {
    console.error('Usage: node src/workers/extractWorker.js <file_path> <source_tag>');
    process.exit(1);
}

const msg = {
    type: 'csv_file',
    path,
    source_tag,
};

await publish(ch, CFG.ROUTING.VALIDATE, msg);
console.log(`[extract] Sent file → validate: ${path}`);
process.exit(0);
