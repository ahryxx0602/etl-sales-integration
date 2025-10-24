import express from 'express';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3001;

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_DB,
});

app.get('/api/logs', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM etl_logs ORDER BY created_at DESC LIMIT 50');
  res.json(rows);
});

app.listen(port, () => console.log(`🚀 Dashboard server running: http://localhost:${port}`));
