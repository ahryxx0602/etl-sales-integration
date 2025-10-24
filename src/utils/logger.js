// src/utils/logger.js
import pino from 'pino';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_DB,
});

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: { colorize: true },
  },
});

export async function logToDB({ stage, status, message, data }) {
  try {
    await pool.query(
      `INSERT INTO etl_logs (stage, status, message, data, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [stage, status, message, JSON.stringify(data)]
    );
  } catch (err) {
    logger.error('❌ Lỗi ghi log vào MySQL:', err);
  }
}

export default logger;
