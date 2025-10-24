# ETL + RabbitMQ — Hệ thống xử lý & chuẩn hoá dữ liệu bán hàng (CSV + DB)

Mô tả ngắn: project này minh hoạ một pipeline ETL đơn giản bằng Node.js và RabbitMQ. Dữ liệu nguồn (file CSV / DB) được đọc bởi producer, qua các bước Validate → Transform → Load bởi 3 worker riêng biệt, rồi lưu vào MySQL (staging và DW).

---

## Công nghệ chính

- Node.js
- RabbitMQ (management plugin)
- MySQL (ví dụ: XAMPP)
- dotenv, pino (logger)

---
## Cấu trúc chính

- `src/producers/csv_ingest.js` — đọc CSV và publish message
- `src/workers/validateWorker.js` — kiểm tra định dạng & trường bắt buộc
- `src/workers/transformWorker.js` — chuẩn hoá, định dạng ngày/tiền tệ, mapping
- `src/workers/loadWorker.js` — ghi vào MySQL (bảng staging & dw)
- `src/config.js`, `src/rabbit.js`, `src/db.js` — cấu hình và kết nối
- `data/` — chứa các file CSV mẫu
- `.env.example`, `package.json`

---
## 📦 Cấu trúc thư mục dự án
```bash
📦etl-sales-integration
 ┣ 📂data/                       # Chứa dữ liệu CSV mẫu để chạy thử
 ┃ ┣ 📜orders_import_oct.csv     # Dữ liệu nhập hàng (Import)
 ┃ ┣ 📜orders_pos_oct.csv        # Dữ liệu bán trực tiếp (POS)
 ┃ ┗ 📜orders_web_oct.csv        # Dữ liệu bán online (Website)
 ┣ 📂src/                        # Code chính của hệ thống ETL
 ┃ ┣ 📂dev/
 ┃ ┃ ┗ 📜sendTest.js             # Script test nhanh gửi message mẫu
 ┃ ┣ 📂producers/
 ┃ ┃ ┣ 📜csv_ingest.js           # Đọc file CSV và publish message lên RabbitMQ
 ┃ ┃ ┗ 📜db_ingest.js            # (Tùy chọn) Đọc dữ liệu từ DB gốc
 ┃ ┣ 📂workers/
 ┃ ┃ ┣ 📜validateWorker.js       # Kiểm tra dữ liệu (Validate)
 ┃ ┃ ┣ 📜transformWorker.js      # Chuẩn hoá, chuyển đổi (Transform)
 ┃ ┃ ┗ 📜loadWorker.js           # Ghi dữ liệu vào MySQL (Load)
 ┃ ┣ 📜config.js                 # Config chung (RabbitMQ, MySQL, paths,…)
 ┃ ┣ 📜db.js                     # Module kết nối MySQL
 ┃ ┣ 📜rabbit.js                 # Module kết nối RabbitMQ
 ┗ ┗ 📜setup.js                  # Tạo exchange, queue, binding ban đầu


---
## Biến môi trường (tạo `.env` từ `.env.example` nếu cần)

Mẫu tối thiểu (.env):

```
RABBIT_URL=amqp://guest:guest@localhost
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASS=
MYSQL_DB=etl_sales
MYSQL_DB_DW=etl_dw
CSV_DIR=data
```

Lưu ý: nếu bạn dùng XAMPP, đảm bảo MySQL đang chạy và database `etl_sales` tồn tại.

### Cài đặt RabbitMQ

Bạn có thể chọn 1 trong 3 cách:
- **Cách A (local):** Cài RabbitMQ + Erlang, bật Management plugin.  
  UI: http://localhost:15672 (guest/guest)
- **Cách B (Docker):**  
  ```bash
  docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672     -e RABBITMQ_DEFAULT_USER=dev     -e RABBITMQ_DEFAULT_PASS=devpass     rabbitmq:3.13-management
→ .env: RABBIT_URL=amqp://dev:devpass@localhost:5672

## Hướng dẫn chạy nhanh (PowerShell / CMD)

1) Cài dependencies

```powershell
npm install
```

2) Khởi động RabbitMQ (và bật Management plugin)

Management UI: http://localhost:15672 (guest/guest)

3) Tạo các queue cần thiết nếu RabbitMQ không tự động tạo:

- `etl.validate`
- `etl.transform`
- `etl.load`
- `etl.dlq`

4) Mở 3 terminal và chạy 3 worker (mỗi terminal 1 lệnh):

```powershell
node src/workers/validateWorker.js
node src/workers/transformWorker.js
node src/workers/loadWorker.js
```

5) Gửi dữ liệu thử (producer):

```powershell
node src/producers/csv_ingest.js
```

Sau khi chạy, producer sẽ đọc các file trong `data/` và publish từng dòng vào queue `etl.validate`.


## Kiểm tra / Debug

- Trên RabbitMQ (UI): http://localhost:15672/#/queues — kiểm tra các queue và số consumer.
	- Quan trọng: `etl.validate`, `etl.transform`, `etl.load`, `etl.dlq`.

- Kiểm tra MySQL (XAMPP)

```sql
-- Staging
SELECT COUNT(*) FROM staging_order_lines;

-- Data Warehouse (Star Schema)
SELECT COUNT(*) FROM etl_dw.dim_store;
SELECT COUNT(*) FROM etl_dw.dim_product;
SELECT COUNT(*) FROM etl_dw.dim_date;
SELECT COUNT(*) FROM etl_dw.fact_sales;

-- Join mẫu (fact + dimension)
SELECT f.order_key, d.date_value, s.store_code, p.item_sku, f.qty, f.line_total
FROM etl_dw.fact_sales f
JOIN etl_dw.dim_date d   ON d.date_key = f.date_key
JOIN etl_dw.dim_store s  ON s.store_key = f.store_key
JOIN etl_dw.dim_product p ON p.product_key = f.product_key
ORDER BY f.id DESC
LIMIT 10;
```

### Kết quả chạy thực tế (Phần của Phan Văn Thành)
Sau khi chạy pipeline với 3 file CSV nguồn:
| Bảng                 | Số bản ghi | Mô tả                        |
| -------------------- | ---------- | ---------------------------- |
| `etl_dw.dim_store`   | **7**      | Danh mục cửa hàng            |
| `etl_dw.dim_product` | **29**     | Danh mục sản phẩm            |
| `etl_dw.dim_date`    | **16**     | Ngày phát sinh đơn           |
| `etl_dw.fact_sales`  | **40**     | Giao dịch bán hàng chuẩn hoá |

Kết quả mẫu:
| order_key | date_value | store_code | item_sku | qty | line_total |
| --------- | ---------- | ---------- | -------- | --- | ---------- |
| W1009|csv | 2025-10-09 | QN02       | SKU019   | 1   | 290,000    |
| C0009|csv | 2025-10-11 | DN02       | SKU029   | 1   | 155,000    |
| P016|csv  | 2025-10-16 | DN01       | SKU020   | 1   | 270,000    |
| W1001|csv | 2025-10-01 | DN01       | SKU010   | 1   | 550,000    |
| W1008|csv | 2025-10-08 | DN01       | SKU018   | 1   | 190,000    |

  
## Phần của Tài

### Validation Enhancements (validateWorker.js)

**Các phần đã thực hiện:**

1. **Regex Validation:**

   - Email: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` - kiểm tra định dạng email hợp lệ
   - Price: `/^(?:\d+)(?:\.\d{1,2})?$/` - chỉ cho phép số nguyên hoặc số thập phân tối đa 2 chữ số (ví dụ: 123, 123.45)

2. **Stricter Schema Validation:**

   - `qty`: Bắt buộc số nguyên dương (> 0), không chấp nhận 0, số âm, hoặc số thập phân
   - `unit_price`: Phải > 0, định dạng theo regex price
   - `customer_email`: Thêm trường mới, optional/nullable, với regex validation

3. **CSV Mapping:**
   - Map `customer_email` từ các cột: `customer_email` hoặc `email`
   - Xử lý chuỗi rỗng `""` → `null` để tránh lỗi validation không cần thiết

## Tiến độ & Phân công công việc

| STT | Thành viên          | Module phụ trách    | Nhiệm vụ cụ thể                                                                                                                     | Tiến độ      | Ghi chú                          |
| --- | ------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------ | -------------------------------- |
| 1   | **Phan Văn Thành**  | Ingest + Load DW | - Đọc dữ liệu CSV/DB<br>- Publish message lên RabbitMQ<br>- Thiết lập exchange, queue, topology<br>- Xây dựng Star Schema + Load DW | ✅ Hoàn thành | Dữ liệu đã ETL thành công đến DW |
| 2   | **Đỗ Huỳnh Tài**    | Validate          | - Kiểm tra schema, email, số lượng, giá trị hợp lệ<br>- Forward sang `etl.transform`<br>- Lỗi → `etl.dlq`                           | ✅ Hoàn thành | Regex hoạt động đúng             |
| 3   | **Trần Đức Cảnh**   | Transform        | - Chuẩn hoá format ngày/tiền<br>- Mapping category<br>- Tính `order_line_id`, `total_price`                                         | ⏳ Chuẩn bị   | Đợi Tài hoàn tất validate        |
| 4   | **Đỗ Thiên Sáng**   | Load DW         | - Upsert dimension (store/product/date)<br>- Insert `fact_sales`<br>- Tối ưu index + view                                           | ⏳ Chuẩn bị   | Dựa vào schema DW đã có          |
| 5   | **Dương Đình Hiếu** | Log/Monitor      | - Ghi log từng bước ETL vào DB<br>- Ghi lỗi / success / retry<br>- Xây dashboard thống kê                                           | ⏳ Chuẩn bị   | Sẽ test khi load ổn định         |


## Hướng dẫn kéo project về (cho từng thành viên)

git clone git@github.com:ahryxx0602/etl-sales-integration.git

cd etl_sales

### Kiểm tra danh sách nhánh
git branch -a

### Checkout về nhánh của mình

git checkout <Tên_branch>

Ví dụ: git checkout Canh

### Cập nhật code mới nhất từ nhánh chính (nếu cần)

git pull origin main

### Khi hoàn thành, push lên branch cá nhân
git add .
git commit -m "Hoàn thành module của mình"
git push origin <Tên_branch>

💡 Mỗi người làm việc độc lập trên branch của mình, khi xong thì tạo Pull Request (PR) để merge vào main.

---
