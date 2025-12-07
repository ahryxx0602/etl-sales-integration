import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const config = {
  // Database cũ (nguồn)
  OLD_DB: {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASS || '',
    database: 'old_db',
  },
  
  // Database mới (đích)
  NEW_DB: {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASS || '',
    database: 'new_db',
  },
  
  // CSV Directory
  CSV_DIR: path.resolve(__dirname, '..', '..', process.env.CSV_DIR || 'data'),
  
  // Server
  PORT: process.env.PORT || 3001,
  
  // RabbitMQ
  RABBITMQ: {
    url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    queues: {
      etlExtract: 'etl.extract',
      etlTransform: 'etl.transform',
      etlLoad: 'etl.load',
      etlComplete: 'etl.complete',
    },
    exchanges: {
      etl: 'etl.exchange',
    },
  },
};

