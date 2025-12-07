# Nhiệm vụ: Đỗ Thiên Sáng

## Module phụ trách: Load Data Warehouse

## Tổng quan
Bạn chịu trách nhiệm cho phần **Load Data Warehouse** của hệ thống ETL. Nhiệm vụ của bạn là load dữ liệu đã được transform vào Data Warehouse theo mô hình Star Schema. Bạn sẽ upsert các dimension tables và insert vào fact table, đồng thời đảm bảo data integrity và logging.

---

## Nhiệm vụ cụ thể

### 1. Upsert Dimension Tables

#### 1.1. Upsert `stores` (Stores Table)
- **Method**: `NewDbModel.upsertStore(storeCode, storeName)`
- **Unique key**: `store_code`
- **Upsert logic**: 
  - Nếu `storeName` là null/undefined: Chỉ insert `store_code`, không update `store_name` (giữ nguyên giá trị cũ nếu đã tồn tại)
  - Nếu `storeName` có giá trị: Insert hoặc update với `COALESCE` (chỉ update nếu giá trị mới không null)
- **SQL Strategy**:
  ```sql
  -- Nếu storeName null/undefined
  INSERT INTO stores (store_code, store_name)
  VALUES (?, NULL)
  ON DUPLICATE KEY UPDATE store_code = store_code
  
  -- Nếu storeName có giá trị
  INSERT INTO stores (store_code, store_name)
  VALUES (?, ?)
  ON DUPLICATE KEY UPDATE 
    store_name = COALESCE(VALUES(store_name), store_name)
  ```
- **Return**: `store_id` (integer)

**Files liên quan:**
- `src/models/NewDbModel.js` - Method `upsertStore()`
- `src/services/etl/LoadService.js` - Gọi `upsertStore()` trong `loadToNewDb()`
- `sql/02_create_new_db.sql` - Schema của bảng `stores`

#### 1.2. Upsert `customers` (Customers Table)
- **Method**: `NewDbModel.upsertCustomer(phone, fullName, email)`
- **Unique key**: `phone`
- **Upsert logic**: 
  - Insert nếu chưa tồn tại
  - Update nếu đã tồn tại với `COALESCE` (chỉ update các fields nếu giá trị mới không null)
- **SQL Strategy**:
  ```sql
  INSERT INTO customers (phone, full_name, email)
  VALUES (?, ?, ?)
  ON DUPLICATE KEY UPDATE 
    full_name = COALESCE(VALUES(full_name), full_name),
    email = COALESCE(VALUES(email), email)
  ```
- **Return**: `customer_id` (integer hoặc null nếu phone là null)

**Files liên quan:**
- `src/models/NewDbModel.js` - Method `upsertCustomer()`
- `src/services/etl/LoadService.js` - Gọi `upsertCustomer()` trong `loadToNewDb()`
- `sql/02_create_new_db.sql` - Schema của bảng `customers`

#### 1.3. Upsert `products` (Products Table)
- **Method**: `NewDbModel.upsertProduct(sku, productName, category)`
- **Unique key**: `sku`
- **Upsert logic**: 
  - `product_name`: Chỉ update nếu giá trị mới không empty (sử dụng `NULLIF` để xử lý empty string)
  - `category`: Chỉ update nếu giá trị mới không null (sử dụng `COALESCE`)
- **SQL Strategy**:
  ```sql
  INSERT INTO products (sku, product_name, category)
  VALUES (?, ?, ?)
  ON DUPLICATE KEY UPDATE 
    product_name = COALESCE(NULLIF(VALUES(product_name), ''), product_name),
    category = COALESCE(VALUES(category), category)
  ```
- **Return**: `product_id` (integer)

**Files liên quan:**
- `src/models/NewDbModel.js` - Method `upsertProduct()`
- `src/services/etl/LoadService.js` - Gọi `upsertProduct()` trong `loadToNewDb()`
- `sql/02_create_new_db.sql` - Schema của bảng `products`

### 2. Insert vào Fact Tables

#### 2.1. Upsert `orders` (Orders Table)
- **Method**: `NewDbModel.upsertOrder(orderCode, storeId, customerId, orderDatetime)`
- **Unique key**: `order_code`
- **Upsert logic**: 
  - Insert nếu chưa tồn tại
  - Update nếu đã tồn tại (update tất cả fields: store_id, customer_id, order_datetime)
- **SQL Strategy**:
  ```sql
  INSERT INTO orders (order_code, store_id, customer_id, order_datetime)
  VALUES (?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE 
    store_id = VALUES(store_id),
    customer_id = VALUES(customer_id),
    order_datetime = VALUES(order_datetime)
  ```
- **Return**: `order_id` (integer)

**Files liên quan:**
- `src/models/NewDbModel.js` - Method `upsertOrder()`
- `src/services/etl/LoadService.js` - Gọi `upsertOrder()` trong `loadToNewDb()`
- `sql/02_create_new_db.sql` - Schema của bảng `orders`

#### 2.2. Insert `order_items` (Order Items Table)
- **Method**: `NewDbModel.insertOrderItem(orderId, productId, qty, unitPrice, currency)`
- **No upsert**: Chỉ insert (không có unique constraint, cho phép duplicate items trong cùng order)
- **SQL Strategy**:
  ```sql
  INSERT INTO order_items (order_id, product_id, qty, unit_price, currency)
  VALUES (?, ?, ?, ?, ?)
  ```
- **Return**: `insertId` (integer)

**Files liên quan:**
- `src/models/NewDbModel.js` - Method `insertOrderItem()`
- `src/services/etl/LoadService.js` - Gọi `insertOrderItem()` trong `loadToNewDb()`
- `sql/02_create_new_db.sql` - Schema của bảng `order_items`

### 3. Load Service Orchestration
- **Method**: `LoadService.loadToNewDb(validData)`
- **Chức năng**: 
  - Load dữ liệu đã transform vào new_db
  - Xử lý từng record một cách tuần tự
  - Upsert dimensions → Upsert order → Insert order items
  - Log success/error cho mỗi record
  - Publish message vào RabbitMQ sau khi load xong
- **Return**: `{ success: number, errors: number }`

**Files liên quan:**
- `src/services/etl/LoadService.js` - Method `loadToNewDb()`

### 4. Error Handling và Logging
- **Success logging**: Log mỗi record thành công vào `etl_logs` với status `success`
- **Error logging**: Log mỗi record lỗi vào `etl_logs` với status `error` và error_details (JSON)
- **Error handling**: Không dừng toàn bộ process nếu một record fail, tiếp tục xử lý các records khác

**Files liên quan:**
- `src/services/etl/LoadService.js` - Method `loadToNewDb()` (try-catch cho mỗi record)
- `src/models/NewDbModel.js` - Method `insertLog()`

---

## Các file cần đọc và hiểu

### Load Service
1. **`src/services/etl/LoadService.js`**
   - `loadToNewDb(validData)` - Method chính load dữ liệu vào new_db
   - `logValidationErrors(invalidData)` - Log validation errors vào database
   - Flow: Upsert dimensions → Upsert order → Insert order items → Log success/error

### Database Model
2. **`src/models/NewDbModel.js`**
   - `upsertStore(storeCode, storeName)` - Upsert store dimension
   - `upsertCustomer(phone, fullName, email)` - Upsert customer dimension
   - `upsertProduct(sku, productName, category)` - Upsert product dimension
   - `upsertOrder(orderCode, storeId, customerId, orderDatetime)` - Upsert order (fact table)
   - `insertOrderItem(orderId, productId, qty, unitPrice, currency)` - Insert order item (fact table)
   - `insertLog(...)` - Insert log vào `etl_logs`

### SQL Schema
3. **`sql/02_create_new_db.sql`**
   - Schema của Data Warehouse (Star Schema)
   - Tables: `stores`, `customers`, `products`, `orders`, `order_items`, `etl_logs`
   - Indexes và constraints (foreign keys, unique keys)

### ETL Service (Integration)
4. **`src/services/etl/ProcessService.js`**
   - Sử dụng LoadService để load dữ liệu đã transform
   - Orchestrate toàn bộ ETL flow

---

## Star Schema Structure

### Dimension Tables
- **`stores`** (dim_store)
  - `id` (PK, auto increment)
  - `store_code` (UK, varchar(10))
  - `store_name` (varchar(255), nullable)
  - `created_at` (timestamp)

- **`customers`** (dim_customer)
  - `id` (PK, auto increment)
  - `phone` (UK, varchar(20), nullable)
  - `full_name` (varchar(255), nullable)
  - `email` (varchar(255), nullable)
  - `created_at` (timestamp)

- **`products`** (dim_product)
  - `id` (PK, auto increment)
  - `sku` (UK, varchar(20))
  - `product_name` (varchar(255))
  - `category` (varchar(100), nullable)
  - `created_at` (timestamp)

### Fact Tables
- **`orders`** (fact_sales - header)
  - `id` (PK, auto increment)
  - `order_code` (UK, varchar(50))
  - `store_id` (FK → stores.id)
  - `customer_id` (FK → customers.id, nullable)
  - `order_datetime` (datetime)
  - `created_at` (timestamp)

- **`order_items`** (fact_sales - detail)
  - `id` (PK, auto increment)
  - `order_id` (FK → orders.id)
  - `product_id` (FK → products.id)
  - `qty` (int)
  - `unit_price` (decimal(18,2))
  - `currency` (varchar(10), default 'VND')
  - `created_at` (timestamp)

---

## Luồng xử lý

### Load Flow
```
Transformed Data (from Transform)
    ↓
LoadService.loadToNewDb(validData)
    ↓
For each record:
    ├─ Upsert Store (get store_id)
    │   └─ NewDbModel.upsertStore(storeCode, storeName)
    ├─ Upsert Customer (get customer_id, có thể null)
    │   └─ NewDbModel.upsertCustomer(phone, fullName, email)
    ├─ Upsert Product (get product_id)
    │   └─ NewDbModel.upsertProduct(sku, productName, category)
    ├─ Upsert Order (get order_id)
    │   └─ NewDbModel.upsertOrder(orderCode, storeId, customerId, orderDatetime)
    ├─ Insert Order Item
    │   └─ NewDbModel.insertOrderItem(orderId, productId, qty, unitPrice, currency)
    └─ Log success/error
        └─ NewDbModel.insertLog(...)
    ↓
Publish message → RabbitMQ (load.data)
    ↓
Return statistics (successCount, errorCount)
```

### Upsert Strategy (Chi tiết)
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
- **Special handling**: 
  - Nếu `storeName` là null/undefined: Chỉ insert `store_code`, không update `store_name` (giữ nguyên giá trị cũ)
  - Nếu `storeName` có giá trị: Insert hoặc update với `COALESCE`

### Customers
- **Unique key**: `phone`
- **Special handling**: 
  - `phone` có thể null (optional)
  - Nếu `phone` là null → Return null (không insert)
  - Upsert với `COALESCE` cho `full_name` và `email`
  - Chỉ update các fields nếu giá trị mới không null

### Products
- **Unique key**: `sku`
- **Special handling**: 
  - `product_name`: Chỉ update nếu giá trị mới không empty (sử dụng `NULLIF` để xử lý empty string)
  - `category`: Chỉ update nếu giá trị mới không null (sử dụng `COALESCE`)

### Orders
- **Unique key**: `order_code`
- **Special handling**: 
  - Update tất cả fields nếu đã tồn tại (store_id, customer_id, order_datetime)
  - `customer_id` có thể null (optional)

### Order Items
- **No upsert**: Chỉ insert (không có unique constraint)
- **Special handling**: 
  - Cho phép duplicate items trong cùng order
  - Foreign keys: `order_id`, `product_id`

---

## Lưu ý quan trọng

1. **Upsert Strategy**: 
   - Sử dụng `ON DUPLICATE KEY UPDATE` với `COALESCE` để chỉ update các fields không null
   - Đảm bảo không ghi đè dữ liệu đã có nếu giá trị mới là null
   - Sử dụng `NULLIF` cho `product_name` để xử lý empty string

2. **Foreign Keys**: 
   - Đảm bảo upsert dimensions trước khi insert fact table
   - `customer_id` có thể null (optional)
   - Foreign key constraints đảm bảo referential integrity

3. **Error Handling**: 
   - Xử lý lỗi cho từng record riêng biệt
   - Log tất cả errors vào `etl_logs` với error_details (JSON)
   - Không dừng toàn bộ process nếu một record fail
   - Continue processing các records khác

4. **Performance**: 
   - Xử lý từng record một (không batch) để đảm bảo data integrity
   - Logging không block ETL process
   - Sử dụng prepared statements

5. **Data Integrity**: 
   - Đảm bảo không có duplicate orders (unique constraint trên `order_code`)
   - Đảm bảo foreign keys hợp lệ
   - Validate data trước khi insert (đã được validate trong Transform)

6. **Logging**: 
   - Log success cho mỗi record thành công
   - Log error cho mỗi record lỗi với chi tiết đầy đủ
   - Status: `success` hoặc `error`
   - Error details: JSON chứa error message và row data

7. **Null Handling**: 
   - `customer_phone` có thể null → `customer_id` có thể null
   - `store_name`, `customer_name`, `category` có thể null
   - Xử lý null một cách an toàn trong upsert logic

8. **Transaction**: 
   - Hiện tại không sử dụng transaction (xử lý từng record riêng biệt)
   - Có thể cân nhắc sử dụng transaction cho batch processing trong tương lai

---

## Tiến độ
✅ Hoàn thành - Load DW hoạt động ổn định với đầy đủ upsert logic
