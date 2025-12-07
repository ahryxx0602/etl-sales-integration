# Hệ thống ETL và chuẩn hoá dữ liệu giao dịch bán hàng đa nguồn (CSV + database) cho cửa hàng thiết bị điện tử

## 📋 Tổng quan

Hệ thống ETL (Extract, Transform, Load) được xây dựng để xử lý và chuẩn hóa dữ liệu giao dịch bán hàng từ nhiều nguồn khác nhau (CSV, Database) cho cửa hàng thiết bị điện tử. Hệ thống sử dụng RabbitMQ để tách biệt các bước xử lý, đảm bảo tính tin cậy, khả năng mở rộng và dễ bảo trì.

## ✨ Tính năng chính

- 🔄 **Pipeline ETL hoàn chỉnh**: Extract → Validate → Transform → Load
- 📊 **Xử lý đa nguồn**: CSV files, Old Database, Raw Orders
- ✅ **Validation mạnh mẽ**: Kiểm tra schema, format, giá trị hợp lệ
- 🔧 **Chuẩn hóa dữ liệu**: Ngày tháng, tiền tệ, SKU, tên sản phẩm
- 🏗️ **Data Warehouse**: Star Schema với dimension và fact tables
- 📝 **Logging & Monitoring**: Ghi log đầy đủ, dashboard thống kê
- 🚀 **RabbitMQ Integration**: Xử lý bất đồng bộ, tách biệt các bước
- 🎯 **Dead Letter Queue**: Xử lý lỗi và retry

## 🏗️ Kiến trúc

```
┌─────────────┐
│   Sources   │  CSV Files, Old DB, Raw Orders
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Extract   │  Đọc và enrich dữ liệu
└──────┬──────┘
       │ RabbitMQ (extract.*)
       ▼
┌─────────────┐
│  Validate   │  Kiểm tra schema, format, giá trị
└──────┬──────┘
       │ RabbitMQ (transform.*)
       ▼
┌─────────────┐
│  Transform  │  Chuẩn hóa format, mapping
└──────┬──────┘
       │ RabbitMQ (load.*)
       ▼
┌─────────────┐
│    Load     │  Load vào Data Warehouse
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Data Warehouse │ Star Schema
└─────────────┘
```

## 📦 Cài đặt

### Yêu cầu hệ thống

- Node.js >= 18.x
- MySQL >= 8.0
- RabbitMQ (tùy chọn - hệ thống vẫn chạy được nếu không có)

### Bước 1: Clone repository

```bash
git clone https://github.com/ahryxx0602/etl-sales-integration.git
cd etl-sales-integration
```

### Bước 2: Cài đặt dependencies

```bash
npm install
```

### Bước 3: Cấu hình môi trường

Tạo file `.env` trong thư mục `etl-sales-integration`:

```env
# MySQL Database Configuration
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASS=

# CSV Directory
CSV_DIR=data

# Server Configuration
PORT=3001

# RabbitMQ Configuration (Optional)
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

**Lưu ý**: 
- Hệ thống sử dụng `NewDbModel` với raw SQL queries

### Bước 4: Tạo databases và Fake Data

#### Cách nhanh nhất (Khuyến nghị):

```bash
# Bước 1: Tạo databases và tables (không có dữ liệu)
mysql -u root -p < sql/00_setup_all.sql

# Bước 2: Insert fake data với nhiều lỗi để test validation và transform
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
```

#### Về Fake Data:

Fake data trong file `sql/03_insert_fake_data.sql` được thiết kế đặc biệt để **test validation và transform** trong ETL process với **235 records** bao gồm:

- **15 stores** (5 có lỗi chính tả - 33%)
- **30 customers** (15 có lỗi chính tả/email - 50%)
- **40 products** (20 có lỗi chính tả - 50%)
- **50 orders** (35 có lỗi định dạng ngày - 70%)
- **100 order items** (nhiều lỗi kết hợp)

**Các loại lỗi trong fake data:**
- ✅ **Sai chính tả**: thiếu dấu (`Nguyen Van`), chữ hoa sai (`LapTop`), viết tắt sai (`Lap top`)
- ✅ **Định dạng tiền tệ sai**: có dấu phẩy (`15,000,000`), dấu chấm (`15.000.000`)
- ✅ **Định dạng ngày tháng sai**: `15/01/2024`, `18-01-2024`, `2024/01/19`, thiếu giờ/giây
- ✅ **Số lượng sai**: chữ (`one`, `two`), số thập phân (`2.5`)
- ✅ **Currency sai**: chữ thường (`vnd`), loại tiền sai (`USD`, `EUR`)
- ✅ **Email sai**: thiếu `.com` (`tranthihoa@email`), format sai

**Tại sao cần fake data có lỗi?**
1. **Test Validation Service**: Kiểm tra khả năng phát hiện lỗi
2. **Test Transform Service**: Kiểm tra khả năng chuẩn hóa dữ liệu
3. **Test Error Handling**: Kiểm tra việc ghi log lỗi vào `etl_logs`
4. **Test Data Quality**: Đảm bảo chỉ dữ liệu hợp lệ được load vào Data Warehouse

📖 **Xem chi tiết**: Xem file `sql/README.md` để biết thêm về cấu trúc SQL scripts và fake data.

## 🚀 Sử dụng

### Khởi động Web Dashboard

```bash
npm start
```

Truy cập: http://localhost:3001

### CLI Commands

#### Xử lý từ Old Database:
```bash
npm run process:old-db
```

#### Xử lý từ CSV files:
```bash
npm run process:csv
```

#### Kiểm tra kết nối database:
```bash
npm run test:db
```

#### Import dữ liệu mẫu:
```bash
npm run import:sample
```

## 📡 API Endpoints

### ETL Processing

- `POST /api/etl/process/old-db` - Xử lý từ old_db
- `POST /api/etl/process/csv` - Upload và xử lý CSV file
- `POST /api/etl/process/csv-folder` - Xử lý tất cả CSV files từ thư mục `data/`
- `POST /api/etl/process/raw-orders` - Xử lý từ raw_orders

### Statistics & Logs

- `GET /api/etl/stats` - Thống kê tổng quan
- `GET /api/etl/logs` - Xem logs ETL
- `GET /api/etl/logs?limit=50&offset=0&status=error` - Lọc logs theo status (success/error/validation_error)
- `GET /api/etl/logs?limit=50&offset=0` - Pagination cho logs

### Data Query

- `GET /api/etl/stores` - Danh sách cửa hàng (có pagination)
- `GET /api/etl/customers` - Danh sách khách hàng (có pagination)
- `GET /api/etl/products` - Danh sách sản phẩm (có pagination)
- `GET /api/etl/orders` - Danh sách đơn hàng (có pagination)
- `GET /api/etl/order-items` - Danh sách chi tiết đơn hàng (có pagination)

### Health Check

- `GET /health` - Kiểm tra trạng thái server
- `GET /health/rabbitmq` - Kiểm tra kết nối RabbitMQ

### API Documentation

- `GET /api-docs` - Swagger/OpenAPI documentation (truy cập qua browser)

## 📊 Quy trình ETL

### 1. Extract (Trích xuất)

- Đọc dữ liệu từ CSV files trong thư mục `data/`
- Đọc dữ liệu từ Old Database (`old_orders`, `old_order_items`)
- Đọc dữ liệu từ Raw Orders table
- Enrich dữ liệu với thông tin từ lookup tables (stores, customers, products)

**Files liên quan:**
- `src/services/etl/ExtractService.js`
- `src/cli/processOldDb.js`
- `src/cli/processCsv.js`

### 2. Validate (Kiểm tra)

- Kiểm tra schema và format dữ liệu
- Validate email, phone, date format
- Kiểm tra giá trị hợp lệ (qty > 0, price > 0)
- Dữ liệu hợp lệ → forward sang Transform
- Dữ liệu không hợp lệ → gửi vào DLQ

**Files liên quan:**
- `src/services/validation/ValidationService.js`
- `src/services/validation/*.js` (CustomerValidationService, OrderValidationService, ProductValidationService, StoreValidationService)

### 3. Transform (Chuẩn hóa)

- Chuẩn hóa format ngày tháng → `YYYY-MM-DD`
- Chuẩn hóa tiền tệ (VND, USD, EUR...)
- Chuẩn hóa SKU và tên sản phẩm
- Tính toán `order_line_id` và `total_price`
- Mapping category
- Sửa dấu tiếng Việt

**Files liên quan:**
- `src/services/TransformService.js`
- `src/utils/vietnameseUtils.js`
- `src/utils/dateUtils.js`
- `src/schemas/orderSchema.js` (Joi validation schema)

### 4. Load (Tải vào DW)

- Upsert dimension tables (stores, customers, products)
- Insert vào fact table (orders, order_items)
- Ghi log success/error
- Publish message vào RabbitMQ

**Files liên quan:**
- `src/services/etl/LoadService.js`
- `src/models/NewDbModel.js`
- `src/services/lookup/*.js` (StoreLookupService, CustomerLookupService, ProductLookupService)

## 🗄️ Database Schema

### Old DB (Nguồn - `old_db`)
- `old_stores` - Thông tin cửa hàng
- `old_customers` - Thông tin khách hàng
- `old_products` - Thông tin sản phẩm
- `old_orders` - Đơn hàng
- `old_order_items` - Chi tiết đơn hàng
- `raw_orders` - Dữ liệu thô từ CSV

### New DB (Đích - `new_db`)

#### Dimension Tables (Normalized)
- `stores` - Thông tin cửa hàng (store_code, store_name)
- `customers` - Thông tin khách hàng (phone, full_name, email)
- `products` - Thông tin sản phẩm (sku, product_name, category)

#### Fact Tables
- `orders` - Đơn hàng (order_code, store_id, customer_id, order_datetime)
- `order_items` - Chi tiết đơn hàng (order_id, product_id, qty, unit_price, currency)

#### Logging
- `etl_logs` - Logs ETL (source_table, source_type, status, message, error_details)

## 🔍 Validation Rules

| Trường | Rule |
|--------|------|
| `store_code` | 1-10 ký tự, không rỗng |
| `customer_phone` | 10-11 chữ số, có thể null |
| `customer_email` | Format email hợp lệ, có thể null |
| `order_code` | Không rỗng |
| `item_sku` | 1-20 ký tự, không rỗng |
| `item_name` | Không rỗng, ≤ 100 ký tự |
| `qty` | Số nguyên dương (> 0) |
| `unit_price` | Số dương (> 0, ≤ 100,000,000) |
| `order_date` | Format datetime hợp lệ |

## 🐰 RabbitMQ Topology

### Exchange
- **Name**: `etl.exchange`
- **Type**: `topic`
- **Durable**: `true`

### Queues
- `etl.extract` - Nhận messages khi extract (routing: `extract.*`)
- `etl.transform` - Nhận messages khi transform (routing: `transform.*`)
- `etl.load` - Nhận messages khi load (routing: `load.*`)
- `etl.complete` - Nhận thông báo hoàn thành (routing: `complete.*`)

**Lưu ý**: RabbitMQ được sử dụng chủ yếu để publish messages cho monitoring và logging. Các bước ETL chạy tuần tự trong cùng một process, không tách thành workers riêng biệt.

## 📝 Logging

Tất cả các bước ETL được ghi vào bảng `etl_logs` với:
- `status`: `success`, `error`, `validation_error`
- `message`: Mô tả chi tiết
- `error_details`: JSON chứa thông tin lỗi (nếu có)
- `source_table`, `source_type`, `order_code`: Metadata
- `record_id`: ID từ source table (old_orders, raw_orders) để traceback

### Filter Logs

API `/api/etl/logs` hỗ trợ filter theo status:
- `?status=success` - Chỉ lấy logs thành công
- `?status=error` - Chỉ lấy logs lỗi
- `?status=validation_error` - Chỉ lấy validation errors
- `?limit=50&offset=0` - Pagination

## 🎯 Dashboard

Web Dashboard cung cấp:
- 📊 Thống kê tổng quan (staging, DW, logs)
- 📤 Upload file CSV vào pipeline
- 🔄 Monitor trạng thái RabbitMQ queues
- 📋 Xem logs ETL real-time
- 📈 Xem dữ liệu từ Data Warehouse

## 🛠️ Công nghệ sử dụng

| Thành phần | Công nghệ |
|-----------|-----------|
| Backend | Node.js + Express |
| Database | MySQL 8.0 |
| Message Queue | RabbitMQ (amqplib) |
| Template Engine | EJS |
| Logging | Pino |
| Validation | Joi + Custom validation services |
| Date Parsing | dayjs |
| CSV Parser | csv-parse |
| API Documentation | Swagger/OpenAPI |

## 📁 Cấu trúc thư mục

```
etl-sales-integration/
├── src/
│   ├── config/          # Cấu hình
│   ├── models/          # Data Access Layer
│   │   ├── NewDbModel.js    # Raw SQL queries cho new_db
│   │   └── OldDbModel.js    # Raw SQL queries cho old_db
│   ├── services/        # Business Logic
│   │   ├── etl/         # ETL services
│   │   ├── validation/  # Validation services
│   │   ├── lookup/      # Lookup services
│   │   └── rabbitmq/    # RabbitMQ services
│   ├── controllers/     # Controllers
│   ├── routes/          # Routes
│   │   ├── etlRoutes.js      # Main router
│   │   ├── processRoutes.js  # ETL processing routes
│   │   ├── dataRoutes.js     # Data query routes
│   │   └── rabbitMQRoutes.js # RabbitMQ routes
│   ├── middleware/      # Middleware
│   │   ├── upload.js    # Multer config cho CSV upload
│   │   ├── errorHandler.js  # Error handling middleware
│   │   ├── pagination.js    # Pagination helpers
│   │   └── validators.js    # Request validation middleware
│   ├── cli/             # CLI scripts
│   │   ├── processOldDb.js
│   │   ├── processCsv.js
│   │   ├── testConnection.js
│   │   ├── checkOldDbData.js
│   │   └── importSampleData.js
│   ├── scripts/         # Utility scripts
│   │   └── check_new_db_data.js
│   ├── schemas/         # Validation schemas
│   │   └── orderSchema.js  # Joi schema
│   ├── types/           # Type definitions
│   │   └── etlTypes.js
│   ├── constants/        # Constants
│   │   └── etlConstants.js
│   ├── errors/          # Custom error classes
│   │   └── EtlError.js
│   └── app.js           # Express app
├── views/               # EJS templates
├── public/              # Static files
├── sql/                 # SQL scripts (setup databases và fake data)
├── data/                # CSV files directory
└── package.json
```

### Cấu trúc Routes (Refactored)

Routes đã được tách nhỏ thành các file riêng biệt để dễ bảo trì:

- **`etlRoutes.js`**: Main router, kết hợp tất cả sub-routers
- **`processRoutes.js`**: ETL processing routes (`/process/*`)
- **`dataRoutes.js`**: Data query routes (`/stats`, `/logs`, `/stores`, etc.)
- **`rabbitMQRoutes.js`**: RabbitMQ status routes (`/rabbitmq/*`)
- **`middleware/upload.js`**: Multer configuration cho CSV upload (tái sử dụng)

## 👥 Phân công nhiệm vụ

Xem các file markdown trong thư mục gốc:
- `Phan_Van_Thanh.md` - Ingest + Load DW
- `Do_Huynh_Tai.md` - Validate
- `Tran_Duc_Canh.md` - Transform
- `Do_Thien_Sang.md` - Load DW
- `Duong_Dinh_Hieu.md` - Log/Monitor

## 🐛 Troubleshooting

### Lỗi kết nối MySQL
- Kiểm tra MySQL đang chạy
- Kiểm tra thông tin trong `.env` (MYSQL_HOST, MYSQL_USER, MYSQL_PASS)
- Kiểm tra databases đã được tạo

### Lỗi kết nối RabbitMQ
- RabbitMQ là tùy chọn, hệ thống vẫn chạy được nếu không có
- Kiểm tra RabbitMQ đang chạy: `rabbitmqctl status`
- Kiểm tra URL trong `.env`: `RABBITMQ_URL=amqp://guest:guest@localhost:5672`

### Lỗi "Table doesn't exist"
- Chạy lại các file SQL trong thư mục `sql/`
- Kiểm tra database name trong `.env`
- Chạy script setup: `mysql -u root -p < sql/00_setup_all.sql`

### Lỗi khi insert fake data
- Đảm bảo đã chạy `00_setup_all.sql` trước
- Kiểm tra quyền của user MySQL
- Xem chi tiết trong `sql/README.md`

### Reset dữ liệu để test lại
```bash
# Xóa dữ liệu trong new_db (giữ nguyên old_db)
mysql -u root -p < sql/05_utility_truncate.sql

# Hoặc xóa tất cả và tạo lại từ đầu
mysql -u root -p < sql/00_setup_all.sql
mysql -u root -p < sql/03_insert_fake_data.sql
```

## 🔄 CI/CD Pipeline

Dự án đã được cấu hình CI/CD tự động với GitHub Actions.

### Workflows

1. **CI Pipeline** (`.github/workflows/ci.yml`)
   - Tự động chạy khi push/PR vào các nhánh `main`, `master`, `develop`
   - Kiểm tra lint với ESLint
   - Kiểm tra build
   - Security audit

2. **Lint & Code Quality** (`.github/workflows/lint.yml`)
   - Kiểm tra code style với ESLint
   - Tự động chạy khi push/PR

3. **CD Pipeline** (`.github/workflows/cd.yml`)
   - Tự động chạy khi push vào nhánh `main`/`master` hoặc tạo tag `v*`
   - Tạo deployment package
   - (Tùy chọn) Deploy tự động lên server

4. **Release** (`.github/workflows/release.yml`)
   - Tự động chạy khi push tag `v*.*.*`
   - Chạy linting
   - Generate changelog
   - Tạo GitHub release

### Xem kết quả CI/CD

1. Vào repository trên GitHub
2. Click tab **Actions**
3. Xem trạng thái các workflow runs

### Cấu hình thêm (tùy chọn)

Để bật auto-deploy, cần cấu hình GitHub Secrets:
- `HOST`: Địa chỉ server
- `USERNAME`: Username SSH
- `SSH_KEY`: Private key SSH

Sau đó uncomment các bước deploy trong file `cd.yml`.

## 📚 Tài liệu tham khảo

### Tài liệu dự án
- **SQL Scripts & Fake Data**: Xem `sql/README.md` để biết chi tiết về:
  - Cấu trúc SQL scripts
  - Hướng dẫn setup databases
  - Chi tiết về fake data và các loại lỗi
  - Troubleshooting SQL

### Tài liệu ngoài
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## 📄 License

ISC

## 🔗 Links

- **GitHub**: https://github.com/ahryxx0602/etl-sales-integration.git
- **Documentation**: Xem file `Doc.md` để biết chi tiết về đề tài

---

**Lưu ý**: Đảm bảo chạy các lệnh từ thư mục `etl-sales-integration`, không phải thư mục `DoAn`.

