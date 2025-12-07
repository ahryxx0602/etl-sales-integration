/**
 * Type definitions cho ETL process
 * @module types/etlTypes
 */

/**
 * @typedef {Object} RawOrderData
 * @property {string} [order_code] - Mã đơn hàng
 * @property {string} [order_id] - ID đơn hàng (fallback)
 * @property {string} [store_code] - Mã cửa hàng
 * @property {string} [store_name] - Tên cửa hàng
 * @property {string} [customer_phone] - Số điện thoại
 * @property {string} [customer_name] - Tên khách hàng
 * @property {string} [customer_email] - Email khách hàng
 * @property {string} [order_date] - Ngày đơn hàng
 * @property {string} [item_sku] - SKU sản phẩm
 * @property {string} [item_name] - Tên sản phẩm
 * @property {number} [qty] - Số lượng
 * @property {number} [unit_price] - Giá đơn vị
 * @property {string} [currency] - Loại tiền tệ
 * @property {number} [record_id] - ID record từ source
 * @property {string} [source_file] - Tên file nguồn
 * @property {string} [source_type] - Loại nguồn: 'old_db' | 'csv' | 'raw_orders'
 */

/**
 * @typedef {Object} TransformedOrderData
 * @property {string} order_code - Mã đơn hàng (đã validate)
 * @property {string} store_code - Mã cửa hàng (đã validate)
 * @property {string|null} customer_phone - Số điện thoại (đã validate, có thể null)
 * @property {string} order_datetime - Ngày giờ đơn hàng (format: YYYY-MM-DD HH:mm:ss)
 * @property {string} item_sku - SKU sản phẩm (đã validate)
 * @property {string} item_name - Tên sản phẩm (đã chuẩn hóa)
 * @property {number} qty - Số lượng (đã validate)
 * @property {number} unit_price - Giá đơn vị (đã validate)
 * @property {string} currency - Loại tiền tệ (uppercase)
 * @property {string} source_type - Loại nguồn: 'old_db' | 'csv' | 'raw_orders'
 * @property {string|null} [store_name] - Tên cửa hàng (đã sửa dấu)
 * @property {string|null} [customer_name] - Tên khách hàng (đã sửa dấu)
 * @property {string|null} [customer_email] - Email khách hàng
 * @property {string|null} [product_name] - Tên sản phẩm (đã sửa dấu)
 * @property {string|null} [category] - Danh mục (đã sửa dấu)
 * @property {number} [record_id] - ID record từ source
 * @property {string} [source_file] - Tên file nguồn
 */

/**
 * @typedef {Object} ValidationErrorItem
 * @property {string} field - Tên trường bị lỗi
 * @property {string} error - Thông báo lỗi
 */

/**
 * @typedef {Object} TransformResult
 * @property {boolean} valid - true nếu không có lỗi
 * @property {TransformedOrderData} [data] - Dữ liệu đã transform (chỉ có nếu valid = true)
 * @property {Array<ValidationErrorItem>} [errors] - Danh sách lỗi (chỉ có nếu valid = false)
 */

/**
 * @typedef {Object} EtlProcessResult
 * @property {number} extracted - Số records đã extract
 * @property {number} valid - Số records hợp lệ
 * @property {number} invalid - Số records không hợp lệ
 * @property {number} loaded - Số records đã load thành công
 * @property {number} errors - Số lỗi xảy ra
 */

/**
 * @typedef {Object} InvalidDataItem
 * @property {RawOrderData} raw_data - Dữ liệu thô gây lỗi
 * @property {Array<ValidationErrorItem>} errors - Danh sách lỗi validation
 */

