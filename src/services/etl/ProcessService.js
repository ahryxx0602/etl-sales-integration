import { RABBITMQ_ROUTING_KEYS, SOURCE_TYPE, ETL_STATUS } from '../../constants/etlConstants.js';

/**
 * @typedef {import('../../types/etlTypes.js').RawOrderData} RawOrderData
 * @typedef {import('../../types/etlTypes.js').TransformedOrderData} TransformedOrderData
 * @typedef {import('../../types/etlTypes.js').InvalidDataItem} InvalidDataItem
 * @typedef {import('../../types/etlTypes.js').EtlProcessResult} EtlProcessResult
 */

/**
 * Service để xử lý và orchestrate các bước ETL
 * 
 * Chịu trách nhiệm:
 * - Orchestrate toàn bộ ETL pipeline: Extract → Validate → Transform → Load
 * - Xử lý dữ liệu từ nhiều nguồn: old_db, CSV, raw_orders
 * - Publish messages vào RabbitMQ để monitoring
 * 
 * @class ProcessService
 */
export class ProcessService {
  /**
   * Tạo instance ProcessService
   * @param {ExtractService} extractService - Service để extract dữ liệu
   * @param {TransformService} transformService - Service để transform dữ liệu
   * @param {LoadService} loadService - Service để load dữ liệu vào DW
   * @param {OldDbModel} oldDbModel - Model để tương tác với old_db
   * @param {RabbitMQService} rabbitMQService - Service để publish messages
   * @param {Logger} logger - Pino logger instance
   */
  constructor(extractService, transformService, loadService, oldDbModel, rabbitMQService, logger) {
    this.extractService = extractService;
    this.transformService = transformService;
    this.loadService = loadService;
    this.oldDbModel = oldDbModel;
    this.rabbitMQService = rabbitMQService;
    this.log = logger.child({ name: 'ProcessService' });
  }

  /**
   * Validate và transform dữ liệu thô
   * 
   * @param {Array<RawOrderData>} rawData - Dữ liệu thô từ extract
   * @returns {Promise<{valid: Array<TransformedOrderData>, invalid: Array<InvalidDataItem>}>}
   *   Kết quả validate và transform
   */
  async validateAndTransform(rawData) {
    const results = {
      valid: [],
      invalid: [],
    };

    for (const row of rawData) {
      const result = this.transformService.transformOrderData(row, row.source_type || SOURCE_TYPE.OLD_DB);
      
      if (result.valid) {
        results.valid.push(result.data);
      } else {
        results.invalid.push({
          raw_data: row,
          errors: result.errors,
        });
      }
    }

    // Gửi message vào RabbitMQ queue sau khi transform
    try {
      await this.rabbitMQService.publishMessage(RABBITMQ_ROUTING_KEYS.TRANSFORM, {
        validCount: results.valid.length,
        invalidCount: results.invalid.length,
        timestamp: new Date().toISOString(),
        sampleValid: results.valid.slice(0, 5), // Sample data
      });
    } catch (rabbitMQError) {
      this.log.warn({ error: rabbitMQError }, 'Failed to send transform message to RabbitMQ');
    }

    return results;
  }

  /**
   * Xử lý ETL từ old_db
   * 
   * Quy trình:
   * 1. Extract dữ liệu từ old_orders và old_order_items
   * 2. Validate và transform dữ liệu
   * 3. Log validation errors (nếu có)
   * 4. Load dữ liệu hợp lệ vào new_db
   * 5. Publish message hoàn thành vào RabbitMQ
   * 
   * @returns {Promise<EtlProcessResult>} Kết quả xử lý ETL
   */
  async processOldDb() {
    try {
      // Extract
      const rawData = await this.extractService.extractFromOldDb();
      
      // Validate & Transform
      const { valid, invalid } = await this.validateAndTransform(rawData);
      
      // Log validation errors
      if (invalid.length > 0) {
        await this.loadService.logValidationErrors(invalid);
      }
      
      // Load valid data
      const loadResult = await this.loadService.loadToNewDb(valid);
      
      const result = {
        extracted: rawData.length,
        valid: valid.length,
        invalid: invalid.length,
        loaded: loadResult.success,
        errors: loadResult.errors,
      };
      
      // Gửi message hoàn thành job
      try {
        await this.rabbitMQService.publishMessage(RABBITMQ_ROUTING_KEYS.COMPLETE_OLD_DB, {
          jobType: SOURCE_TYPE.OLD_DB,
          result,
          timestamp: new Date().toISOString(),
        });
      } catch (rabbitMQError) {
        this.log.warn({ error: rabbitMQError }, 'Failed to send complete message to RabbitMQ');
      }
      
      return result;
    } catch (error) {
      this.log.error({ error }, 'Error processing old_db');
      
      // Gửi message lỗi
      try {
        await this.rabbitMQService.publishMessage(RABBITMQ_ROUTING_KEYS.COMPLETE_OLD_DB, {
          jobType: SOURCE_TYPE.OLD_DB,
          status: ETL_STATUS.ERROR,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      } catch (rabbitMQError) {
        this.log.warn({ error: rabbitMQError }, 'Failed to send error message to RabbitMQ');
      }
      
      throw error;
    }
  }

  /**
   * Xử lý ETL từ CSV file
   * 
   * Quy trình:
   * 1. Extract dữ liệu từ CSV records
   * 2. Lưu vào raw_orders table và lấy record_id
   * 3. Validate và transform dữ liệu
   * 4. Log validation errors (nếu có)
   * 5. Load dữ liệu hợp lệ vào new_db
   * 6. Publish message hoàn thành vào RabbitMQ
   * 
   * @param {Array<Object>} csvData - Dữ liệu từ CSV file
   * @param {string} sourceFile - Tên file CSV nguồn
   * @returns {Promise<EtlProcessResult>} Kết quả xử lý ETL
   */
  async processCsv(csvData, sourceFile) {
    try {
      // Extract
      const rawData = await this.extractService.extractFromCsv(csvData, sourceFile);
      
      // Save to raw_orders và cập nhật record_id
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        const insertId = await this.oldDbModel.insertRawOrder({
          order_id: row.order_code,
          store_code: row.store_code,
          customer_phone: row.customer_phone,
          order_date: row.order_date,
          item_sku: row.item_sku,
          item_name: row.item_name,
          qty: row.qty,
          unit_price: row.unit_price,
          currency: row.currency,
          source_file: sourceFile,
        });
        // Cập nhật record_id vào rawData để sử dụng khi log
        rawData[i].record_id = insertId;
      }
      
      // Validate & Transform
      const { valid, invalid } = await this.validateAndTransform(rawData);
      
      // Log validation errors
      if (invalid.length > 0) {
        await this.loadService.logValidationErrors(invalid);
      }
      
      // Load valid data
      const loadResult = await this.loadService.loadToNewDb(valid);
      
      const result = {
        extracted: rawData.length,
        valid: valid.length,
        invalid: invalid.length,
        loaded: loadResult.success,
        errors: loadResult.errors,
      };
      
      // Gửi message hoàn thành job
      try {
        await this.rabbitMQService.publishMessage(RABBITMQ_ROUTING_KEYS.COMPLETE_CSV, {
          jobType: SOURCE_TYPE.CSV,
          sourceFile,
          result,
          timestamp: new Date().toISOString(),
        });
      } catch (rabbitMQError) {
        this.log.warn({ error: rabbitMQError }, 'Failed to send complete message to RabbitMQ');
      }
      
      return result;
    } catch (error) {
      this.log.error({ error }, 'Error processing CSV');
      
      // Gửi message lỗi
      try {
        await this.rabbitMQService.publishMessage(RABBITMQ_ROUTING_KEYS.COMPLETE_CSV, {
          jobType: SOURCE_TYPE.CSV,
          sourceFile,
          status: ETL_STATUS.ERROR,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      } catch (rabbitMQError) {
        this.log.warn({ error: rabbitMQError }, 'Failed to send error message to RabbitMQ');
      }
      
      throw error;
    }
  }

  /**
   * Xử lý ETL từ raw_orders table
   * 
   * Quy trình:
   * 1. Extract dữ liệu từ raw_orders table
   * 2. Validate và transform dữ liệu
   * 3. Log validation errors (nếu có)
   * 4. Load dữ liệu hợp lệ vào new_db
   * 5. Publish message hoàn thành vào RabbitMQ
   * 
   * @returns {Promise<EtlProcessResult>} Kết quả xử lý ETL
   */
  async processRawOrders() {
    try {
      // Extract
      const rawData = await this.extractService.extractFromRawOrders();
      
      // Validate & Transform
      const { valid, invalid } = await this.validateAndTransform(rawData);
      
      // Log validation errors
      if (invalid.length > 0) {
        await this.loadService.logValidationErrors(invalid);
      }
      
      // Load valid data
      const loadResult = await this.loadService.loadToNewDb(valid);
      
      const result = {
        extracted: rawData.length,
        valid: valid.length,
        invalid: invalid.length,
        loaded: loadResult.success,
        errors: loadResult.errors,
      };
      
      // Gửi message hoàn thành job
      try {
        await this.rabbitMQService.publishMessage(RABBITMQ_ROUTING_KEYS.COMPLETE_RAW_ORDERS, {
          jobType: SOURCE_TYPE.RAW_ORDERS,
          result,
          timestamp: new Date().toISOString(),
        });
      } catch (rabbitMQError) {
        this.log.warn({ error: rabbitMQError }, 'Failed to send complete message to RabbitMQ');
      }
      
      return result;
    } catch (error) {
      this.log.error({ error }, 'Error processing raw_orders');
      
      // Gửi message lỗi
      try {
        await this.rabbitMQService.publishMessage(RABBITMQ_ROUTING_KEYS.COMPLETE_RAW_ORDERS, {
          jobType: SOURCE_TYPE.RAW_ORDERS,
          status: ETL_STATUS.ERROR,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      } catch (rabbitMQError) {
        this.log.warn({ error: rabbitMQError }, 'Failed to send error message to RabbitMQ');
      }
      
      throw error;
    }
  }
}

