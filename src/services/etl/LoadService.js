import { ETL_STATUS, RABBITMQ_ROUTING_KEYS, SOURCE_TYPE } from '../../constants/etlConstants.js';

/**
 * @typedef {import('../../types/etlTypes.js').TransformedOrderData} TransformedOrderData
 * @typedef {import('../../types/etlTypes.js').InvalidDataItem} InvalidDataItem
 */

/**
 * Service để load dữ liệu vào new_db (Data Warehouse)
 * 
 * Chịu trách nhiệm:
 * - Upsert dimension tables (stores, customers, products)
 * - Insert vào fact tables (orders, order_items)
 * - Ghi log success/error vào etl_logs
 * - Publish messages vào RabbitMQ
 * 
 * @class LoadService
 */
export class LoadService {
  /**
   * Tạo instance LoadService
   * @param {NewDbModel} newDbModel - Model để tương tác với new_db
   * @param {RabbitMQService} rabbitMQService - Service để publish messages
   * @param {Logger} logger - Pino logger instance
   */
  constructor(newDbModel, rabbitMQService, logger) {
    this.newDbModel = newDbModel;
    this.rabbitMQService = rabbitMQService;
    this.log = logger.child({ name: 'LoadService' });
  }

  /**
   * Load dữ liệu đã validate và transform vào new_db
   * 
   * Quy trình:
   * 1. Upsert stores, customers, products (dimension tables)
   * 2. Upsert orders (fact table)
   * 3. Insert order_items (fact table)
   * 4. Ghi log success/error cho mỗi record
   * 5. Publish message vào RabbitMQ
   * 
   * @param {Array<TransformedOrderData>} validData - Dữ liệu đã validate và transform
   * @returns {Promise<{success: number, errors: number}>} Số records load thành công và thất bại
   */
  async loadToNewDb(validData) {
    this.log.info({ count: validData.length }, 'Loading data to new_db...');
    
    let successCount = 0;
    let errorCount = 0;

    for (const row of validData) {
      try {
        // Upsert store - chỉ truyền store_name nếu có (không phải undefined)
        const storeId = await this.newDbModel.upsertStore(
          row.store_code,
          row.store_name !== undefined ? row.store_name : null
        );

        // Upsert customer - chỉ truyền nếu có (không phải undefined)
        const customerId = await this.newDbModel.upsertCustomer(
          row.customer_phone,
          row.customer_name !== undefined ? row.customer_name : null,
          row.customer_email !== undefined ? row.customer_email : null
        );

        // Upsert product - chỉ truyền category nếu có (không phải undefined)
        const productId = await this.newDbModel.upsertProduct(
          row.item_sku,
          row.item_name || row.product_name,
          row.category !== undefined ? row.category : null
        );

        // Upsert order
        const orderId = await this.newDbModel.upsertOrder(
          row.order_code,
          storeId,
          customerId,
          row.order_datetime
        );

        // Insert order item
        await this.newDbModel.insertOrderItem(
          orderId,
          productId,
          row.qty,
          row.unit_price,
          row.currency
        );

        // Log success
        await this.newDbModel.insertLog(
          row.source_type === SOURCE_TYPE.OLD_DB ? 'old_orders' : 'raw_orders',
          row.source_type,
          row.record_id || null, // ID từ source table
          row.order_code,
          ETL_STATUS.SUCCESS,
          'Data loaded successfully'
        );

        successCount++;
      } catch (error) {
        errorCount++;
        this.log.error({ error, row }, 'Error loading row to new_db');
        
        // Log error
        await this.newDbModel.insertLog(
          row.source_type === SOURCE_TYPE.OLD_DB ? 'old_orders' : 'raw_orders',
          row.source_type,
          row.record_id || null, // ID từ source table
          row.order_code,
          ETL_STATUS.ERROR,
          error.message,
          { error: error.toString(), row }
        );
      }
    }

    this.log.info({ success: successCount, errors: errorCount }, 'Loading completed');
    
    // Gửi message vào RabbitMQ queue sau khi load
    try {
      await this.rabbitMQService.publishMessage(RABBITMQ_ROUTING_KEYS.LOAD, {
        successCount,
        errorCount,
        totalProcessed: validData.length,
        timestamp: new Date().toISOString(),
      });
    } catch (rabbitMQError) {
      this.log.warn({ error: rabbitMQError }, 'Failed to send load message to RabbitMQ');
    }
    
    return { success: successCount, errors: errorCount };
  }

  /**
   * Ghi log các lỗi validation vào etl_logs
   * 
   * @param {Array<InvalidDataItem>} invalidData - Danh sách dữ liệu không hợp lệ
   * @returns {Promise<void>}
   */
  async logValidationErrors(invalidData) {
    for (const item of invalidData) {
      // Tạo message chi tiết từ các lỗi validation
      const errorMessages = item.errors.map(err => `${err.field}: ${err.error}`).join('; ');
      const message = errorMessages || 'Validation failed';
      
      await this.newDbModel.insertLog(
        'validation',
        item.raw_data.source_type || 'unknown',
        item.raw_data.record_id || null, // ID từ source table nếu có
        item.raw_data.order_code || null,
        ETL_STATUS.VALIDATION_ERROR,
        message,
        { errors: item.errors, raw_data: item.raw_data }
      );
    }
  }
}

