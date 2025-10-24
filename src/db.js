// src/db.js
import mysql from 'mysql2/promise';
import 'dotenv/config';

let poolMain;
let poolDW;

export async function getPool() {
  if (!poolMain) {
    poolMain = mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASS || '',
      database: process.env.MYSQL_DB,        // etl_sales
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return poolMain;
}

export async function getDWPool() {
  if (!poolDW) {
    poolDW = mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASS || '',
      database: process.env.MYSQL_DB_DW || 'etl_dw',  // etl_dw
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return poolDW;
}
