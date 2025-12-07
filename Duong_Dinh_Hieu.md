# Nhiệm vụ: Dương Đình Hiếu

## Module phụ trách: Logging và Monitoring

## Tổng quan
Bạn chịu trách nhiệm cho phần **Logging và Monitoring** của hệ thống ETL. Nhiệm vụ của bạn là ghi log tất cả các bước ETL vào database, ghi lại các lỗi, thành công, và xây dựng dashboard thống kê để monitor quá trình ETL.

---

## Nhiệm vụ cụ thể

### 1. Ghi log từng bước ETL vào Database

#### 1.1. Log Extract
- **Khi nào**: Khi extract dữ liệu từ old_db, CSV, hoặc raw_orders
- **Status**: `success` (hiện tại không log riêng extract, chỉ publish message vào RabbitMQ)
- **Metadata**: source_table, source_type, count, timestamp

**Files liên quan:**
- `src/services/etl/ExtractService.js` - Publish message vào RabbitMQ (không log vào database)
- `src/services/rabbitmq/PublisherService.js` - Publish message với routing key `extract.*`

#### 1.2. Log Validate & Transform
- **Khi nào**: Khi validate và transform dữ liệu (thực hiện cùng lúc)
- **Status**: 
  - `validation_error` - Dữ liệu không pass validation
  - `success` - Dữ liệu đã được transform thành công (không log riêng, chỉ log khi load)
- **Metadata**: source_table, source_type, order_code, errors

**Files liên quan:**
- `src/services/etl/ProcessService.js` - Method `validateAndTransform()` (không log riêng)
- `src/services/etl/LoadService.js` - Method `logValidationErrors()` - Log validation errors

#### 1.3. Log Load
- **Khi nào**: Khi load dữ liệu vào new_db
- **Status**: 
  - `success` - Load thành công
  - `error` - Load lỗi
- **Metadata**: source_table, source_type, record_id, order_code, message, error_details
- **Record ID**: Lưu `record_id` từ source table (old_orders.id, raw_orders.id) để traceback

**Files liên quan:**
- `src/services/etl/LoadService.js` - Method `loadToNewDb()` - Log success/error sau mỗi record (sử dụng row.record_id)
- `src/services/etl/ProcessService.js` - Method `processCsv()` - Cập nhật record_id sau khi insert vào raw_orders
- `src/models/NewDbModel.js` - Method `insertLog()` - Lưu record_id vào etl_logs

### 2. Ghi lỗi (Error Logging)
- **Error details**: Ghi chi tiết lỗi vào field `error_details` (JSON format)
- **Error types**: 
  - `validation_error` - Lỗi validation (từ TransformService)
  - `error` - Lỗi chung (database, connection, etc.)
- **Error context**: Ghi thông tin context (record data, error message, stack trace)

**Files liên quan:**
- `src/models/NewDbModel.js` - Method `insertLog()` với `error_details` parameter (JSON)
- `src/services/etl/LoadService.js` - Log errors trong `loadToNewDb()` và `logValidationErrors()`

### 3. Ghi thành công (Success Logging)
- **Success status**: Ghi log với status `success` khi load thành công
- **Success message**: Ghi message mô tả thành công (ví dụ: "Data loaded successfully")
- **Metadata**: source_table, source_type, order_code

**Files liên quan:**
- `src/models/NewDbModel.js` - Method `insertLog()` với status `success`
- `src/services/etl/LoadService.js` - Log success trong `loadToNewDb()`

### 4. Xây dựng Dashboard Thống kê

#### 4.1. Statistics API
- **Endpoint**: `GET /api/etl/stats`
- **Chức năng**: Lấy thống kê tổng quan về dữ liệu trong Data Warehouse
- **Response**: 
  ```json
  {
    "success": true,
    "data": {
      "stores": 15,
      "customers": 30,
      "products": 40,
      "orders": 50,
      "orderItems": 100,
      "logs": 200
    }
  }
  ```

**Files liên quan:**
- `src/controllers/DataController.js` - Method `getStats()`
- `src/models/NewDbModel.js` - Method `getStats()`
- `src/routes/etlRoutes.js` - Route `GET /api/etl/stats`

#### 4.2. Logs API
- **Endpoint**: `GET /api/etl/logs?limit=100&offset=0&status=error`
- **Chức năng**: Lấy logs ETL với pagination và filter theo status
- **Query parameters**: 
  - `limit` - Số lượng logs (default: 100)
  - `offset` - Offset (default: 0)
  - `status` - Filter theo status: `success`, `error`, `validation_error` (optional)
- **Response**: 
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "source_table": "raw_orders",
        "source_type": "csv",
        "record_id": 123,
        "order_code": "P001",
        "status": "success",
        "message": "Data loaded successfully",
        "error_details": null,
        "created_at": "2025-12-06T16:05:33.000Z"
      }
    ],
    "total": 200,
    "limit": 100,
    "offset": 0
  }
  ```
- **Ví dụ sử dụng**:
  - `GET /api/etl/logs?status=error` - Chỉ lấy logs lỗi
  - `GET /api/etl/logs?status=success&limit=50` - Lấy 50 logs thành công
  - `GET /api/etl/logs?limit=50&offset=0&status=validation_error` - Lấy validation errors

**Files liên quan:**
- `src/controllers/DataController.js` - Method `getLogs()` (xử lý query parameter status)
- `src/models/NewDbModel.js` - Method `getLogs(limit, offset, status)` (filter theo status)
- `src/routes/dataRoutes.js` - Route `GET /api/etl/logs` (đã tách từ etlRoutes.js)

#### 4.3. Data Query APIs
- **Endpoints**:
  - `GET /api/etl/stores` - Lấy danh sách cửa hàng
  - `GET /api/etl/customers` - Lấy danh sách khách hàng
  - `GET /api/etl/products` - Lấy danh sách sản phẩm
  - `GET /api/etl/orders` - Lấy danh sách đơn hàng
  - `GET /api/etl/order-items` - Lấy chi tiết đơn hàng
- **Query parameters**: `limit`, `offset` (pagination)
- **Response**: 
  ```json
  {
    "success": true,
    "data": [...],
    "total": 100,
    "limit": 100,
    "offset": 0
  }
  ```

**Files liên quan:**
- `src/controllers/DataController.js` - Methods `getStores()`, `getCustomers()`, `getProducts()`, `getOrders()`, `getOrderItems()`
- `src/models/NewDbModel.js` - Methods `getStores()`, `getCustomers()`, `getProducts()`, `getOrders()`, `getOrderItems()`
- `src/routes/etlRoutes.js` - Routes tương ứng

#### 4.4. Dashboard UI
- **Location**: `views/pages/index.ejs`
- **Chức năng**: 
  - Hiển thị statistics (stores, customers, products, orders, orderItems, logs)
  - Hiển thị logs table với pagination
  - Hiển thị data từ Data Warehouse (stores, customers, products, orders, orderItems)
  - Real-time updates (polling)

**Files liên quan:**
- `views/pages/index.ejs` - Dashboard UI chính
- `public/assets/js/app.js` - JavaScript fetch data từ API, render charts
- `views/partials/table-logs.ejs` - Table hiển thị logs
- `views/partials/table-orders.ejs`, `table-order-items.ejs`, `table-products.ejs` - Tables hiển thị dữ liệu

---

## Các file cần đọc và hiểu

### Database Model
1. **`src/models/NewDbModel.js`**
   - `insertLog(sourceTable, sourceType, recordId, orderCode, status, message, errorDetails)` - Insert log vào `etl_logs` table
   - `getStats()` - Get statistics (total counts của stores, customers, products, orders, orderItems, logs)
   - `getLogs(limit, offset)` - Get logs với pagination
   - `getStores(limit, offset)` - Get stores với pagination
   - `getCustomers(limit, offset)` - Get customers với pagination
   - `getProducts(limit, offset)` - Get products với pagination
   - `getOrders(limit, offset)` - Get orders với pagination (join với stores và customers)
   - `getOrderItems(limit, offset)` - Get order items với pagination (join với orders và products)

### Load Service (Logging Integration)
2. **`src/services/etl/LoadService.js`**
   - `loadToNewDb(validData)` - Log success/error sau mỗi record
   - `logValidationErrors(invalidData)` - Log validation errors

### Controllers
3. **`src/controllers/DataController.js`**
   - `getStats(req, res)` - API endpoint cho statistics
   - `getLogs(req, res)` - API endpoint cho logs
   - `getStores(req, res)` - API endpoint cho stores
   - `getCustomers(req, res)` - API endpoint cho customers
   - `getProducts(req, res)` - API endpoint cho products
   - `getOrders(req, res)` - API endpoint cho orders
   - `getOrderItems(req, res)` - API endpoint cho order items

### Routes
4. **`src/routes/etlRoutes.js`**
   - Routes: 
     - `GET /api/etl/stats` - Statistics
     - `GET /api/etl/logs` - Logs
     - `GET /api/etl/stores` - Stores
     - `GET /api/etl/customers` - Customers
     - `GET /api/etl/products` - Products
     - `GET /api/etl/orders` - Orders
     - `GET /api/etl/order-items` - Order items

### Frontend - Dashboard
5. **`views/pages/index.ejs`**
   - Dashboard UI chính
   - Hiển thị statistics và logs
   - Include các partials (table-logs, table-orders, etc.)

6. **`public/assets/js/app.js`** (nếu có)
   - JavaScript fetch data từ API
   - Render charts/graphs
   - Real-time updates (polling)

7. **`views/partials/table-logs.ejs`**
   - Table hiển thị logs
   - Pagination, filtering, sorting

8. **`views/partials/table-orders.ejs`**, `table-order-items.ejs`, `table-products.ejs`
   - Tables hiển thị dữ liệu từ DW

### SQL Schema
9. **`sql/02_create_new_db.sql`**
   - Schema của bảng `etl_logs`
   - Fields: `id`, `source_table`, `source_type`, `record_id`, `order_code`, `status`, `message`, `error_details`, `created_at`
   - Indexes: `idx_status`, `idx_source_type`, `idx_created_at`

### Main App
10. **`src/app.js`**
    - Express app setup
    - Routes registration

---

## Log Schema

### etl_logs Table
```sql
CREATE TABLE etl_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    source_table VARCHAR(50),        -- 'old_orders', 'raw_orders', 'validation', etc.
    source_type VARCHAR(20),         -- 'old_db', 'csv', 'raw_orders', etc.
    record_id INT,                   -- ID của record trong source table (nullable)
    order_code VARCHAR(50),          -- Order code (nullable)
    status VARCHAR(20),              -- 'success', 'error', 'validation_error'
    message TEXT,                     -- Message mô tả
    error_details JSON,              -- Chi tiết lỗi (JSON format)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Status Values
- `success` - Thành công (khi load thành công)
- `error` - Lỗi chung (database, connection, etc.)
- `validation_error` - Lỗi validation (dữ liệu không pass validation)

---

## Statistics API

### GET /api/etl/stats
**Response:**
```json
{
  "success": true,
  "data": {
    "stores": 15,
    "customers": 30,
    "products": 40,
    "orders": 50,
    "orderItems": 100,
    "logs": 200
  }
}
```

### GET /api/etl/logs?limit=100&offset=0
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "source_table": "old_orders",
      "source_type": "old_db",
      "record_id": null,
      "order_code": "ORD001",
      "status": "success",
      "message": "Data loaded successfully",
      "error_details": null,
      "created_at": "2024-01-15T10:30:00.000Z"
    },
    ...
  ],
  "total": 200,
  "limit": 100,
  "offset": 0
}
```

### GET /api/etl/stores?limit=100&offset=0
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "store_code": "ST001",
      "store_name": "Cửa hàng Hà Nội",
      "created_at": "2024-01-15T10:30:00.000Z"
    },
    ...
  ],
  "total": 15,
  "limit": 100,
  "offset": 0
}
```

### GET /api/etl/orders?limit=100&offset=0
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "order_code": "ORD001",
      "store_id": 1,
      "customer_id": 1,
      "order_datetime": "2024-01-15T10:30:00.000Z",
      "store_name": "Cửa hàng Hà Nội",
      "customer_name": "Nguyễn Văn Anh",
      "customer_phone": "0912345678"
    },
    ...
  ],
  "total": 50,
  "limit": 100,
  "offset": 0
}
```

---

## Dashboard Features

### Statistics Display
- **Total Stores**: Số lượng cửa hàng
- **Total Customers**: Số lượng khách hàng
- **Total Products**: Số lượng sản phẩm
- **Total Orders**: Số lượng đơn hàng
- **Total Order Items**: Số lượng chi tiết đơn hàng
- **Total Logs**: Tổng số logs

### Logs Table
- **Columns**: ID, Source Table, Source Type, Order Code, Status, Message, Created At
- **Pagination**: Limit và offset
- **Sorting**: Sort theo `created_at DESC` (mới nhất trước)

### Data Tables
- **Stores Table**: Hiển thị danh sách cửa hàng
- **Customers Table**: Hiển thị danh sách khách hàng
- **Products Table**: Hiển thị danh sách sản phẩm
- **Orders Table**: Hiển thị đơn hàng với thông tin store và customer (join)
- **Order Items Table**: Hiển thị chi tiết đơn hàng với thông tin order và product (join)

### Real-time Updates
- **Polling**: Fetch data từ API định kỳ (có thể implement trong frontend)
- **Manual refresh**: User có thể refresh để cập nhật data

---

## Luồng xử lý

### Logging Flow
```
ETL Process
    ↓
Each Step (Extract, Validate, Transform, Load)
    ↓
    ├─ Success → insertLog(status: 'success', message: '...')
    │
    └─ Error → insertLog(status: 'error', message: '...', error_details: {...})
    ↓
Logs stored in etl_logs table
    ↓
Dashboard fetches logs via API
    ↓
Display in UI
```

### Statistics Flow
```
Dashboard loads
    ↓
Fetch /api/etl/stats
    ↓
Display statistics
    ↓
Fetch /api/etl/logs
    ↓
Display logs table
    ↓
Fetch /api/etl/stores, /api/etl/customers, etc.
    ↓
Display data tables
```

---

## Lưu ý quan trọng

1. **Log Performance**: 
   - Không log quá nhiều (có thể ảnh hưởng performance)
   - Log từng record một (không batch) để đảm bảo chi tiết
   - Index `created_at` để query nhanh

2. **Error Details**: 
   - Lưu error_details dưới dạng JSON để dễ query và parse
   - Không lưu quá nhiều dữ liệu (có thể làm chậm)
   - Include error message và row data trong error_details

3. **Pagination**: 
   - Sử dụng pagination cho logs table và data tables
   - Default limit: 100
   - Sort theo `created_at DESC` để hiển thị mới nhất trước

4. **Dashboard Performance**: 
   - Pagination cho logs table và data tables
   - Limit số records hiển thị
   - Có thể cache statistics nếu cần

5. **Error Handling**: 
   - Xử lý lỗi khi không thể log (không block ETL process)
   - Logging errors không nên throw exception

6. **Security**: 
   - Không log sensitive data (passwords, tokens, etc.)
   - Sanitize error messages trước khi log

7. **API Response Format**: 
   - Consistent response format cho tất cả APIs
   - Include `success`, `data`, `total`, `limit`, `offset` trong response

8. **Join Queries**: 
   - Orders query join với stores và customers để hiển thị đầy đủ thông tin
   - Order items query join với orders và products để hiển thị đầy đủ thông tin

---
## Tiến độ
✅ Hoàn thành - Logging và monitoring hoạt động ổn định
