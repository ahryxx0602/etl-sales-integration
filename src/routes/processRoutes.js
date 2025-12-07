import express from 'express';
import container from '../container/Container.js';
import upload from '../middleware/upload.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * @swagger
 * /api/etl/process/old-db:
 *   post:
 *     summary: Xử lý ETL từ old_db
 *     tags: [ETL Processing]
 *     responses:
 *       200:
 *         description: ETL thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: ETL from old_db completed
 *                 result:
 *                   $ref: '#/components/schemas/EtlProcessResult'
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/old-db', asyncHandler(async (req, res) => {
  const controller = await container.get('etlController');
  return controller.processOldDb(req, res);
}));

/**
 * @swagger
 * /api/etl/process/csv:
 *   post:
 *     summary: Upload và xử lý CSV file
 *     tags: [ETL Processing]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               csvfile:
 *                 type: string
 *                 format: binary
 *                 description: CSV file cần upload
 *     responses:
 *       200:
 *         description: CSV processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 result:
 *                   $ref: '#/components/schemas/EtlProcessResult'
 *       400:
 *         description: No CSV file uploaded
 *       500:
 *         description: Lỗi server
 */
router.post('/csv', upload.single('csvfile'), asyncHandler(async (req, res) => {
  const controller = await container.get('etlController');
  return controller.processCsv(req, res);
}));

/**
 * POST /api/etl/process/csv-folder
 * Xử lý tất cả CSV files từ thư mục data
 */
router.post('/csv-folder', asyncHandler(async (req, res) => {
  const controller = await container.get('etlController');
  return controller.processCsvFromFolder(req, res);
}));

/**
 * POST /api/etl/process/raw-orders
 * Xử lý ETL từ raw_orders table
 */
router.post('/raw-orders', asyncHandler(async (req, res) => {
  const controller = await container.get('etlController');
  return controller.processRawOrders(req, res);
}));

export default router;

