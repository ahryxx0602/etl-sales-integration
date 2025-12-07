# ETL và Chuẩn hoá Dữ liệu Giao dịch Bán hàng Đa nguồn (CSV + Database) cho Cửa hàng Thiết bị Điện tử

**Link GitHub**: https://github.com/ahryxx0602/etl-sales-integration.git

---

## MỤC LỤC

1. [Giới thiệu đề tài](#1-giới-thiệu-đề-tài)
   - 1.1. Lý do chọn đề tài
   - 1.2. Mục tiêu của đề tài
   - 1.3. Phạm vi và đối tượng nghiên cứu

2. [Cơ sở lý thuyết](#2-cơ-sở-lý-thuyết)
   - 2.1. Khái niệm ETL
   - 2.2. Tổng quan về RabbitMQ
   - 2.3. RabbitMQ với NodeJS
   - 2.4. Đề tài: ETL và chuẩn hoá dữ liệu giao dịch bán hàng đa nguồn
   - 2.5. Chuẩn hoá dữ liệu (Data Normalization)
   - 2.6. Kiểm tra và xác thực dữ liệu (Data Validation)
   - 2.7. Công cụ và công nghệ sử dụng

3. [Quy trình ETL được đề xuất](#3-quy-trình-etl-được-đề-xuất)
   - 3.1. Kiến trúc tổng thể
   - 3.2. Bước 1 – Extract
   - 3.3. Bước 2 – Validate
   - 3.4. Bước 3 – Transform
   - 3.5. Bước 4 – Load
   - 3.6. Bước 5 – Logging và Monitoring

4. [Ứng dụng RabbitMQ trong quy trình ETL](#4-ứng-dụng-rabbitmq-trong-quy-trình-etl)

5. [Kết quả đạt được](#5-kết-quả-đạt-được)

6. [Kết luận](#6-kết-luận)

---

## 1. Giới thiệu đề tài

### 1.1. Lý do chọn đề tài

Trong bối cảnh doanh nghiệp có nhiều nguồn dữ liệu bán hàng (POS, Website, Import), việc tích hợp và chuẩn hóa dữ liệu gặp khó khăn:

- **Dữ liệu từ nhiều nguồn có format khác nhau**: Mỗi hệ thống (POS, Website, Import) có cách lưu trữ và format dữ liệu riêng, gây khó khăn trong việc tích hợp.

- **Thiếu cơ chế xử lý bất đồng bộ, mở rộng**: Các hệ thống truyền thống xử lý tuần tự, không tận dụng được khả năng xử lý song song.

- **Khó đảm bảo tính nhất quán và chất lượng dữ liệu**: Dữ liệu từ các nguồn khác nhau có thể bị trùng lặp, sai lệch, thiếu chuẩn hoá.

- **Thiếu cơ chế xử lý lỗi và giám sát**: Không có cơ chế theo dõi và xử lý lỗi một cách hệ thống.

Đề tài xây dựng hệ thống ETL sử dụng RabbitMQ để xử lý và chuẩn hóa dữ liệu bán hàng từ nhiều nguồn, đảm bảo tính tin cậy, mở rộng và dễ bảo trì.

### 1.2. Mục tiêu của đề tài

1. **Xây dựng pipeline ETL** xử lý dữ liệu từ CSV và database
2. **Áp dụng RabbitMQ** để tách các bước ETL thành các worker độc lập
3. **Thực hiện validation và normalization** dữ liệu
4. **Xây dựng Data Warehouse** theo mô hình Star Schema
5. **Đảm bảo xử lý lỗi và logging** đầy đủ

### 1.3. Phạm vi và đối tượng nghiên cứu

#### Phạm vi:
- Dữ liệu bán hàng từ 3 nguồn: **POS**, **Website**, **Import (CSV)**
- Quy trình ETL: **Extract → Validate → Transform → Load**
- Hệ thống message queue: **RabbitMQ**
- Database: **MySQL** (staging và data warehouse)

#### Đối tượng nghiên cứu:
- Kiến trúc ETL với message queue
- Cơ chế validation và normalization
- Mô hình Star Schema cho data warehouse
- Xử lý lỗi và dead letter queue

---

## 2. Cơ sở lý thuyết

### 2.1. Khái niệm ETL

**ETL (Extract, Transform, Load)** là quy trình:

- **Extract**: Trích xuất từ nguồn (CSV, DB, API)
- **Transform**: Chuẩn hóa, validate, mapping
- **Load**: Ghi vào hệ thống đích (staging, data warehouse)

**Trong dự án:**
- **Extract**: Đọc CSV từ thư mục `data/` hoặc từ database
- **Validate**: Kiểm tra schema, định dạng, giá trị hợp lệ
- **Transform**: Chuẩn hóa ngày tháng, tiền tệ, tên sản phẩm
- **Load**: Ghi vào staging và data warehouse (Star Schema)

### 2.2. Tổng quan về RabbitMQ

#### RabbitMQ là gì?

RabbitMQ là một hệ thống trung gian truyền thông điệp (Message Broker). Nó đóng vai trò trạm trung chuyển giữa các thành phần trong hệ thống phần mềm, cho phép chúng gửi – nhận dữ liệu thông qua hàng đợi (queue) thay vì phải gọi trực tiếp lẫn nhau.

#### Tại sao RabbitMQ?

- **Giảm tải server**: Web app không phải xử lý những công việc nặng (PDF, email, xử lý dữ liệu) ngay lập tức.
- **Bất đồng bộ**: User nhận phản hồi nhanh, còn tác vụ nặng thì worker xử lý phía sau.
- **Chống mất dữ liệu**: Message sẽ nằm trong queue cho đến khi consumer xử lý.
- **Đa ngôn ngữ, đa nền tảng**: Producer có thể viết bằng Node.js, consumer viết bằng Python đều OK.

#### Ví dụ về quy trình:

1. Người dùng gửi thông tin → web app.
2. Web app (producer) tạo message "xử lý PDF" → gửi vào RabbitMQ.
3. Exchange định tuyến message đến đúng queue.
4. Worker (consumer) lấy message từ queue → xử lý tạo PDF → gửi email.

#### Các khái niệm chính:

- **Producer**: Dịch vụ gửi tin nhắn.
- **Consumer**: Dịch vụ nhận & xử lý tin nhắn.
- **Message**: Dữ liệu cần gửi đi (JSON, text, …).
- **Queue**: Hàng đợi lưu tin nhắn.
- **Exchange**: Bộ định tuyến, quyết định message sẽ đi queue nào.
- **Binding**: Liên kết giữa exchange và queue.
- **Routing key**: "Địa chỉ" để exchange định tuyến message.
- **Channel**: Kết nối ảo bên trong TCP connection.
- **Vhost**: Phân vùng logic để chia tách ứng dụng trong RabbitMQ.

#### Các loại Exchange:

- **Direct**: Định tuyến đúng key.
- **Fanout**: Gửi cho tất cả queue liên kết.
- **Topic**: Định tuyến theo pattern (wildcard).
- **Headers**: Định tuyến dựa trên header của message.

### 2.3. RabbitMQ với NodeJS

#### Chuẩn bị

Thư viện amqplib cho Node.js:

```bash
npm install amqplib
```

#### Cách hoạt động:

- **Publisher (Producer)**: Gửi message vào RabbitMQ.
- **Worker (Consumer)**: Nhận message từ RabbitMQ và xử lý (ví dụ: tạo PDF, gửi email).

#### Kết nối:

- Hàm `start()` mở kết nối đến RabbitMQ.
- Nếu kết nối lỗi, nó sẽ tự động reconnect.
- Khi kết nối thành công → gọi `whenConnected()` để khởi động Publisher và Worker.

#### Publisher:

- Dùng `createConfirmChannel()` để tạo channel (kênh).
- Có `offlinePubQueue` để lưu message khi app bị offline, sau đó gửi lại.
- Hàm `publish(exchange, routingKey, content)` gửi message tới RabbitMQ.
  - `exchange`: Nơi định tuyến.
  - `routingKey`: "Địa chỉ" queue.
  - `content`: Dữ liệu message.

#### Worker:

- Dùng `createChannel()` để mở channel nhận message.
- `assertQueue("jobs", { durable: true })` đảm bảo queue jobs tồn tại và bền vững.
- `consume("jobs", processMsg, { noAck: false })`: Lắng nghe queue và gọi `processMsg` cho từng message.
- `processMsg` gọi hàm `work()` để xử lý nội dung.
- Sau khi xử lý xong:
  - **Thành công** → `ack(msg)` (RabbitMQ xóa khỏi queue).
  - **Lỗi** → `reject(msg, true)` (message quay lại queue).

### 2.4. Đề tài: ETL và chuẩn hoá dữ liệu giao dịch bán hàng đa nguồn

#### Giới thiệu:

Trong các hệ thống quản lý cửa hàng điện tử, dữ liệu giao dịch có thể đến từ nhiều nguồn:

- File CSV xuất từ hệ thống bán hàng offline.
- Dữ liệu từ Database của website bán hàng online.

Dữ liệu thường bị trùng lặp, sai lệch, thiếu chuẩn hoá (format ngày, số tiền, đơn vị, mã sản phẩm...).

Vì vậy cần một hệ thống ETL (Extract – Transform – Load) để gom, làm sạch và chuẩn hoá dữ liệu trước khi đưa vào kho dữ liệu (Data Warehouse).

#### Mục tiêu:

- Tích hợp dữ liệu từ nhiều nguồn (CSV, DB).
- Chuẩn hoá dữ liệu: định dạng ngày, mã sản phẩm, tiền tệ, loại bỏ trùng lặp.
- Tự động hoá xử lý bằng message queue (RabbitMQ) để dữ liệu được đẩy và xử lý bất đồng bộ.
- Lưu trữ sạch vào database trung tâm → phục vụ cho phân tích, báo cáo bán hàng.

#### Công nghệ sử dụng:

- **RabbitMQ**: Message broker quản lý queue.
- **Node.js + amqplib**: Publisher (đọc CSV, DB → gửi message).
- **MySQL**: Database trung tâm.

#### Kết quả mong đợi:

- Hệ thống tự động gom dữ liệu từ nhiều nguồn.
- Tạo dữ liệu sạch, chuẩn hoá, đồng nhất để phục vụ báo cáo doanh thu, phân tích xu hướng mua sắm.
- Hỗ trợ mở rộng khi lượng dữ liệu lớn (big data).

### 2.5. Chuẩn hoá dữ liệu (Data Normalization)

Chuẩn hóa dữ liệu là bước quan trọng nhằm đưa dữ liệu từ nhiều nguồn khác nhau về cùng một tiêu chuẩn chung. Mục tiêu của chuẩn hóa là đảm bảo dữ liệu sạch, nhất quán và có thể phân tích được trong Data Warehouse.

**Lưu ý quan trọng**: Hệ thống tự động normalize dữ liệu **TRƯỚC KHI validate** để sửa các lỗi format có thể sửa được. Điều này giúp giảm số lượng validation errors và tăng tỷ lệ dữ liệu được load thành công.

#### 2.5.1. Các nội dung chuẩn hóa trong đề tài gồm:

##### Chuẩn hóa định dạng ngày tháng

Nguồn POS, Website, Import có thể dùng nhiều format:
- `DD/MM/YYYY` hoặc `DD/MM/YYYY HH:mm:ss`
- `DD-MM-YYYY` hoặc `DD-MM-YYYY HH:mm:ss`
- `YYYY-MM-DD` hoặc `YYYY-MM-DD HH:mm:ss`
- `YYYY/MM/DD` hoặc `YYYY/MM/DD HH:mm:ss`
- `DD.MM.YYYY` hoặc `DD.MM.YYYY HH:mm:ss`
- `MM-DD-YYYY` (format Mỹ)
- ISO format (default Date parsing)

**Hệ thống tự động parse nhiều format và chuẩn hóa về MySQL datetime: `YYYY-MM-DD HH:mm:ss`**

**Files liên quan:**
- `src/utils/dateUtils.js` - Hàm `validateAndParseDate()` hỗ trợ nhiều format
- `src/services/validation/OrderValidationService.js` - Sử dụng dateUtils để parse

##### Chuẩn hóa dữ liệu tiền tệ và giá

**Price Normalization:**
- Loại bỏ dấu chấm/phẩy phân cách: `22.000.000` → `22000000`, `15,000,000` → `15000000`
- Convert string → number
- Làm tròn về số nguyên

**Currency Normalization:**
- Chuẩn hóa currency code: `vnd` → `VND`, `vnđ` → `VND`, `usd` → `USD`
- Default: `VND` nếu không có

**Files liên quan:**
- `src/utils/dataNormalizers.js` - Hàm `normalizePrice()` và `normalizeCurrency()`
- `src/services/TransformService.js` - Normalize trước khi validate

##### Chuẩn hóa số lượng (Quantity)

- Chuyển chữ thành số: `'two'` → `2`, `'three'` → `3`
- Làm tròn số thập phân: `'1.5'` → `2`, `'2.3'` → `2`
- Loại bỏ ký tự không phải số

**Files liên quan:**
- `src/utils/dataNormalizers.js` - Hàm `normalizeQty()`
- `src/services/TransformService.js` - Normalize trước khi validate

##### Chuẩn hóa Email

- Sửa email thiếu TLD: `'tranthihoa@email'` → `'tranthihoa@email.com'`
- Loại bỏ khoảng trắng
- Chuyển thành chữ thường

**Files liên quan:**
- `src/utils/dataNormalizers.js` - Hàm `normalizeEmail()`
- `src/services/TransformService.js` - Normalize trước khi validate

##### Chuẩn hóa SKU (Mã sản phẩm)

- Loại bỏ ký tự đặc biệt
- Chuyển thành chữ in hoa
- Thống nhất format: `ABC-123`, `PRD-01`

##### Chuẩn hóa tên sản phẩm

- Loại bỏ khoảng trắng dư thừa
- Loại bỏ ký tự không hợp lệ
- Giới hạn 100 ký tự
- Sửa dấu tiếng Việt và lỗi chính tả (Bluetoth → Bluetooth, logtech → Logitech)

**Files liên quan:**
- `src/utils/vietnameseUtils.js` - Hàm `fixProductName()`

##### Chuẩn hóa số lượng, giá trị đơn hàng

- Convert chuỗi → số
- Tự sửa các lỗi người dùng nhập như: `1,000` → `1000`, `22.000.000` → `22000000`
- Chuyển chữ thành số: `'two'` → `2`

**Kết quả**: Dữ liệu đầu vào từ nhiều nguồn trở nên đồng nhất – dễ phân tích – ít lỗi khi load vào DW. Hệ thống tự động sửa các lỗi format phổ biến, giảm đáng kể số lượng validation errors.

### 2.6. Kiểm tra và xác thực dữ liệu (Data Validation)

Validation là bước đảm bảo dữ liệu đúng – đầy đủ – hợp lệ trước khi đi vào Transform.

**Quy trình:**
1. **Normalize dữ liệu trước** (tự động sửa các lỗi format có thể sửa được)
2. **Validate dữ liệu đã normalize** (kiểm tra tính hợp lệ)
3. **Transform dữ liệu đã validate** (chuẩn hóa format, sửa dấu tiếng Việt)

Trong đề tài, validation dựa trên:
- **Data Normalizers** - Tự động normalize dữ liệu trước khi validate
- **Joi Schema** - Validate toàn bộ cấu trúc dữ liệu
- **Custom Validation Services** - Validate từng field chi tiết
- **Regex** - Validate format (email, phone)
- **Rule logic thủ công** - Validate giá trị (qty > 0, price > 0)

#### 2.6.1. Các nhóm validation chính

##### Validation giá trị bắt buộc (Required Fields)

Các trường bắt buộc phải có:
- `order_id`
- `store_code`
- `item_sku`
- `item_name`
- `qty`
- `unit_price`

**Thiếu → reject → DLQ.**

##### Validation định dạng

- **Email**: Theo chuẩn RFC
- **Customer phone**: 10–11 số
- **Date**: Đúng chuẩn hoặc parse được
- **Price**: Đúng format (có thể chứa ký hiệu tiền)

##### Validation giới hạn

- `qty > 0`
- `unit_price > 0` và `< 100,000,000`
- `item_name ≤ 100` ký tự
- SKU không chứa ký tự lạ

##### Validation loại dữ liệu (Type validation)

- Các trường số → buộc convert sang Number
- Ngày → Date object hoặc chuỗi chuẩn ISO

##### Validation cấu trúc (Schema validation)

Joi Schema kiểm tra cấu trúc toàn bản ghi. TransformService sử dụng Joi schema (`orderSchema`) để validate tất cả các trường của order data trước khi transform.

##### Validation logic nghiệp vụ

- Tránh giá âm
- Tránh số lượng 0
- Tránh tiền tệ không hỗ trợ

### 2.7. Công cụ và công nghệ sử dụng

| Thành phần | Công nghệ | Vai trò |
|-----------|-----------|---------|
| Message Queue | RabbitMQ | Truyền message giữa các bước ETL |
| Ngôn ngữ | Node.js | Viết Producer & Worker |
| RabbitMQ Client | amqplib | Gửi/nhận message |
| Database | MySQL | Lưu staging + data warehouse |
| ORM/Query | mysql2 | Kết nối MySQL |
| Validation | Joi + Custom Services | Kiểm tra dữ liệu (Joi schema + custom validation services) |
| Logging | Pino | Ghi log toàn hệ thống |
| Container | Docker, Docker Compose | Deploy RabbitMQ + hệ thống |
| Template Engine | EJS | Render views |
| CSV Parser | csv-parse | Parse CSV files |

---

## 3. Quy trình ETL được đề xuất

### 3.1. Kiến trúc tổng thể

#### Thiết lập RabbitMQ Topology

Hệ thống thiết lập một exchange trung tâm tên `etl.exchange` với kiểu **topic exchange**, đảm bảo message được định tuyến chính xác đến đúng queue dựa trên routing key. Exchange được cấu hình với thuộc tính `durable` để đảm bảo tồn tại sau khi RabbitMQ server khởi động lại.

**Lưu ý**: Trong phiên bản hiện tại, RabbitMQ chủ yếu được sử dụng để publish messages cho mục đích monitoring và logging. Các bước ETL (Extract, Validate, Transform, Load) chạy tuần tự trong cùng một process, không tách thành các workers riêng biệt chạy độc lập.

#### Cấu trúc Queue

Hệ thống tạo 4 queue chính:

1. **Queue `etl.extract`**: Nhận message khi extract dữ liệu (routing: `extract.*`)
2. **Queue `etl.transform`**: Nhận message khi transform dữ liệu (routing: `transform.*`)
3. **Queue `etl.load`**: Nhận message khi load dữ liệu (routing: `load.*`)
4. **Queue `etl.complete`**: Nhận thông báo hoàn thành job (routing: `complete.*`)

Tất cả các queue đều được cấu hình với thuộc tính `durable` để đảm bảo không mất message khi RabbitMQ server khởi động lại.

#### Binding và Routing

Mỗi queue được bind với exchange `etl.exchange` thông qua routing key tương ứng:
- Routing key `extract.*` → Queue `etl.extract`
- Routing key `transform.*` → Queue `etl.transform`
- Routing key `load.*` → Queue `etl.load`

Queue `etl.dlq` được bind trực tiếp với DLX để nhận tất cả message lỗi.

#### Luồng xử lý dữ liệu

Dữ liệu được xử lý theo pipeline tuần tự trong cùng một process: **Extract → Validate & Transform → Load**. Các bước được orchestrate bởi `ProcessService`, và messages được publish vào RabbitMQ để monitoring. Validation và Transform được thực hiện cùng lúc trong method `validateAndTransform()`.

### 3.2. Bước 1 – Extract

#### Trích xuất dữ liệu từ Old Database

Module `ExtractService` có nhiệm vụ trích xuất dữ liệu từ database cũ (`old_db`). Quy trình:

1. **Lấy orders**: Query tất cả orders từ bảng `old_orders`
2. **Lấy order items**: Query order items từ bảng `old_order_items` theo từng `order_code`
3. **Load reference data**: Load stores, customers, products vào cache từ cả `old_db` và `new_db`
4. **Enrich dữ liệu**: 
   - Lookup store name từ `store_code`
   - Lookup customer info (full_name, email) từ `phone`
   - Lookup product info (product_name, category) từ `sku`
5. **Combine data**: Combine orders với order items thành flat structure
6. **Publish message**: Publish message vào RabbitMQ với routing key `extract.old_db`

**Files liên quan:**
- `src/services/etl/ExtractService.js` - Method `extractFromOldDb()`
- `src/models/OldDbModel.js` - Methods `getAllOrders()`, `getOrderItemsByOrderCode()`
- `src/services/LookupService.js` - Enrich dữ liệu với thông tin từ lookup tables

#### Trích xuất dữ liệu từ CSV

Module Extract xử lý dữ liệu từ CSV files được upload hoặc trong thư mục `data/`:

1. **Parse CSV**: Sử dụng `csv-parse` để parse file CSV
2. **Map fields**: Map các field names khác nhau (order_id/orderId/order_code, etc.)
3. **Load reference data**: Load stores, customers, products vào cache
4. **Enrich dữ liệu**: Enrich với thông tin từ lookup tables
5. **Save to raw_orders**: Lưu dữ liệu vào bảng `raw_orders` trong old_db
6. **Publish message**: Publish message vào RabbitMQ với routing key `extract.csv`

**Files liên quan:**
- `src/services/etl/ExtractService.js` - Method `extractFromCsv(csvData, sourceFile)`
- `src/controllers/EtlController.js` - Method `processCsv()` - Parse CSV và gọi ExtractService
- `src/services/LookupService.js` - Method `enrichRow()` - Enrich dữ liệu

#### Trích xuất dữ liệu từ Raw Orders

Module Extract cũng hỗ trợ trích xuất dữ liệu từ bảng `raw_orders`:

1. **Lấy raw orders**: Query tất cả records từ bảng `raw_orders`
2. **Load reference data**: Load stores, customers, products vào cache
3. **Enrich dữ liệu**: Enrich với thông tin từ lookup tables
4. **Return data**: Trả về array of enriched data objects

**Files liên quan:**
- `src/services/etl/ExtractService.js` - Method `extractFromRawOrders()`
- `src/models/OldDbModel.js` - Method `getAllRawOrders()`

#### Xử lý đa nguồn

Hệ thống hỗ trợ xử lý dữ liệu từ 3 nguồn chính:
- **Old Database**: Dữ liệu từ bảng `old_orders` và `old_order_items` (source_type: 'old_db')
- **CSV Files**: Dữ liệu từ file CSV được upload hoặc trong thư mục `data/` (source_type: 'csv')
- **Raw Orders**: Dữ liệu từ bảng `raw_orders` (source_type: 'raw_orders')

Mỗi nguồn được đánh dấu bằng `source_type` để theo dõi nguồn gốc dữ liệu trong suốt quá trình ETL.

#### Enrich dữ liệu với Lookup Service

LookupService sử dụng cache để lookup nhanh:
- **Stores**: Lookup store name từ `store_code` (tìm trong old_db trước, fallback new_db)
- **Customers**: Lookup customer info từ `phone` (tìm trong old_db trước, fallback new_db)
- **Products**: Lookup product info từ `sku` (tìm trong old_db trước, fallback new_db)

**Files liên quan:**
- `src/services/LookupService.js` - Main lookup service (facade pattern)
- `src/services/lookup/StoreLookupService.js` - Lookup store name
- `src/services/lookup/CustomerLookupService.js` - Lookup customer info
- `src/services/lookup/ProductLookupService.js` - Lookup product info

### 3.3. Bước 2 – Validate

#### Class xử lý Validation (Tổng quan)

Module `ValidationService` và các sub-services (`OrderValidationService`, `ProductValidationService`, `CustomerValidationService`, `StoreValidationService`) chịu trách nhiệm validate từng dòng dữ liệu theo các rules đã định nghĩa. Validation được thực hiện cùng lúc với Transform trong method `transformOrderData()` của `TransformService`, được gọi từ `validateAndTransform()` của `ProcessService`.

#### Các Rule áp dụng (Chi tiết)

| Trường | Rule | Validation Method |
|--------|------|------------------|
| `order_code` | Không null, string, 1-50 ký tự (sau trim) | `OrderValidationService.validateOrderCode()` |
| `store_code` | Không null, string, 1-10 ký tự (sau trim) | `StoreValidationService.validateStoreCode()` |
| `customer_phone` | Optional, nếu có: 10-11 chữ số (regex: `/^[0-9]{10,11}$/`) | `CustomerValidationService.validatePhone()` |
| `customer_email` | Optional, nếu có: Email hợp lệ (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`), lowercase | `CustomerValidationService.validateEmail()` |
| `order_date` | Không null, parse được nhiều formats, format về MySQL datetime | `OrderValidationService.validateDateTime()` |
| `item_sku` | Không null, string, 1-20 ký tự (sau trim), uppercase | `ProductValidationService.validateSku()` |
| `item_name` / `product_name` | Optional, nếu có: ≤ 255 ký tự | `ProductValidationService.validateProductName()` |
| `qty` | Không null, số nguyên dương (>0), convert sang number | `ProductValidationService.validateQty()` |
| `unit_price` | Không null, số dương (>0), loại bỏ dấu phẩy, làm tròn | `ProductValidationService.validatePrice()` |

#### Các trường sẽ bị reject khi vi phạm Rule

Dòng dữ liệu sẽ bị đánh dấu là invalid (không được load vào DW) nếu bất kỳ trường nào dưới đây vi phạm rule:

- `order_code`: Trống, null, hoặc > 50 ký tự
- `store_code`: Trống, null, hoặc > 10 ký tự
- `customer_phone`: Có giá trị nhưng không match regex (10-11 chữ số)
- `customer_email`: Có giá trị nhưng không match regex (email format)
- `order_date`: Không parse được hoặc null
- `item_sku`: Trống, null, hoặc > 20 ký tự
- `item_name` / `product_name`: Có giá trị nhưng > 255 ký tự
- `qty`: Không phải số, null, hoặc <= 0
- `unit_price`: Không phải số, null, hoặc <= 0

#### Giải thích chi tiết từng phần code

1. **Joi Schema**: `orderSchema` trong `src/schemas/orderSchema.js` - Validate toàn bộ cấu trúc order data với Joi, hỗ trợ nhiều format date thông qua custom extension.

2. **Validation Services**: Các service riêng biệt cho từng entity:
   - `OrderValidationService`: Validate order_code, order_date (parse nhiều formats)
   - `ProductValidationService`: Validate SKU (uppercase), product_name, qty (parseInt), price (loại bỏ dấu phẩy, parseFloat, round)
   - `CustomerValidationService`: Validate phone (regex), email (regex, lowercase)
   - `StoreValidationService`: Validate store_code

3. **ValidationService (Facade)**: Facade pattern để orchestrate các validation services, cung cấp interface thống nhất.

4. **Transform Service**: Thực hiện validation và transform cùng lúc trong method `transformOrderData()`, sử dụng Joi schema để validate toàn bộ cấu trúc trước, sau đó sử dụng ValidationService để validate từng field chi tiết, collect errors, trả về object với `valid`, `data`, và `errors`.

5. **Process Service**: Orchestrate toàn bộ quy trình, gọi `validateAndTransform()` để xử lý batch dữ liệu, separate valid và invalid records.

6. **Error Handling**: Dữ liệu không hợp lệ được thu thập vào mảng `invalid` với format `{ raw_data: {...}, errors: [{ field, error }, ...] }` và được log vào database thông qua `logValidationErrors()`.

7. **Logging**: Validation errors được log vào `etl_logs` với status `validation_error`, message tổng hợp tất cả errors, error_details chứa errors và raw_data (JSON format).

### 3.4. Bước 3 – Transform

#### 3.4.1. Quy tắc Transform

Transform được thực hiện cùng lúc với Validation trong method `transformOrderData()` của `TransformService`. 

**Quy trình:**
1. **Normalize dữ liệu trước khi validate** (tự động sửa các lỗi format):
   - `unit_price`: Loại bỏ dấu chấm/phẩy (`22.000.000` → `22000000`)
   - `qty`: Chuyển chữ thành số (`two` → `2`), làm tròn số thập phân
   - `customer_email`: Sửa email thiếu TLD (`tranthihoa@email` → `tranthihoa@email.com`)
   - `currency`: Chuẩn hóa currency (`vnd` → `VND`)
2. **Validate dữ liệu đã normalize** (kiểm tra tính hợp lệ)
3. **Transform dữ liệu đã validate** (chuẩn hóa format, sửa dấu tiếng Việt)

Mỗi field được normalize trước, sau đó validate, rồi mới transform. Nếu validation fail, field đó không được transform và error được collect.

**Files liên quan:**
- `src/utils/dataNormalizers.js` - Các hàm normalize: `normalizeQty()`, `normalizePrice()`, `normalizeEmail()`, `normalizeCurrency()`
- `src/services/TransformService.js` - Method `transformOrderData()` gọi normalize trước khi validate

##### Chuẩn hoá ngày (Date Normalization)

- **Input**: Nhiều định dạng ngày khác nhau:
  - `YYYY-MM-DD HH:mm:ss` (chuẩn)
  - `YYYY-MM-DD` (thêm `00:00:00`)
  - `DD/MM/YYYY` hoặc `DD/MM/YYYY HH:mm:ss`
  - `DD-MM-YYYY` hoặc `DD-MM-YYYY HH:mm:ss`
  - `YYYY/MM/DD` hoặc `YYYY/MM/DD HH:mm:ss`
  - ISO format (default Date parsing)
- **Process**: Parse nhiều formats → Format về MySQL datetime
- **Output**: `YYYY-MM-DD HH:mm:ss` (MySQL datetime format)
- **Validation**: Sử dụng `OrderValidationService.validateDateTime()`

##### Chuẩn hoá tiền tệ (Currency Normalization)

- **Input**: Currency code có thể lowercase hoặc mixed case (`vnd`, `VND`, `usd`, `USD`)
- **Process**: Uppercase currency code
- **Output**: `VND`, `USD` (uppercase)
- **Default**: `VND` nếu không có

##### Chuẩn hoá giá (Price Normalization)

- **Input**: String có thể chứa dấu phẩy (`,`) hoặc dấu chấm (`.`) như `"15,000,000"`, `"22.000.000"`, `"15.000.000"`
- **Process**: 
  - **Normalize trước**: Sử dụng `normalizePrice()` để loại bỏ tất cả dấu chấm/phẩy
  - Convert sang number (parseInt)
  - Làm tròn về số nguyên (Math.round)
- **Output**: Number (integer)
- **Validation**: Sử dụng `ProductValidationService.validatePrice()` sau khi normalize

**Files liên quan:**
- `src/utils/dataNormalizers.js` - Hàm `normalizePrice()` loại bỏ dấu chấm/phẩy
- `src/services/TransformService.js` - Normalize price trước khi validate

##### Chuẩn hoá mã sản phẩm (SKU Normalization)

- **Input**: SKU có thể lowercase hoặc mixed case
- **Process**: Trim whitespace → Uppercase
- **Output**: Uppercase SKU
- **Validation**: Sử dụng `ProductValidationService.validateSku()`

##### Chuẩn hoá tên sản phẩm (Product Name Normalization)

- **Input**: Tên sản phẩm có thể thiếu dấu, sai chính tả
- **Process**: 
  - Sửa lỗi chính tả (Bluetoth → Bluetooth, logtech → Logitech, etc.)
  - Chuẩn hóa đơn vị (GB, W, MHz, etc.)
  - Sửa dấu tiếng Việt
  - Viết hoa chữ cái đầu
- **Output**: Tên sản phẩm đã được chuẩn hóa
- **Utility**: Sử dụng `fixProductName()` từ `vietnameseUtils.js`

##### Chuẩn hoá tên người và Category (Name Normalization)

- **Input**: Tên có thể thiếu dấu tiếng Việt (Nguyen Van → Nguyễn Văn)
- **Process**: Sử dụng `addVietnameseAccentsToName()` để tự động thêm dấu
- **Output**: Tên đã có dấu tiếng Việt
- **Apply to**: `store_name`, `customer_name`, `category`

##### Chuẩn hoá số lượng (Quantity Normalization)

- **Input**: String hoặc number (có thể là `"one"`, `"two"`, `"2.5"`, etc.)
- **Process**: 
  - **Normalize trước**: Sử dụng `normalizeQty()` để:
    - Chuyển chữ thành số (`'two'` → `2`)
    - Làm tròn số thập phân (`'1.5'` → `2`)
    - Loại bỏ ký tự không phải số
  - Validate phải là số nguyên dương
- **Output**: Number (integer > 0)
- **Validation**: Sử dụng `ProductValidationService.validateQty()` sau khi normalize

**Files liên quan:**
- `src/utils/dataNormalizers.js` - Hàm `normalizeQty()` chuyển chữ thành số, làm tròn
- `src/services/TransformService.js` - Normalize qty trước khi validate

#### 3.4.2. Các LỚP / MODULE liên quan

- **TransformService**: Service chính thực hiện transform dữ liệu, sử dụng Joi schema (`orderSchema`) để validate toàn bộ cấu trúc trước, sau đó sử dụng ValidationService để validate từng field chi tiết. Method `transformOrderData()` validate và transform từng field, collect errors, return `{ valid, data, errors }`.

- **Joi Schema**: `orderSchema` trong `src/schemas/orderSchema.js` - Joi schema với custom extension để validate date với nhiều format, validate tất cả các trường của order data.

- **ValidationService**: Facade pattern để orchestrate các validation services con. Cung cấp interface thống nhất cho TransformService.

- **VietnameseUtils**: Các hàm utility để sửa dấu tiếng Việt và chuẩn hóa tên sản phẩm:
  - `fixProductName(productName)` - Sửa dấu tiếng Việt và lỗi chính tả cho tên sản phẩm
  - `addVietnameseAccentsToName(name)` - Thêm dấu tiếng Việt cho tên (customer, store, category)

- **OrderValidationService**: 
  - `validateDateTime()` - Parse nhiều format date và chuẩn hóa về MySQL datetime format `YYYY-MM-DD HH:mm:ss`

- **ProductValidationService**: 
  - `validatePrice()` - Validate, loại bỏ dấu phẩy, convert sang number, làm tròn
  - `validateSku()` - Validate và uppercase SKU
  - `validateQty()` - Validate và convert sang number (parseInt)

- **ProcessService**: Orchestrate toàn bộ quy trình ETL, gọi `validateAndTransform()` để xử lý batch dữ liệu, separate valid và invalid records, publish message vào RabbitMQ.

### 3.5. Bước 4 – Load

#### Xây dựng Star Schema

Hệ thống Data Warehouse được thiết kế theo mô hình **Star Schema**, bao gồm một bảng fact trung tâm và các bảng dimension xung quanh. Mô hình này tối ưu cho việc truy vấn và phân tích dữ liệu bán hàng.

#### Database Schema

Hệ thống sử dụng 2 databases:
- **`old_db`**: Database nguồn chứa dữ liệu thô
  - `old_stores`, `old_customers`, `old_products`, `old_orders`, `old_order_items`, `raw_orders`
- **`new_db`**: Database đích chứa dữ liệu đã được chuẩn hóa (Data Warehouse)
  - `stores`, `customers`, `products`, `orders`, `order_items`, `etl_logs`

#### Dimension Tables (Normalized)

Hệ thống tự động tạo và cập nhật các bảng dimension:

- **`stores`**: 
  - `id` (PK, auto increment)
  - `store_code` (UK, varchar(10))
  - `store_name` (varchar(255), nullable)
  - `created_at` (timestamp)
  - Upsert dựa trên `store_code`, chỉ update `store_name` nếu giá trị mới không null

- **`customers`**: 
  - `id` (PK, auto increment)
  - `phone` (UK, varchar(20), nullable)
  - `full_name` (varchar(255), nullable)
  - `email` (varchar(255), nullable)
  - `created_at` (timestamp)
  - Upsert dựa trên `phone`, chỉ update các fields nếu giá trị mới không null

- **`products`**: 
  - `id` (PK, auto increment)
  - `sku` (UK, varchar(20))
  - `product_name` (varchar(255))
  - `category` (varchar(100), nullable)
  - `created_at` (timestamp)
  - Upsert dựa trên `sku`, chỉ update `product_name` nếu giá trị mới không empty, chỉ update `category` nếu giá trị mới không null

#### Fact Tables

- **`orders`**: 
  - `id` (PK, auto increment)
  - `order_code` (UK, varchar(50))
  - `store_id` (FK → stores.id)
  - `customer_id` (FK → customers.id, nullable)
  - `order_datetime` (datetime)
  - `created_at` (timestamp)
  - Upsert dựa trên `order_code`, update tất cả fields nếu đã tồn tại

- **`order_items`**: 
  - `id` (PK, auto increment)
  - `order_id` (FK → orders.id)
  - `product_id` (FK → products.id)
  - `qty` (int)
  - `unit_price` (decimal(18,2))
  - `currency` (varchar(10), default 'VND')
  - `created_at` (timestamp)
  - Chỉ insert (không có unique constraint, cho phép duplicate items)

#### Cơ chế Upsert

Hệ thống sử dụng cơ chế upsert (`INSERT ... ON DUPLICATE KEY UPDATE`) cho các bảng dimension và orders:

- **Stores**: Sử dụng `COALESCE` để chỉ update `store_name` nếu giá trị mới không null
- **Customers**: Sử dụng `COALESCE` để chỉ update `full_name` và `email` nếu giá trị mới không null
- **Products**: Sử dụng `COALESCE` và `NULLIF` để chỉ update `product_name` nếu giá trị mới không empty, chỉ update `category` nếu giá trị mới không null
- **Orders**: Update tất cả fields nếu đã tồn tại

**Lợi ích:**
- Không có dữ liệu trùng lặp
- Tự động cập nhật thông tin nếu có thay đổi
- Xử lý idempotent, có thể chạy lại mà không gây lỗi
- Không ghi đè dữ liệu đã có nếu giá trị mới là null

#### Khởi tạo Database

Hệ thống cung cấp SQL scripts để tạo toàn bộ cấu trúc database:
- `sql/00_setup_all.sql` - Script master tạo cả old_db và new_db
- `sql/01_create_old_db.sql` - Tạo old_db và tables
- `sql/02_create_new_db.sql` - Tạo new_db và tables (Star Schema)
- `sql/03_insert_fake_data.sql` - Insert fake data với nhiều lỗi để test + mapping data từ CSV
- `sql/04_migrate_etl_logs.sql` - Migration cho etl_logs
- `sql/05_utility_truncate.sql` - Utility để truncate new_db
- `sql/06_utility_truncate_old_db.sql` - Utility để truncate old_db

**Lưu ý**: 
- File `sql/03_insert_fake_data.sql` đã bao gồm cả mapping data từ CSV (stores và customers) để đảm bảo CSV data có thể lookup được.
- Sử dụng PowerShell scripts (`setup-databases.ps1`, `run-sql.ps1`, `etl-utils.ps1`) để dễ dàng setup và quản lý databases trên Windows.
- Xem `sql/README.md` để biết chi tiết về cách sử dụng các scripts.

#### Tối ưu hiệu suất

Các bảng được tạo với các index phù hợp để tối ưu hiệu suất truy vấn:
- Index trên các unique keys (store_code, phone, sku, order_code)
- Index trên các foreign keys (store_id, customer_id, order_id, product_id)
- Index trên các trường thường được sử dụng để filter (order_datetime, created_at)
- Index trên status và source_type trong etl_logs

#### Xử lý giao dịch

Load Service xử lý từng record một cách tuần tự, đảm bảo tính nhất quán dữ liệu. Nếu có lỗi xảy ra trong quá trình load, lỗi sẽ được ghi vào bảng `etl_logs` với status `error` và error_details (JSON), đảm bảo không mất dữ liệu và có thể truy vết sau. Process không dừng khi một record fail, tiếp tục xử lý các records khác.

### 3.6. Bước 5 – Logging và Monitoring

#### 3.6.1. Mục tiêu của Logging

Hệ thống ETL được thiết kế với cơ chế ghi log nhằm:
- Theo dõi toàn bộ quy trình ETL từ Ingest → Validate → Transform → Load.
- Ghi nhận lỗi để phục vụ xử lý và retry.
- Cung cấp dữ liệu cho dashboard giám sát.
- Hỗ trợ truy vết (trace) trong quá trình phát triển và vận hành.

Hệ thống log được triển khai theo 3 hướng:

| Loại log | Chức năng |
|----------|-----------|
| **Console** | Ghi thông tin hoạt động bình thường trên console |
| **File** | Ghi log vào file (info.log, error.log) |
| **DB MySQL** | Ghi log chi tiết vào bảng `etl_logs` (stage, status, message, data, created_at) |

#### 3.6.2. Kiến trúc Logging trong dự án

Trong project `etl-sales-integration`, logging được thực hiện trực tiếp thông qua `NewDbModel.insertLog()`.

Mỗi bước ETL ghi log vào database `etl_logs`:
- **Load Service**: Log success/error sau mỗi record được load
- **Validation Errors**: Log validation errors với status `validation_error`

**Sơ đồ kiến trúc logging:**
```
src/services/etl/LoadService.js
    ├─ loadToNewDb() ──> NewDbModel.insertLog(status: 'success' | 'error')
    └─ logValidationErrors() ──> NewDbModel.insertLog(status: 'validation_error')
        ↓
NewDbModel.insertLog() ──> MySQL (etl_logs)
```

Mỗi bước ETL gọi `newDbModel.insertLog()` để ghi log vào database với thông tin chi tiết về source_table, source_type, order_code, status, message và error_details (JSON).

#### 3.6.3. Mẫu nội dung log

**Database MySQL – bảng `etl_logs`**

| id | source_table | source_type | record_id | order_code | status | message | error_details | created_at |
|----|--------------|-------------|-----------|------------|--------|---------|---------------|------------|
| 1 | old_orders | old_db | null | ORD001 | success | Data loaded successfully | null | 2024-01-15 10:30:00 |
| 2 | validation | old_db | null | ORD002 | validation_error | order_code: Order code is required; qty: Quantity must be a positive integer | {"errors": [...], "raw_data": {...}} | 2024-01-15 10:31:00 |
| 3 | old_orders | old_db | null | ORD003 | error | FK constraint failed | {"error": "...", "row": {...}} | 2024-01-15 10:32:00 |

#### 3.6.4. Logging trong từng bước ETL

- **Extract**: Publish message vào RabbitMQ (không log riêng vào database)
- **Validate & Transform**: 
  - Validation errors được log vào `etl_logs` với status `validation_error`
  - Message tổng hợp tất cả errors (field: error; field: error)
  - Error details chứa errors và raw_data (JSON format)
- **Load**: 
  - Log success cho mỗi record thành công (status: 'success')
  - Log error cho mỗi record lỗi (status: 'error', error_details chứa error và row data)

#### 3.6.5. Dashboard Monitoring

Dashboard hiển thị:
- **Statistics**: Tổng số stores, customers, products, orders, orderItems, logs
- **Logs Table**: Hiển thị logs với pagination, sort theo `created_at DESC`
- **Data Tables**: Hiển thị dữ liệu từ Data Warehouse (stores, customers, products, orders, orderItems)
- **API Endpoints**: 
  - `GET /api/etl/stats` - Statistics
  - `GET /api/etl/logs` - Logs với pagination
  - `GET /api/etl/stores`, `/customers`, `/products`, `/orders`, `/order-items` - Data tables

---

## 4. Ứng dụng RabbitMQ trong quy trình ETL

RabbitMQ là một hệ thống message broker phổ biến, giúp truyền tải thông điệp giữa các thành phần trong hệ thống phân tán. Trong quy trình ETL (Extract, Transform, Load), RabbitMQ đóng vai trò quan trọng trong việc đảm bảo rằng các bước xử lý dữ liệu được thực hiện một cách hiệu quả, linh hoạt và đáng tin cậy.

### 4.1. Tách biệt các bước ETL (Trong kiến trúc hiện tại)

Trong phiên bản hiện tại, các bước ETL được tách biệt thành các services riêng biệt:
- **ExtractService**: Extract dữ liệu từ old_db, CSV, raw_orders
- **ProcessService**: Orchestrate Validate & Transform
- **LoadService**: Load dữ liệu vào new_db

Các services chạy tuần tự trong cùng một process, được orchestrate bởi `ProcessService`. RabbitMQ được sử dụng chủ yếu để publish messages cho mục đích monitoring và logging.

**Lợi ích:**
- **Dễ maintain**: Mỗi service có trách nhiệm rõ ràng, dễ test và debug.
- **Có thể mở rộng**: Có thể tách thành workers riêng biệt trong tương lai nếu cần.
- **Monitoring**: Messages được publish vào RabbitMQ để theo dõi quá trình xử lý.
- **Error Handling**: Mỗi service xử lý lỗi riêng biệt, không ảnh hưởng đến các services khác.

### 4.2. Quản lý luồng dữ liệu hiệu quả

Trong quy trình ETL, các messages được publish vào RabbitMQ sau mỗi bước để monitoring:
- **Extract**: Publish message với routing key `extract.old_db`, `extract.csv`, `extract.raw_orders`
- **Transform**: Publish message với routing key `transform.data` (sau khi validate & transform)
- **Load**: Publish message với routing key `load.data` (sau khi load xong)
- **Complete**: Publish message với routing key `complete.old_db`, `complete.csv`, `complete.raw_orders` (khi hoàn thành job)

RabbitMQ giúp định tuyến messages thông qua Exchange và Queue, đảm bảo rằng messages được gửi đúng nơi để monitoring.

**Lợi ích:**
- **Monitoring**: Messages được publish vào RabbitMQ để theo dõi quá trình xử lý
- **Tăng tính linh hoạt**: Có thể thêm consumers để xử lý messages trong tương lai
- **Durable Queues**: Messages không bị mất khi RabbitMQ server restart

### 4.3. Đảm bảo tính toàn vẹn và tin cậy

Trong kiến trúc hiện tại, tính toàn vẹn dữ liệu được đảm bảo thông qua:
- **Error logging**: Tất cả lỗi được ghi vào bảng `etl_logs` với chi tiết đầy đủ (error_details JSON)
- **Upsert mechanism**: Sử dụng `ON DUPLICATE KEY UPDATE` với `COALESCE` để tránh trùng lặp và không ghi đè dữ liệu đã có
- **Foreign key constraints**: Đảm bảo referential integrity (store_id, customer_id, order_id, product_id)
- **Sequential processing**: Xử lý từng record một để đảm bảo tính nhất quán
- **Error handling**: Không dừng toàn bộ process nếu một record fail, tiếp tục xử lý các records khác

RabbitMQ với durable queues giúp đảm bảo messages không bị mất khi server restart, phục vụ cho monitoring.

**Lợi ích:**
- **Tin cậy**: Foreign key constraints và upsert mechanism đảm bảo tính toàn vẹn dữ liệu.
- **Khôi phục sau lỗi**: Lỗi được ghi log chi tiết với error_details (JSON), có thể retry thủ công.
- **Tính toàn vẹn dữ liệu**: Foreign keys và constraints đảm bảo dữ liệu hợp lệ.
- **Idempotency**: Upsert mechanism cho phép chạy lại ETL process mà không gây lỗi.

### 4.4. Giảm tải cho hệ thống

Bằng cách sử dụng RabbitMQ làm hệ thống trung gian cho monitoring, các bước ETL có thể publish messages mà không block quá trình xử lý. Điều này giúp:
- **Non-blocking**: Publish messages không block ETL process (nếu RabbitMQ fail, chỉ log warning)
- **Monitoring**: Messages được publish để theo dõi quá trình xử lý
- **Future scalability**: Có thể thêm consumers để xử lý messages trong tương lai

**Lợi ích:**
- **Performance**: Messages được publish bất đồng bộ, không ảnh hưởng đến tốc độ ETL
- **Monitoring**: Dễ dàng theo dõi quá trình xử lý qua RabbitMQ Management UI
- **Scalability**: Có thể scale bằng cách thêm consumers để xử lý messages

### 4.5. Giám sát và Logging

Hệ thống sử dụng kết hợp RabbitMQ messages và database logging để giám sát:
- **RabbitMQ messages**: Publish messages vào các queues để theo dõi quá trình (extract, transform, load, complete)
  - Messages chứa metadata (count, timestamp, sample data)
  - Routing keys: `extract.*`, `transform.*`, `load.*`, `complete.*`
- **Database logging**: Ghi log chi tiết vào bảng `etl_logs` với thông tin về source_table, source_type, order_code, status, message, error_details
  - Status: `success`, `error`, `validation_error`
  - Error details: JSON chứa error message và row data
- **Web Dashboard**: Hiển thị thống kê và logs qua API endpoints
  - `GET /api/etl/stats` - Statistics
  - `GET /api/etl/logs` - Logs với pagination
  - `GET /api/etl/stores`, `/customers`, `/products`, `/orders`, `/order-items` - Data tables

**Lợi ích:**
- **Giám sát quy trình**: Dễ dàng theo dõi các message qua RabbitMQ Management UI và database logs
- **Logging chi tiết**: Mỗi record được log chi tiết vào database, có thể query và phân tích
- **Dashboard**: Web dashboard hiển thị statistics và logs real-time

### 4.6. Mở rộng quy trình ETL

Kiến trúc hiện tại với các services tách biệt và RabbitMQ messages tạo nền tảng tốt để mở rộng trong tương lai:
- **Tách thành workers**: Có thể tách các services thành workers riêng biệt chạy độc lập, consume messages từ RabbitMQ
- **Horizontal scaling**: Có thể chạy nhiều instances của mỗi worker để xử lý song song
- **Thêm bước xử lý mới**: Dễ dàng thêm các bước xử lý mới vào pipeline
- **Batch processing**: Có thể implement batch processing để tối ưu performance

**Lợi ích:**
- **Scalability**: Kiến trúc hiện tại sẵn sàng để scale khi cần
- **Tăng cường hiệu suất**: Có thể tối ưu từng service riêng biệt
- **Linh hoạt**: Dễ dàng thay đổi hoặc thêm các bước xử lý mới
- **Message-driven**: Messages đã được publish, sẵn sàng để consume bởi workers

---

## 5. Kết quả đạt được

Dự án đã đạt được các kết quả quan trọng:

### 5.1. Pipeline ETL hoạt động hoàn chỉnh

- **Extract → Validate & Transform → Load**: Quy trình ETL hoạt động liên tục và ổn định.
- **Xử lý dữ liệu từ CSV & Database**: Hệ thống có thể xử lý dữ liệu từ 3 nguồn: old_db, CSV files, raw_orders.
- **Validation và Transform cùng lúc**: Validation và Transform được thực hiện trong cùng một method `transformOrderData()`, tối ưu performance.
- **RabbitMQ Monitoring**: Messages được publish vào RabbitMQ để monitoring quá trình xử lý.

### 5.2. Kiến trúc tách biệt – dễ mở rộng

Giữa các bước ETL không ràng buộc trực tiếp → dễ scale, dễ bảo trì. Mỗi service có trách nhiệm rõ ràng:
- **ExtractService**: Extract và enrich dữ liệu
- **ProcessService**: Orchestrate Validate & Transform
- **LoadService**: Load vào Data Warehouse
- **ValidationService**: Validate dữ liệu (facade pattern)
- **TransformService**: Transform dữ liệu (sử dụng ValidationService)
- **LookupService**: Lookup và enrich dữ liệu (facade pattern)

Mỗi service có thể được phát triển và triển khai độc lập.

### 5.3. Hệ thống xử lý dữ liệu sạch

- **100% dữ liệu được validate**: Tất cả dữ liệu đều được kiểm tra kỹ lưỡng trước khi transform và load.
- **Tự động normalize dữ liệu trước khi validate**: 
  - **Price**: Loại bỏ dấu chấm/phẩy (`22.000.000` → `22000000`)
  - **Quantity**: Chuyển chữ thành số (`two` → `2`), làm tròn số thập phân
  - **Email**: Sửa email thiếu TLD (`tranthihoa@email` → `tranthihoa@email.com`)
  - **Currency**: Chuẩn hóa currency (`vnd` → `VND`)
- **Chuẩn hóa ngày, SKU, sản phẩm, tiền tệ**: 
  - Ngày: Parse nhiều formats → Format về MySQL datetime `YYYY-MM-DD HH:mm:ss`
  - SKU: Uppercase
  - Sản phẩm: Sửa dấu tiếng Việt, lỗi chính tả
  - Tiền tệ: Uppercase, loại bỏ dấu phẩy, làm tròn
- **Upsert mechanism**: Loại bỏ các bản ghi trùng lặp thông qua upsert với unique keys.
- **Vietnamese text handling**: Tự động sửa dấu tiếng Việt cho tên người, tên sản phẩm, category.
- **Giảm validation errors**: Normalize tự động giúp giảm đáng kể số lượng validation errors, tăng tỷ lệ dữ liệu được load thành công.

### 5.4. Xây dựng Database hoàn chỉnh

- **Star Schema**: 
  - Dimension tables: `stores`, `customers`, `products`
  - Fact tables: `orders`, `order_items`
  - Logging table: `etl_logs`
- **Cơ chế upsert tránh trùng lặp**: 
  - Sử dụng `ON DUPLICATE KEY UPDATE` với `COALESCE` để chỉ update các fields không null
  - Unique keys: `store_code`, `phone`, `sku`, `order_code`
- **Foreign keys và constraints**: Đảm bảo tính toàn vẹn dữ liệu (store_id, customer_id, order_id, product_id).
- **Indexes**: Tối ưu hiệu suất truy vấn (unique keys, foreign keys, order_datetime, created_at).

### 5.5. Logging hoàn chỉnh

- **Logging đầy đủ**: 
  - Success logs: Mỗi record load thành công được log với status `success`
  - Error logs: Mỗi record load lỗi được log với status `error` và error_details (JSON)
  - Validation errors: Mỗi record không pass validation được log với status `validation_error` và error_details (JSON)
- **Lỗi được ghi log chi tiết**: Các lỗi được ghi vào `etl_logs` với error_details (JSON) chứa error message và row data.
- **Log đầy đủ phục vụ audit**: Hỗ trợ truy vết và kiểm toán với thông tin về source_table, source_type, order_code, status, message, error_details, created_at.
- **Dashboard và API**: Cung cấp API endpoints để query logs và statistics, hỗ trợ dashboard monitoring.

### 5.6. Hiệu năng

- **Xử lý dữ liệu hiệu quả**: 
  - Lookup cache: Load reference data vào cache một lần, lookup nhanh
  - Sequential processing: Xử lý từng record một để đảm bảo data integrity
  - Error handling: Không dừng toàn bộ process nếu một record fail
- **Scalability**: 
  - Kiến trúc tách biệt: Có thể scale từng service riêng biệt
  - RabbitMQ messages: Sẵn sàng để consume bởi workers trong tương lai
  - Indexes: Tối ưu hiệu suất truy vấn database

---

## 6. Kết luận

Đề tài đã xây dựng thành công một hệ thống ETL hiện đại, ứng dụng RabbitMQ để xử lý dữ liệu bất đồng bộ, mạnh mẽ và có khả năng mở rộng. Việc sử dụng message queue giúp tách biệt các bước ETL, tăng độ tin cậy và cải thiện hiệu suất đáng kể.

Hệ thống đã:
- ✅ **Tích hợp dữ liệu từ nhiều nguồn**: Old Database, CSV files, Raw Orders
- ✅ **Validate và chuẩn hóa dữ liệu chính xác**: 
  - Validate đầy đủ các fields (order_code, store_code, phone, email, date, sku, qty, price)
  - Chuẩn hóa ngày tháng (nhiều formats → MySQL datetime)
  - Chuẩn hóa tiền tệ (loại bỏ dấu phẩy, làm tròn)
  - Sửa dấu tiếng Việt cho tên người, tên sản phẩm, category
- ✅ **Xây dựng Data Warehouse (Star Schema)**: 
  - Dimension tables: stores, customers, products
  - Fact tables: orders, order_items
  - Upsert mechanism với COALESCE để tránh ghi đè dữ liệu đã có
- ✅ **Hỗ trợ logging, monitoring và xử lý lỗi**: 
  - Logging đầy đủ vào `etl_logs` (success, error, validation_error)
  - Dashboard và API endpoints để query logs và statistics
  - RabbitMQ messages cho monitoring
- ✅ **Vận hành ổn định, hiệu năng cao**: 
  - Error handling không block process
  - Lookup cache để tối ưu performance
  - Sẵn sàng cho production

Kết quả này cho thấy kiến trúc ETL kết hợp với RabbitMQ là giải pháp phù hợp cho các doanh nghiệp có nhu cầu xử lý dữ liệu lớn, đa nguồn và yêu cầu tốc độ – độ tin cậy cao.

---

**Link GitHub**: https://github.com/ahryxx0602/etl-sales-integration.git

