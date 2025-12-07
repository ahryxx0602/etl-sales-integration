/**
 * Main ETL Service - Facade pattern để orchestrate các services con
 * 
 * Chịu trách nhiệm:
 * - Orchestrate các bước ETL: Extract, Transform, Load
 * - Cung cấp interface đơn giản cho controllers
 * - Delegate các operations đến sub-services
 * 
 * @class EtlService
 */
import { ExtractService } from './ExtractService.js';
import { LoadService } from './LoadService.js';
import { ProcessService } from './ProcessService.js';

export class EtlService {
  /**
   * Tạo instance EtlService
   * @param {OldDbModel} oldDbModel - Model để query old_db
   * @param {NewDbModel} newDbModel - Model để query new_db
   * @param {TransformService} transformService - Service để transform dữ liệu
   * @param {LookupService} lookupService - Service để lookup reference data
   * @param {RabbitMQService} rabbitMQService - Service để publish messages
   * @param {Logger} logger - Pino logger instance
   */
  constructor(oldDbModel, newDbModel, transformService, lookupService, rabbitMQService, logger) {
    // Tạo các sub-services
    this.extractService = new ExtractService(oldDbModel, lookupService, rabbitMQService, logger);
    this.loadService = new LoadService(newDbModel, rabbitMQService, logger);
    this.processService = new ProcessService(
      this.extractService,
      transformService,
      this.loadService,
      oldDbModel,
      rabbitMQService,
      logger
    );
    
    this.log = logger.child({ name: 'EtlService' });
  }

  /**
   * Extract dữ liệu từ old_db
   * @returns {Promise<Array>} Dữ liệu đã extract
   */
  async extractFromOldDb() {
    return this.extractService.extractFromOldDb();
  }

  /**
   * Extract dữ liệu từ CSV
   * @param {Array} csvData - Dữ liệu từ CSV file
   * @param {string} sourceFile - Tên file CSV
   * @returns {Promise<Array>} Dữ liệu đã extract
   */
  async extractFromCsv(csvData, sourceFile) {
    return this.extractService.extractFromCsv(csvData, sourceFile);
  }

  /**
   * Validate và transform dữ liệu
   * @param {Array} rawData - Dữ liệu thô
   * @returns {Promise<{valid: Array, invalid: Array}>} Kết quả validate và transform
   */
  async validateAndTransform(rawData) {
    return this.processService.validateAndTransform(rawData);
  }

  /**
   * Load dữ liệu vào new_db
   * @param {Array} validData - Dữ liệu đã validate
   * @returns {Promise<{success: number, errors: number}>} Kết quả load
   */
  async loadToNewDb(validData) {
    return this.loadService.loadToNewDb(validData);
  }

  /**
   * Log validation errors
   * @param {Array} invalidData - Dữ liệu không hợp lệ
   * @returns {Promise<void>}
   */
  async logValidationErrors(invalidData) {
    return this.loadService.logValidationErrors(invalidData);
  }

  /**
   * Xử lý ETL từ old_db
   * @returns {Promise<EtlProcessResult>} Kết quả ETL
   */
  async processOldDb() {
    return this.processService.processOldDb();
  }

  /**
   * Xử lý ETL từ CSV
   * @param {Array} csvData - Dữ liệu từ CSV
   * @param {string} sourceFile - Tên file CSV
   * @returns {Promise<EtlProcessResult>} Kết quả ETL
   */
  async processCsv(csvData, sourceFile) {
    return this.processService.processCsv(csvData, sourceFile);
  }

  /**
   * Xử lý ETL từ raw_orders
   * @returns {Promise<EtlProcessResult>} Kết quả ETL
   */
  async processRawOrders() {
    return this.processService.processRawOrders();
  }
}

