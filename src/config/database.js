import mysql from 'mysql2/promise';
import { config } from './config.js';

let oldDbPool = null;
let newDbPool = null;

export async function getOldDbPool() {
  if (!oldDbPool) {
    oldDbPool = mysql.createPool({
      ...config.OLD_DB,
      charset: 'utf8mb4',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return oldDbPool;
}

export async function getNewDbPool() {
  if (!newDbPool) {
    newDbPool = mysql.createPool({
      ...config.NEW_DB,
      charset: 'utf8mb4',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return newDbPool;
}

export async function closeConnections() {
  if (oldDbPool) {
    await oldDbPool.end();
    oldDbPool = null;
  }
  if (newDbPool) {
    await newDbPool.end();
    newDbPool = null;
  }
}

