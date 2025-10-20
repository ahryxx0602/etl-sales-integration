import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CFG = {
  RABBIT_URL: process.env.RABBIT_URL,
  MYSQL: {
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS || '',
    database: process.env.MYSQL_DB,
  },
  CSV_DIR: path.resolve(__dirname, '..', process.env.CSV_DIR || 'data'),
  EXCHANGE: 'sales.etl',
  ROUTING: {
    VALIDATE: 'validate',
    TRANSFORM: 'transform',
    LOAD: 'load',
    DLQ: 'dlq',
  },
  QUEUES: {
    VALIDATE: 'etl.validate',
    TRANSFORM: 'etl.transform',
    LOAD: 'etl.load',
    DLQ: 'etl.dlq',
  }
};
