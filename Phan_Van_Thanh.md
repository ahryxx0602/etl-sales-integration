# Nhiệm vụ: Phan Văn Thành

## Module phụ trách: Extract (Ingest) + Load Data Warehouse

## Tổng quan
Bạn chịu trách nhiệm cho phần **Extract (Ingest)** và **Load Data Warehouse** của hệ thống ETL. Đây là các bước đầu tiên và cuối cùng trong quy trình ETL, đảm bảo dữ liệu được đọc từ các nguồn khác nhau và được load thành công vào Data Warehouse.

---

## Nhiệm vụ cụ thể

### 1. Đọc dữ liệu từ các nguồn (Extract/Ingest)

#### 1.1. Extract từ Old Database
- **Method**: `ExtractService.extractFromOldDb()`
- **Chức năng**: 
  - Kết nối và trích xuất dữ liệu từ database cũ (`old_db`)
  - Lấy tất cả orders từ `old_orders`
  - Lấy order items từ `old_order_items` theo từng order_code
  - Enrich dữ liệu với thông tin từ lookup tables (stores, customers, products)
  - Combine orders với order items thành flat structure
- **Output**: Array of enriched data objects với đầy đủ thông tin

**Files liên quan:**
- `src/services/etl/ExtractService.js` - Method `extractFromOldDb()`
- `src/models/OldDbModel.js` - Methods `getAllOrders()`, `getOrderItemsByOrderCode()`
- `src/services/LookupService.js` - Methods `loadReferenceData()`, `lookupStoreName()`, `lookupCustomer()`, `lookupProduct()`

#### 1.2. Extract từ CSV files
- **Method**: `ExtractService.extractFromCsv(csvData, sourceFile)`
- **Chức năng**: 
  - Parse và đọc dữ liệu từ các file CSV được upload
  - Map các field names khác nhau (order_id/orderId/order_code, etc.)
  - Enrich dữ liệu với thông tin từ lookup tables
  - Thêm metadata (source_type: 'csv', source_file)
- **Input**: CSV data (array of objects), source file name
- **Output**: Array of enriched data objects
- **Lưu ý**: `record_id` sẽ được cập nhật sau khi insert vào `raw_orders` trong `ProcessService.processCsv()`

**Files liên quan:**
- `src/services/etl/ExtractService.js` - Method `extractFromCsv()`
- `src/services/etl/ProcessService.js` - Method `processCsv()` (cập nhật record_id)
- `src/services/LookupService.js` - Method `enrichRow()`
- `src/cli/processCsv.js` - CLI script xử lý từ CSV

#### 1.3. Extract từ Raw Orders
- **Method**: `ExtractService.extractFromRawOrders()`
- **Chức năng**: 
  - Trích xuất dữ liệu từ bảng `raw_orders` trong old_db
  - Enrich dữ liệu với thông tin từ lookup tables
  - Thêm metadata (source_type: 'raw_orders', record_id: row.id)
- **Output**: Array of enriched data objects với `record_id` từ `raw_orders.id`

**Files liên quan:**
- `src/services/etl/ExtractService.js` - Method `extractFromRawOrders()` (set record_id: row.id)
- `src/models/OldDbModel.js` - Method `getAllRawOrders()`

#### 1.4. Enrich dữ liệu với Lookup Service
- **Chức năng**: 
  - Load reference data vào cache (stores, customers, products từ cả old_db và new_db)
  - Lookup store name từ store_code
  - Lookup customer info (full_name, email) từ phone
  - Lookup product info (product_name, category) từ SKU
  - Fallback: Tìm trong new_db nếu không có trong old_db

**Files liên quan:**
- `src/services/LookupService.js` - Main lookup service (facade pattern)
- `src/services/lookup/StoreLookupService.js` - Lookup store name
- `src/services/lookup/CustomerLookupService.js` - Lookup customer info
- `src/services/lookup/ProductLookupService.js` - Lookup product info

### 2. Publish message lên RabbitMQ
- **Gửi message sau khi extract**: Publish thông báo khi hoàn thành extract từ các nguồn
- **Routing keys**: 
  - `extract.old_db` - Khi extract từ old_db
  - `extract.csv` - Khi extract từ CSV
  - `extract.raw_orders` - Khi extract từ raw_orders
- **Message format**: 
  - `source`: Nguồn dữ liệu ('old_db', 'csv', 'raw_orders')
  - `count`: Số lượng records
  - `timestamp`: Thời gian extract
  - `data`: Sample data (10 records đầu tiên để tránh message quá lớn)
- **Error handling**: Xử lý lỗi khi không thể publish message (log warning, không throw error)

**Files liên quan:**
- `src/services/rabbitmq/PublisherService.js` - Method `publishMessage()`
- `src/services/RabbitMQService.js` - Service wrapper cho RabbitMQ
- `src/config/config.js` - Cấu hình RabbitMQ (exchanges, queues, routing keys)

### 3. Thiết lập Exchange, Queue và Topology
- **Tạo Exchange**: Thiết lập topic exchange `etl.exchange` với durable mode
- **Tạo Queues**: Tạo các queues cần thiết:
  - `etl.extract` - Nhận dữ liệu đã extract (routing: `extract.*`)
  - `etl.transform` - Nhận dữ liệu đã transform (routing: `transform.*`)
  - `etl.load` - Nhận dữ liệu đã load (routing: `load.*`)
  - `etl.complete` - Nhận thông báo hoàn thành (routing: `complete.*`)
- **Binding queues**: Bind các queues với exchange sử dụng routing keys phù hợp
- **Queue management**: Xử lý các trường hợp queue đã tồn tại với cấu hình khác (recreate, unbind)

**Files liên quan:**
- `src/services/rabbitmq/QueueService.js` - Methods `setupExchangesAndQueues()`, `assertQueueSafe()`
- `src/services/rabbitmq/ConnectionService.js` - Service quản lý kết nối RabbitMQ
- `src/config/config.js` - Cấu hình topology

### 4. Load Data Warehouse
- **Upsert Dimensions**: 
  - Upsert `stores` (stores table) - Dựa trên `store_code`
  - Upsert `customers` (customers table) - Dựa trên `phone`
  - Upsert `products` (products table) - Dựa trên `sku`
- **Insert Fact Table**: 
  - Upsert `orders` (orders table) - Dựa trên `order_code`
  - Insert `order_items` (order_items table) - Với foreign keys đến orders và products
- **Data integrity**: Đảm bảo foreign keys và constraints được tuân thủ
- **Error handling**: Xử lý lỗi và log vào `etl_logs` với status `error`
- **Success logging**: Log success vào `etl_logs` với status `success`
- **Record ID tracking**: Lưu `record_id` vào `etl_logs` để traceback về source record (từ old_orders.id, raw_orders.id)

**Files liên quan:**
- `src/services/etl/LoadService.js` - Method `loadToNewDb()` (sử dụng row.record_id khi log)
- `src/services/etl/ProcessService.js` - Method `processCsv()` (cập nhật record_id sau khi insert vào raw_orders)
- `src/services/TransformService.js` - Method `transformOrderData()` (giữ lại record_id và source_file)
- `src/models/NewDbModel.js` - Methods `upsertStore()`, `upsertCustomer()`, `upsertProduct()`, `upsertOrder()`, `insertOrderItem()`, `insertLog()`
- `sql/02_create_new_db.sql` - Schema của Data Warehouse (Star Schema)

### 5. Log Validation Errors
- **Method**: `LoadService.logValidationErrors(invalidData)`
- **Chức năng**: 
  - Log các dữ liệu không pass validation vào `etl_logs`
  - Status: `validation_error`
  - Message: Tổng hợp tất cả errors từ validation
  - Error details: JSON chứa errors và raw_data
  - Record ID: Sử dụng `item.raw_data.record_id` nếu có để traceback

**Files liên quan:**
- `src/services/etl/LoadService.js` - Method `logValidationErrors()` (sử dụng record_id từ raw_data)
- `src/models/NewDbModel.js` - Method `insertLog()`

---

## Các file cần đọc và hiểu

### Core Services
1. **`src/services/etl/ExtractService.js`**
   - `extractFromOldDb()` - Extract từ old_db
   - `extractFromCsv(csvData, sourceFile)` - Extract từ CSV
   - `extractFromRawOrders()` - Extract từ raw_orders

2. **`src/services/etl/LoadService.js`**
   - `loadToNewDb(validData)` - Load dữ liệu vào new_db
   - `logValidationErrors(invalidData)` - Log validation errors

3. **`src/services/LookupService.js`**
   - `loadReferenceData()` - Load stores, customers, products vào cache
   - `lookupStoreName(storeCode)` - Lookup store name
   - `lookupCustomer(phone)` - Lookup customer info
   - `lookupProduct(sku)` - Lookup product info
   - `enrichRow(row)` - Enrich một row với thông tin từ lookup

4. **`src/services/lookup/StoreLookupService.js`**
   - `loadStores()` - Load stores vào cache
   - `lookupStoreName(storeCode)` - Lookup store name từ store_code

5. **`src/services/lookup/CustomerLookupService.js`**
   - `loadCustomers()` - Load customers vào cache
   - `lookupCustomer(phone)` - Lookup customer info từ phone

6. **`src/services/lookup/ProductLookupService.js`**
   - `loadProducts()` - Load products vào cache
   - `lookupProduct(sku)` - Lookup product info từ SKU

7. **`src/services/rabbitmq/PublisherService.js`**
   - `publishMessage(routingKey, message, options)` - Publish message với routing key
   - `sendToQueue(queueName, message, options)` - Gửi trực tiếp vào queue

8. **`src/services/rabbitmq/QueueService.js`**
   - `setupExchangesAndQueues()` - Thiết lập topology
   - `assertQueueSafe(queueName, options)` - Tạo queue an toàn (xử lý conflict)

9. **`src/services/rabbitmq/ConnectionService.js`**
   - `connect()` - Kết nối RabbitMQ
   - `isReady()` - Kiểm tra kết nối
   - `close()` - Đóng kết nối

### CLI Scripts
10. **`src/cli/processOldDb.js`** - Script xử lý từ old_db
11. **`src/cli/processCsv.js`** - Script xử lý từ CSV

### Models
12. **`src/models/OldDbModel.js`** - Truy cập old_db
    - `getAllOrders()` - Lấy tất cả orders
    - `getOrderItemsByOrderCode(orderCode)` - Lấy order items theo order_code
    - `getAllRawOrders()` - Lấy tất cả raw orders
    - `insertRawOrder(data)` - Insert vào raw_orders

13. **`src/models/NewDbModel.js`** - Truy cập new_db (upsert methods)
    - `upsertStore(storeCode, storeName)` - Upsert store
    - `upsertCustomer(phone, fullName, email)` - Upsert customer
    - `upsertProduct(sku, productName, category)` - Upsert product
    - `upsertOrder(orderCode, storeId, customerId, orderDatetime)` - Upsert order
    - `insertOrderItem(orderId, productId, qty, unitPrice, currency)` - Insert order item
    - `insertLog(...)` - Insert log vào etl_logs

### Supporting Services
14. **`src/services/RabbitMQService.js`** - Wrapper service cho RabbitMQ

### Configuration
15. **`src/config/config.js`** - Cấu hình RabbitMQ, databases
16. **`src/config/database.js`** - Database connections

### SQL Schema
17. **`sql/01_create_old_db.sql`** - Schema old_db
18. **`sql/02_create_new_db.sql`** - Schema new_db (Star Schema)

---

## Luồng xử lý

### Extract Flow
```
Old DB / CSV / Raw Orders
    ↓
ExtractService.extractFrom*()
    ↓
Load reference data vào cache (LookupService.loadReferenceData())
    ↓
For each record:
    Enrich với LookupService (lookup store, customer, product)
    ↓
Combine thành flat structure
    ↓
Publish message → RabbitMQ (extract.*)
    ↓
Return enriched data
```

### Load Flow
```
Validated & Transformed Data
    ↓
LoadService.loadToNewDb(validData)
    ↓
For each record:
    ├─ Upsert Store (get store_id)
    ├─ Upsert Customer (get customer_id, có thể null)
    ├─ Upsert Product (get product_id)
    ├─ Upsert Order (get order_id)
    ├─ Insert Order Item
    └─ Log success/error
    ↓
Publish message → RabbitMQ (load.data)
    ↓
Return statistics (successCount, errorCount)
```

### Upsert Strategy
```
For each dimension:
    IF record exists (by unique key):
        UPDATE only non-null fields (COALESCE)
    ELSE:
        INSERT new record
    RETURN id
```

---

## Chi tiết Upsert Logic

### Stores
- **Unique key**: `store_code`
- **Upsert logic**: 
  - Nếu `storeName` là null/undefined: Chỉ insert `store_code`, không update `store_name`
  - Nếu `storeName` có giá trị: Insert hoặc update với `COALESCE` (chỉ update nếu giá trị mới không null)

### Customers
- **Unique key**: `phone`
- **Upsert logic**: 
  - Insert hoặc update với `COALESCE` cho `full_name` và `email`
  - Chỉ update các fields nếu giá trị mới không null

### Products
- **Unique key**: `sku`
- **Upsert logic**: 
  - `product_name`: Chỉ update nếu giá trị mới không empty (sử dụng `NULLIF`)
  - `category`: Chỉ update nếu giá trị mới không null (sử dụng `COALESCE`)

### Orders
- **Unique key**: `order_code`
- **Upsert logic**: 
  - Update tất cả fields nếu đã tồn tại (store_id, customer_id, order_datetime)

### Order Items
- **No upsert**: Chỉ insert (không có unique constraint, cho phép duplicate items trong cùng order)

---

## Lưu ý quan trọng

1. **Error Handling**: 
   - Luôn xử lý lỗi khi kết nối database hoặc RabbitMQ
   - Không throw error khi publish message fail (chỉ log warning)
   - Log tất cả errors vào `etl_logs`

2. **Lookup Cache**: 
   - Load reference data vào cache một lần trước khi extract
   - Cache được sử dụng để lookup nhanh
   - Fallback: Tìm trong new_db nếu không có trong old_db

3. **Message Size**: 
   - Chỉ gửi sample data trong message (10 records đầu) để tránh message quá lớn
   - Gửi metadata (count, timestamp) thay vì toàn bộ data

4. **Queue Topology**: 
   - Hiểu rõ routing keys và binding để message được route đúng
   - Xử lý conflict khi queue đã tồn tại với cấu hình khác

5. **Upsert Strategy**: 
   - Sử dụng `ON DUPLICATE KEY UPDATE` với `COALESCE` để chỉ update các fields không null
   - Đảm bảo không ghi đè dữ liệu đã có nếu giá trị mới là null

6. **Foreign Keys**: 
   - Đảm bảo upsert dimensions trước khi insert fact table
   - Customer có thể null (optional)

7. **Performance**: 
   - Xử lý từng record một (không batch) để đảm bảo data integrity
   - Logging không block ETL process

8. **Data Enrichment**: 
   - Enrich dữ liệu với thông tin từ lookup tables để có đầy đủ thông tin
   - Normalize store_code, phone, SKU để lookup chính xác

---

## Tiến độ
✅ Hoàn thành - Dữ liệu đã ETL thành công đến DW
✅ Đã sửa lỗi record_id null và cải thiện API logs
✅ Đã refactor routes để dễ bảo trì
