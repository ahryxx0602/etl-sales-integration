import mysql from 'mysql2/promise';
import { CFG } from './config.js';

export async function getPool() {
  return mysql.createPool({
    ...CFG.MYSQL,
    waitForConnections: true,
    connectionLimit: 10,
  });
}
