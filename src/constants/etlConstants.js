/**
 * Constants cho ETL process
 * @module constants/etlConstants
 */

/**
 * Trạng thái ETL logs
 * @readonly
 * @enum {string}
 */
export const ETL_STATUS = {
  /** ETL thành công */
  SUCCESS: 'success',
  /** Có lỗi trong quá trình ETL */
  ERROR: 'error',
  /** Lỗi validation */
  VALIDATION_ERROR: 'validation_error',
};

/**
 * Loại nguồn dữ liệu
 * @readonly
 * @enum {string}
 */
export const SOURCE_TYPE = {
  /** Dữ liệu từ old database */
  OLD_DB: 'old_db',
  /** Dữ liệu từ CSV file */
  CSV: 'csv',
  /** Dữ liệu từ raw_orders table */
  RAW_ORDERS: 'raw_orders',
};

/**
 * RabbitMQ routing keys
 * @readonly
 * @enum {string}
 */
export const RABBITMQ_ROUTING_KEYS = {
  EXTRACT: 'extract.data',
  TRANSFORM: 'transform.data',
  LOAD: 'load.data',
  COMPLETE_OLD_DB: 'complete.old_db',
  COMPLETE_CSV: 'complete.csv',
  COMPLETE_RAW_ORDERS: 'complete.raw_orders',
};

/**
 * Giới hạn validation
 * @readonly
 */
export const VALIDATION_LIMITS = {
  /** Giá tối đa (VND) */
  MAX_PRICE: 100000000,
  /** Độ dài tối đa của SKU */
  MAX_SKU_LENGTH: 20,
  /** Độ dài tối đa của tên sản phẩm */
  MAX_PRODUCT_NAME_LENGTH: 100,
  /** Độ dài tối đa của store code */
  MAX_STORE_CODE_LENGTH: 10,
};

/**
 * Currency mặc định
 * @readonly
 */
export const DEFAULT_CURRENCY = 'VND';

