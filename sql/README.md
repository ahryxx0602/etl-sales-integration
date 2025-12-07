# SQL Scripts Documentation

## 👋 Hướng dẫn cho người mới

### Bước 1: Clone/Kéo dự án về

```bash
# Clone repository
git clone <repository-url>
cd etl-rmq

# Hoặc nếu đã có dự án, pull code mới nhất
git pull origin main
```

### Bước 2: Kiểm tra yêu cầu hệ thống

Đảm bảo bạn đã cài đặt:
- **MySQL** (version 5.7+ hoặc 8.0+)
- **MySQL Client** (để chạy các script SQL)

Kiểm tra MySQL:
```bash
mysql --version
```

### Bước 3: Setup Databases và Fake Data

#### Cách nhanh nhất (Khuyến nghị cho người mới):

```bash
# Bước 1: Tạo databases và tables (không có dữ liệu)
mysql -u root -p < sql/00_setup_all.sql

# Bước 2: Insert fake data với nhiều lỗi để test
mysql -u root -p < sql/03_insert_fake_data.sql
```

**Lưu ý**: 
- Thay `root` bằng username MySQL của bạn
- Nhập password khi được yêu cầu
- Script sẽ **DROP và tạo lại** databases, nên backup nếu có dữ liệu quan trọng

#### Kiểm tra dữ liệu đã được insert:

```bash
# Kết nối MySQL
mysql -u root -p

# Kiểm tra old_db
USE old_db;
SELECT COUNT(*) AS total_stores FROM old_stores;        -- Kỳ vọng: 15
SELECT COUNT(*) AS total_customers FROM old_customers;   -- Kỳ vọng: 30
SELECT COUNT(*) AS total_products FROM old_products;    -- Kỳ vọng: 40
SELECT COUNT(*) AS total_orders FROM old_orders;        -- Kỳ vọng: 50
SELECT COUNT(*) AS total_items FROM old_order_items;    -- Kỳ vọng: 100

# Xem một vài records mẫu
SELECT * FROM old_customers LIMIT 5;
SELECT * FROM old_products LIMIT 5;
SELECT * FROM old_orders LIMIT 5;
```

### Bước 4: Hiểu về Fake Data

Fake data trong file `03_insert_fake_data.sql` được thiết kế đặc biệt để **test validation và transform** trong ETL process:

#### Tại sao cần fake data có lỗi?

1. **Test Validation Service**: Kiểm tra khả năng phát hiện lỗi
2. **Test Transform Service**: Kiểm tra khả năng chuẩn hóa dữ liệu
3. **Test Error Handling**: Kiểm tra việc ghi log lỗi vào `etl_logs`
4. **Test Data Quality**: Đảm bảo chỉ dữ liệu hợp lệ được load vào Data Warehouse

#### Các loại lỗi trong fake data:

| Loại lỗi | Ví dụ | Số lượng |
|----------|-------|----------|
| **Sai chính tả** | `Nguyen Van` (thiếu dấu), `LapTop` (chữ hoa sai) | ~50% records |
| **Định dạng tiền tệ sai** | `15,000,000` (có dấu phẩy), `15.000.000` (có dấu chấm) | ~40 items |
| **Định dạng ngày sai** | `15/01/2024`, `18-01-2024`, `2024/01/19` | ~70% orders |
| **Số lượng sai** | `one`, `two` (chữ), `2.5` (thập phân) | ~15 items |
| **Currency sai** | `vnd` (chữ thường), `USD`, `EUR` | ~10 items |
| **Email sai** | `tranthihoa@email` (thiếu .com) | ~3 customers |

### Bước 5: Các bước tiếp theo

Sau khi setup xong databases và fake data:

1. **Chạy ETL Process**: Sử dụng fake data để test ETL pipeline
2. **Kiểm tra Validation**: Xem các lỗi có được phát hiện không
3. **Kiểm tra Transform**: Xem dữ liệu có được chuẩn hóa đúng không
4. **Kiểm tra Logs**: Xem `etl_logs` trong `new_db` có ghi lại các lỗi không

### Troubleshooting

#### Lỗi: "Access denied for user"
```bash
# Kiểm tra username và password
mysql -u <your-username> -p

# Hoặc tạo user mới với quyền đầy đủ
mysql -u root -p
CREATE USER 'etl_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON *.* TO 'etl_user'@'localhost';
FLUSH PRIVILEGES;
```

#### Lỗi: "Unknown database"
```bash
# Chạy lại script tạo databases
mysql -u root -p < sql/00_setup_all.sql
```

#### Lỗi: "Table already exists"
```bash
# Scripts đã có DROP DATABASE, nên không cần lo lắng
# Nếu vẫn lỗi, kiểm tra quyền của user MySQL
```

#### Reset dữ liệu để test lại:
```bash
# Xóa dữ liệu trong new_db (giữ nguyên old_db)
mysql -u root -p < sql/05_utility_truncate.sql

# Hoặc xóa tất cả và tạo lại từ đầu
mysql -u root -p < sql/00_setup_all.sql
mysql -u root -p < sql/03_insert_fake_data.sql
```

---

## 📁 Cấu trúc thư mục

```
sql/
├── 00_setup_all.sql          # Script master - tạo tất cả databases (không có data)
├── 01_create_old_db.sql      # Tạo old_db và tables
├── 02_create_new_db.sql      # Tạo new_db và tables
├── 03_insert_fake_data.sql  # Insert nhiều fake data với lỗi để test
├── 04_migrate_etl_logs.sql   # Migration: đảm bảo etl_logs có đầy đủ cột
└── 05_utility_truncate.sql  # Utility: xóa dữ liệu để test lại
```

## 🚀 Cách sử dụng

### Cách 1: Chạy script master (Khuyến nghị)

```bash
# Bước 1: Tạo databases và tables
mysql -u root -p < sql/00_setup_all.sql

# Bước 2: Insert fake data
mysql -u root -p < sql/03_insert_fake_data.sql

# Bước 3: Migration (nếu cần)
mysql -u root -p < sql/04_migrate_etl_logs.sql
```

### Cách 2: Chạy từng file riêng lẻ

```bash
# Bước 1: Tạo old_db
mysql -u root -p < sql/01_create_old_db.sql

# Bước 2: Tạo new_db
mysql -u root -p < sql/02_create_new_db.sql

# Bước 3: Insert fake data
mysql -u root -p < sql/03_insert_fake_data.sql

# Bước 4: Migration etl_logs (nếu cần)
mysql -u root -p < sql/04_migrate_etl_logs.sql
```

### Cách 3: Chạy từ MySQL CLI

```sql
-- Kết nối MySQL
mysql -u root -p

-- Chạy từng script
source sql/01_create_old_db.sql;
source sql/02_create_new_db.sql;
source sql/03_insert_fake_data.sql;
source sql/04_migrate_etl_logs.sql;
```

## 📋 Mô tả các file

### `00_setup_all.sql`
- **Mục đích**: Script master để setup databases và tables
- **Chức năng**: 
  - Tạo `old_db` (database nguồn)
  - Tạo `new_db` (data warehouse)
  - Tạo tất cả tables với đầy đủ cấu trúc
  - Migration etl_logs
- **Lưu ý**: Không có dữ liệu, cần chạy thêm `03_insert_fake_data.sql`

### `01_create_old_db.sql`
- **Mục đích**: Tạo old_db và tables cơ bản
- **Chức năng**:
  - Tạo database `old_db`
  - Tạo các bảng: old_stores, old_customers, old_products, old_orders, old_order_items, raw_orders
  - Không có dữ liệu

### `02_create_new_db.sql`
- **Mục đích**: Tạo new_db và tables chuẩn hóa
- **Chức năng**:
  - Tạo database `new_db`
  - Tạo các bảng: stores, customers, products, orders, order_items, etl_logs
  - Có foreign keys và indexes

### `03_insert_fake_data.sql`
- **Mục đích**: Insert nhiều fake data với các lỗi để test validation và transform
- **Chức năng**:
  - Insert 15 stores (5 có lỗi chính tả)
  - Insert 30 customers (15 có lỗi chính tả/email)
  - Insert 40 products (20 có lỗi chính tả)
  - Insert 50 orders (35 có lỗi định dạng ngày)
  - Insert 100 order items (nhiều lỗi: tiền tệ, số lượng, currency, tên sản phẩm)
- **Lỗi bao gồm**:
  - ✅ Sai chính tả: thiếu dấu, chữ hoa sai vị trí, viết tắt sai
  - ✅ Định dạng tiền tệ sai: có dấu phẩy, dấu chấm
  - ✅ Định dạng ngày tháng sai: dd/mm/yyyy, dd-mm-yyyy, yyyy/mm/dd, thiếu giờ/giây
  - ✅ Số lượng sai: chữ, số thập phân
  - ✅ Currency sai: chữ thường, loại tiền sai
  - ✅ Kết hợp nhiều lỗi

### `04_migrate_etl_logs.sql`
- **Mục đích**: Đảm bảo bảng etl_logs có đầy đủ các cột
- **Chức năng**:
  - Kiểm tra và thêm các cột: source_type, order_code, record_id, error_details
  - Thêm index nếu chưa có
  - An toàn để chạy nhiều lần (idempotent)

### `05_utility_truncate.sql`
- **Mục đích**: Xóa dữ liệu để test lại ETL process
- **Chức năng**:
  - Truncate tất cả tables trong `new_db`
  - Giữ nguyên cấu trúc tables
  - **Lưu ý**: Chỉ xóa dữ liệu trong new_db, không ảnh hưởng old_db

## 🗄️ Cấu trúc Databases

### old_db (Database nguồn)
- `old_stores` - Thông tin cửa hàng (15 records)
- `old_customers` - Thông tin khách hàng (30 records)
- `old_products` - Thông tin sản phẩm (40 records)
- `old_orders` - Đơn hàng (50 records)
- `old_order_items` - Chi tiết đơn hàng (100 records)
- `raw_orders` - Dữ liệu thô từ CSV

### new_db (Data Warehouse)
- `stores` - Cửa hàng (chuẩn hóa)
- `customers` - Khách hàng (chuẩn hóa)
- `products` - Sản phẩm (chuẩn hóa)
- `orders` - Đơn hàng (chuẩn hóa)
- `order_items` - Chi tiết đơn hàng (chuẩn hóa)
- `etl_logs` - Logs ETL process

## 📊 Thống kê Fake Data

File `03_insert_fake_data.sql` chứa **235 records** với nhiều lỗi để test validation và transform:

- **Stores**: 15 records (5 có lỗi chính tả - 33%)
- **Customers**: 30 records (15 có lỗi chính tả/email - 50%)
- **Products**: 40 records (20 có lỗi chính tả - 50%)
- **Orders**: 50 records (35 có lỗi định dạng ngày - 70%)
- **Order Items**: 100 records (nhiều lỗi kết hợp)

### 🎯 Chi tiết các loại lỗi trong Fake Data

#### 1. Stores (15 cửa hàng)

**Tên đúng (10 records):**
- `Cửa hàng Hà Nội`, `Cửa hàng Hồ Chí Minh`, `Cửa hàng Đà Nẵng`, etc.

**Tên sai chính tả (5 records):**
- `Cua hang Sai Gon` - Thiếu dấu: "Cua hang", "Sai Gon"
- `Cua hang Da Nang` - Thiếu dấu: "Cua hang", "Da Nang"
- `Cua hang Can Tho` - Thiếu dấu: "Cua hang", "Can Tho"
- `Cửa Hàng Hà Nội` - Chữ hoa sai: "Cửa Hàng" (chữ H hoa)
- `Cửa Hàng Hồ Chí Minh` - Chữ hoa sai: "Cửa Hàng"

#### 2. Customers (30 khách hàng)

**Tên đúng (15 records):**
- `Nguyễn Văn Anh`, `Trần Thị Bình`, `Lê Văn Cường`, `Phạm Thị Dung`, etc.

**Tên sai chính tả - Thiếu dấu (10 records):**
- `Nguyen Van Phong` - Thiếu dấu: "Nguyen Van"
- `Tran Thi Hoa` - Thiếu dấu: "Tran Thi"
- `Le Van Hung` - Thiếu dấu: "Le Van"
- `Pham Thi Lan` - Thiếu dấu: "Pham Thi"
- `Hoang Van Minh` - Thiếu dấu: "Hoang Van"
- etc.

**Email sai (3 records):**
- `tranthihoa@email` - Thiếu `.com`
- `invalid-email` - Format sai
- `tranthig@email` - Thiếu `.com`

#### 3. Products (40 sản phẩm)

**Tên đúng (20 records):**
- `Laptop Dell Inspiron 15`
- `Điện thoại Samsung Galaxy S24`
- `Tai nghe Bluetooth Sony WH-1000XM5`
- etc.

**Tên sai chính tả - Chữ hoa sai (10 records):**
- `LapTop Dell Inspiron` - "LapTop" (chữ T hoa)
- `Điện Thoại Samsung` - "Điện Thoại" (chữ T hoa)
- `Tai Nghe Bluetooth` - "Tai Nghe" (chữ N hoa)
- etc.

**Tên sai chính tả - Thiếu dấu (10 records):**
- `Dien thoai Xiaomi Redmi Note` - "Dien thoai" (thiếu dấu)
- `Dien thoai Oppo Find X` - "Dien thoai" (thiếu dấu)
- `Dien thoai Vivo Y100` - "Dien thoai" (thiếu dấu)
- etc.

#### 4. Orders (50 đơn hàng)

**Định dạng ngày đúng (15 records):**
- `2024-01-15 10:30:00`
- `2024-01-16 14:20:00`
- etc.

**Định dạng ngày sai (35 records):**
- `15/01/2024 10:30:00` - Format sai: dd/mm/yyyy (10 records)
- `18-01-2024 15:30` - Format sai: dd-mm-yyyy (10 records)
- `2024/01/19 16:00:00` - Format sai: yyyy/mm/dd (5 records)
- `2024.01.21 17:30:00` - Format sai: dấu chấm (5 records)
- `2024-01-18` - Thiếu giờ (5 records)

#### 5. Order Items (100 items)

**Dữ liệu đúng (20 items):**
- Tên sản phẩm đúng, số lượng đúng, tiền tệ đúng format, currency đúng

**Định dạng tiền tệ sai (40 items):**
- Có dấu phẩy: `'15,000,000'`, `'12,000,000'` (20 items)
- Có dấu chấm: `'15.000.000'`, `'12.000.000'` (20 items)

**Số lượng sai (15 items):**
- Chữ: `'one'`, `'two'`, `'three'` (10 items)
- Số thập phân: `'2.5'`, `'1.5'`, `'2.3'` (5 items)

**Currency sai (10 items):**
- Chữ thường: `'vnd'` (5 items)
- Loại tiền sai: `'USD'`, `'EUR'` (5 items)

**Kết hợp nhiều lỗi (15 items):**
- Tên sai + Số lượng chữ + Tiền có dấu phẩy
- Tên sai + Số lượng thập phân + Tiền có dấu chấm + Currency sai
- etc.

### 🔍 Ví dụ cụ thể về các lỗi

#### Ví dụ 1: Lỗi chính tả
```sql
-- Đúng
'Nguyễn Văn Anh'
'Laptop Dell Inspiron 15'
'Cửa hàng Hà Nội'

-- Sai
'Nguyen Van Phong'        -- Thiếu dấu
'LapTop Dell Inspiron'    -- Chữ hoa sai
'Cua hang Sai Gon'        -- Thiếu dấu
```

#### Ví dụ 2: Định dạng tiền tệ sai
```sql
-- Đúng
'15000000'

-- Sai
'15,000,000'    -- Có dấu phẩy
'15.000.000'    -- Có dấu chấm
```

#### Ví dụ 3: Định dạng ngày tháng sai
```sql
-- Đúng
'2024-01-15 10:30:00'

-- Sai
'15/01/2024 10:30:00'    -- dd/mm/yyyy
'18-01-2024 15:30'       -- dd-mm-yyyy
'2024/01/19 16:00:00'    -- yyyy/mm/dd
'2024.01.21 17:30:00'    -- Dấu chấm
'2024-01-18'             -- Thiếu giờ
```

#### Ví dụ 4: Số lượng sai
```sql
-- Đúng
'1', '2', '3'

-- Sai
'one', 'two', 'three'    -- Chữ
'2.5', '1.5'             -- Số thập phân
```

#### Ví dụ 5: Currency sai
```sql
-- Đúng
'VND'

-- Sai
'vnd'    -- Chữ thường
'USD'    -- Loại tiền sai
'EUR'    -- Loại tiền sai
```

#### Ví dụ 6: Email sai
```sql
-- Đúng
'nguyenvananh@email.com'

-- Sai
'tranthihoa@email'    -- Thiếu .com
'invalid-email'       -- Format sai
```

### 🎯 Mục đích sử dụng Fake Data

Fake data này được thiết kế để test:

1. **Validation Service**: Phát hiện các lỗi về format, giá trị không hợp lệ
2. **Transform Service**: Chuẩn hóa dữ liệu (ngày tháng, tiền tệ, tên sản phẩm)
3. **Error Handling**: Ghi log các lỗi vào `etl_logs`
4. **Data Quality**: Đảm bảo chỉ dữ liệu hợp lệ mới được load vào Data Warehouse

### 📈 Tỷ lệ lỗi trong Fake Data

- **Stores**: 33% có lỗi
- **Customers**: 50% có lỗi
- **Products**: 50% có lỗi
- **Orders**: 70% có lỗi định dạng ngày
- **Order Items**: ~80% có ít nhất 1 lỗi

Tỷ lệ lỗi cao này giúp test kỹ lưỡng khả năng xử lý lỗi của hệ thống ETL.

## ⚠️ Lưu ý

1. **Backup trước khi chạy**: Scripts sẽ DROP và tạo lại databases
2. **Encoding**: Tất cả tables dùng `utf8mb4` để hỗ trợ tiếng Việt
3. **Foreign Keys**: Có foreign key constraints giữa các bảng
4. **Idempotent**: Scripts migration an toàn để chạy nhiều lần
5. **Fake Data**: File `03_insert_fake_data.sql` chứa nhiều dữ liệu với lỗi để test validation và transform

## 🔄 Workflow khuyến nghị

1. **Lần đầu setup**:
   ```bash
   mysql -u root -p < sql/00_setup_all.sql
   mysql -u root -p < sql/03_insert_fake_data.sql
   ```

2. **Reset dữ liệu để test lại**:
   ```bash
   mysql -u root -p < sql/05_utility_truncate.sql
   ```

3. **Chỉ cần migration**:
   ```bash
   mysql -u root -p < sql/04_migrate_etl_logs.sql
   ```

4. **Chỉ tạo databases không có data**:
   ```bash
   mysql -u root -p < sql/01_create_old_db.sql
   mysql -u root -p < sql/02_create_new_db.sql
   ```
