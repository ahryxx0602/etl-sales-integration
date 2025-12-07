import { parsePagination, formatPaginationResponse } from '../middleware/pagination.js';
import createError from 'http-errors';

/**
 * Controller xử lý các request query data
 * 
 * Chịu trách nhiệm:
 * - Query dữ liệu từ Data Warehouse
 * - Xử lý pagination
 * - Trả về response JSON
 * 
 * @class DataController
 */
export class DataController {
  /**
   * Tạo instance DataController
   * @param {NewDbModel} newDbModel - Model để query data
   * @param {Logger} logger - Pino logger instance
   */
  constructor(newDbModel, logger) {
    this.newDbModel = newDbModel;
    this.log = logger.child({ name: 'DataController' });
  }

  /**
   * GET /api/etl/stats
   * Lấy thống kê tổng quan
   */
  async getStats(req, res) {
    const stats = await this.newDbModel.getStats();
    res.json({
      success: true,
      data: stats,
    });
  }

  /**
   * GET /api/etl/logs
   * Lấy danh sách ETL logs với pagination và filtering
   */
  async getLogs(req, res) {
    const { limit, offset } = parsePagination(req);
    const status = req.query.status || null;
    
    const result = await this.newDbModel.getLogs(limit, offset, status);
    res.json(formatPaginationResponse(result.data, result.total, limit, offset));
  }

  /**
   * GET /api/etl/stores
   * Lấy danh sách stores với pagination
   */
  async getStores(req, res) {
    const { limit, offset } = parsePagination(req);
    const result = await this.newDbModel.getStores(limit, offset);
    res.json(formatPaginationResponse(result.data, result.total, limit, offset));
  }

  /**
   * GET /api/etl/customers
   * Lấy danh sách customers với pagination
   */
  async getCustomers(req, res) {
    const { limit, offset } = parsePagination(req);
    const result = await this.newDbModel.getCustomers(limit, offset);
    res.json(formatPaginationResponse(result.data, result.total, limit, offset));
  }

  /**
   * GET /api/etl/products
   * Lấy danh sách products với pagination
   */
  async getProducts(req, res) {
    const { limit, offset } = parsePagination(req);
    const result = await this.newDbModel.getProducts(limit, offset);
    res.json(formatPaginationResponse(result.data, result.total, limit, offset));
  }

  /**
   * GET /api/etl/orders
   * Lấy danh sách orders với pagination
   */
  async getOrders(req, res) {
    const { limit, offset } = parsePagination(req);
    const result = await this.newDbModel.getOrders(limit, offset);
    res.json(formatPaginationResponse(result.data, result.total, limit, offset));
  }

  /**
   * GET /api/etl/order-items
   * Lấy danh sách order items với pagination
   */
  async getOrderItems(req, res) {
    const { limit, offset } = parsePagination(req);
    const result = await this.newDbModel.getOrderItems(limit, offset);
    res.json(formatPaginationResponse(result.data, result.total, limit, offset));
  }
}
