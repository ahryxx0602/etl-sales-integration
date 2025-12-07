import express from 'express';
import container from '../container/Container.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { paginationValidation, validatePagination } from '../middleware/pagination.js';
import { logsValidation, validateRequest } from '../middleware/validators.js';

const router = express.Router();

/**
 * @swagger
 * /api/etl/stats:
 *   get:
 *     summary: Lấy thống kê tổng quan
 *     tags: [Data Query]
 *     responses:
 *       200:
 *         description: Thống kê tổng quan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     stores:
 *                       type: number
 *                     customers:
 *                       type: number
 *                     products:
 *                       type: number
 *                     orders:
 *                       type: number
 *                     orderItems:
 *                       type: number
 *                     logs:
 *                       type: number
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const controller = await container.get('dataController');
  return controller.getStats(req, res);
}));

/**
 * @swagger
 * /api/etl/logs:
 *   get:
 *     summary: Lấy danh sách ETL logs với pagination và filtering
 *     tags: [Data Query]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *         description: Số lượng records
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Số records bỏ qua
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [success, error, validation_error]
 *         description: Lọc theo status
 *     responses:
 *       200:
 *         description: Danh sách logs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginationResponse'
 */
router.get('/logs', 
  logsValidation,
  validateRequest,
  asyncHandler(async (req, res) => {
    const controller = await container.get('dataController');
    return controller.getLogs(req, res);
  })
);

/**
 * GET /api/etl/stores
 * Lấy danh sách stores với pagination
 */
router.get('/stores',
  paginationValidation,
  validatePagination,
  asyncHandler(async (req, res) => {
    const controller = await container.get('dataController');
    return controller.getStores(req, res);
  })
);

/**
 * GET /api/etl/customers
 * Lấy danh sách customers với pagination
 */
router.get('/customers',
  paginationValidation,
  validatePagination,
  asyncHandler(async (req, res) => {
    const controller = await container.get('dataController');
    return controller.getCustomers(req, res);
  })
);

/**
 * GET /api/etl/products
 * Lấy danh sách products với pagination
 */
router.get('/products',
  paginationValidation,
  validatePagination,
  asyncHandler(async (req, res) => {
    const controller = await container.get('dataController');
    return controller.getProducts(req, res);
  })
);

/**
 * GET /api/etl/orders
 * Lấy danh sách orders với pagination
 */
router.get('/orders',
  paginationValidation,
  validatePagination,
  asyncHandler(async (req, res) => {
    const controller = await container.get('dataController');
    return controller.getOrders(req, res);
  })
);

/**
 * GET /api/etl/order-items
 * Lấy danh sách order items với pagination
 */
router.get('/order-items',
  paginationValidation,
  validatePagination,
  asyncHandler(async (req, res) => {
    const controller = await container.get('dataController');
    return controller.getOrderItems(req, res);
  })
);

export default router;

