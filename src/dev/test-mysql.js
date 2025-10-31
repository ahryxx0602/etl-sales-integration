import mysql from 'mysql2/promise';
import { CFG } from '../config.js';  // sửa đường dẫn

async function test() {
  try {
    const pool = mysql.createPool(CFG.MYSQL);
    const [rows] = await pool.query('SELECT 1');
    console.log('✅ MySQL connected:', rows);
    await pool.end();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err);
  }
}

test();
