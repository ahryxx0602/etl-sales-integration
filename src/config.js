import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CFG = {
  // RabbitMQ
  RABBIT_URL: process.env.RABBIT_URL,

  // MySQL
  MYSQL: {
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS || '',
    // ưu tiên DB DW nếu có
    database: process.env.MYSQL_DB_DW || process.env.MYSQL_DB,
  },

  // CSV directory
  CSV_DIR: path.resolve(__dirname, '..', process.env.CSV_DIR || 'data'),

  // RabbitMQ exchange + routing
  EXCHANGE: 'sales.etl',
  ROUTING: {
    VALIDATE: 'validate',
    TRANSFORM: 'transform',
    LOAD: 'load',
    DLQ: 'dlq',
    CLEAN: 'clean' // thêm routing key cho clean
  },
  QUEUES: {
    VALIDATE: 'etl.validate',
    TRANSFORM: 'etl.transform',
    LOAD: 'etl.load',
    DLQ: 'etl.dlq',
<<<<<<< HEAD
  },
=======
    CLEAN: 'clean_data_queue' // thêm queue clean
  }
>>>>>>> main
};
