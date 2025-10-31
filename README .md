# 🧩 ETL + RabbitMQ — Hệ thống xử lý & Chuẩn hoá Dữ liệu Bán hàng (CSV + DB)

Dự án minh hoạ quy trình **ETL (Extract – Transform – Load)** sử dụng **Node.js** và **RabbitMQ** để xử lý dữ liệu bán hàng từ nhiều nguồn (CSV, Database), sau đó lưu vào **MySQL Data Warehouse**.

---

## 🚀 Mục tiêu

- Tự động đọc dữ liệu từ CSV hoặc DB (Import, POS, Website)
- Thực hiện Validate → Transform → Load tuần tự qua RabbitMQ
- Chuẩn hoá dữ liệu trước khi lưu vào Data Warehouse
- Tạo mô hình sao (Star Schema) gồm **Dimension** và **Fact tables**

---

## 🧠 Kiến trúc hệ thống

```
CSV/DB → [Producer]
        → Queue: etl.validate → [Validate Worker]
        → Queue: etl.transform → [Transform Worker]
        → Queue: etl.load → [Load Worker]
        → MySQL (Staging + Data Warehouse)
```

---

## 🧱 Cấu trúc thư mục

```
📦 etl-sales-integration
 ┣ 📂data/                       # Dữ liệu CSV nguồn
 ┃ ┣ 📜orders_import_oct.csv
 ┃ ┣ 📜orders_pos_oct.csv
 ┃ ┗ 📜orders_web_oct.csv
 ┣ 📂src/
 ┃ ┣ 📂producers/                # Producer gửi dữ liệu vào RabbitMQ
 ┃ ┃ ┣ 📜csv_ingest.js
 ┃ ┃ ┗ 📜db_ingest.js
 ┃ ┣ 📂workers/                  # 3 bước ETL chính
 ┃ ┃ ┣ 📜validateWorker.js
 ┃ ┃ ┣ 📜transformWorker.js
 ┃ ┃ ┗ 📜loadWorker.js
 ┃ ┣ 📂dev/                      # Script test độc lập
 ┃ ┃ ┗ 📜transformLocal.js
 ┃ ┣ 📜config.js
 ┃ ┣ 📜db.js
 ┃ ┗ 📜rabbit.js
 ┣ 📂output/                     # Kết quả transform xuất ra JSON
 ┃ ┗ 📜transformed_orders_oct.json
 ┣ 📜.env
 ┣ 📜package.json
 ┗ 📜README.md
```

---

## ⚙️ Cấu hình `.env`

```env
# RabbitMQ
RABBIT_URL=amqp://dev:devpass@localhost:5672

# MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_DB=etl_sales
MYSQL_DB_DW=etl_dw

# CSV Directory
CSV_DIR=data
```

---

## 📦 Cài đặt & Khởi động

### 1️⃣ Cài dependencies

```bash
npm install
```

### 2️⃣ Kiểm tra RabbitMQ và MySQL

```bash
node src/dev/testConnection.js
```
✅ Nếu log:
```
RabbitMQ ok
MySQL ok
```
→ Môi trường sẵn sàng.

---

## 🧩 Module của từng thành viên

| STT | Thành viên | Module | Nhiệm vụ | Tiến độ | Ghi chú |
|-----|-------------|----------|------------|-----------|-----------|
| 1 | **Phan Văn Thành** | Ingest + Load DW | Đọc dữ liệu CSV/DB, Publish message lên RabbitMQ, Load DW | ✅ | Đã hoàn thiện |
| 2 | **Đỗ Huỳnh Tài** | Validate | Kiểm tra schema, regex email, giá, số lượng | ✅ | Regex hoạt động đúng |
| 3 | **Trần Đức Cảnh** | Transform | Chuẩn hoá ngày, tiền tệ, mapping category, tính toán `order_line_id`, `total_price` | ✅ | Đã hoàn thành |
| 4 | **Đỗ Thiên Sáng** | Load DW | Upsert dimension, insert fact_sales | ⏳ | Dựa vào DW schema |
| 5 | **Dương Đình Hiếu** | Log/Monitor | Ghi log, dashboard thống kê | ⏳ | Chờ DW hoàn thiện |

---

## 🧮 Module Transform (Nguyễn Đức Cảnh)

### 🎯 Chức năng chính
- Chuẩn hoá định dạng ngày (`order_date → order_ts`)
- Chuẩn hoá tiền tệ (`VNĐ` → `VND`)
- Mapping `category` theo `category-map.json`
- Tính `line_total` và `total_price` = `qty × unit_price`
- Tạo `order_line_id` = `<order_id>-<item_sku>`
- Xuất dữ liệu chuẩn ra file JSON (`output/transformed_orders_oct.json`)

### 📊 Kết quả thực tế
| File nguồn | Số bản ghi | Trạng thái |
|-------------|------------|------------|
| orders_import_oct.csv | 10 | OK |
| orders_pos_oct.csv | 20 | OK |
| orders_web_oct.csv | 10 | OK |
| **Tổng cộng** | **40 bản ghi** | ✅ Đã transform thành công |

📁 **Kết quả:**  
`/output/transformed_orders_oct.json`

---

## ⚡ 3 bước kiểm thử hiệu năng (Transform)

1️⃣ **Đo thời gian xử lý**  
Thêm `console.time('transform')` / `console.timeEnd('transform')` vào script để đo thời gian transform toàn bộ file.

2️⃣ **Tăng dữ liệu đầu vào**  
Nhân đôi file CSV (80, 160 dòng) để đo tốc độ mở rộng.

3️⃣ **Giám sát tài nguyên**  
Theo dõi CPU/RAM bằng Task Manager (Windows) hoặc Activity Monitor (macOS).  
→ Kết quả: CPU ~25%, RAM <150MB (ổn định).

---

## ▶️ Cách chạy toàn bộ pipeline ETL

### 1️⃣ Mở 3 terminal (mỗi cái 1 worker)

```bash
node src/workers/validateWorker.js
node src/workers/transformWorker.js
node src/workers/loadWorker.js
```

### 2️⃣ Gửi dữ liệu CSV vào hàng đợi

```bash
node src/producers/csv_ingest.js
```

### 3️⃣ Theo dõi trên RabbitMQ UI
http://localhost:15672  
- `etl.validate` → Validate worker  
- `etl.transform` → Transform worker  
- `etl.load` → Load worker  
- `etl.dlq` → Queue lỗi (nếu có)

---

## 🧾 Kiểm tra MySQL (sau khi load thành công)

```sql
-- Staging
SELECT COUNT(*) FROM staging_order_lines;

-- Data Warehouse (Star Schema)
SELECT COUNT(*) FROM etl_dw.dim_store;
SELECT COUNT(*) FROM etl_dw.dim_product;
SELECT COUNT(*) FROM etl_dw.fact_sales;

-- Join mẫu
SELECT f.order_key, d.date_value, s.store_code, p.item_sku, f.qty, f.line_total
FROM etl_dw.fact_sales f
JOIN etl_dw.dim_date d   ON d.date_key = f.date_key
JOIN etl_dw.dim_store s  ON s.store_key = f.store_key
JOIN etl_dw.dim_product p ON p.product_key = f.product_key
ORDER BY f.id DESC
LIMIT 10;
```

---

## 🏁 Kết quả cuối cùng

| Bảng | Số bản ghi | Mô tả |
|------|-------------|--------|
| `etl_dw.dim_store` | 7 | Danh mục cửa hàng |
| `etl_dw.dim_product` | 29 | Danh mục sản phẩm |
| `etl_dw.dim_date` | 16 | Ngày phát sinh đơn |
| `etl_dw.fact_sales` | 40 | Giao dịch bán hàng chuẩn hoá |

---

## ✍️ Tác giả & Đóng góp

👨‍💻 **Nhóm ETL Sales Integration - Đại học Duy Tân**  
- Phan Văn Thành  
- Đỗ Huỳnh Tài  
- Trần Đức Cảnh  
- Đỗ Thiên Sáng  
- Dương Đình Hiếu

---

## 📚 Giấy phép
Dự án chỉ sử dụng cho mục đích học tập và nghiên cứu nội bộ.
