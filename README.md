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
CSV_DIR=data
```

Lưu ý: nếu bạn dùng XAMPP, đảm bảo MySQL đang chạy và database `etl_sales` tồn tại.

### Cài đặt RabbitMQ

Bạn có thể chọn 1 trong 3 cách:
- **Cách A (local):** Cài RabbitMQ + Erlang, bật Management plugin.  
  UI: http://localhost:15672 (guest/guest)
- **Cách B (Docker):**  
  ```bash
  docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 \
    -e RABBITMQ_DEFAULT_USER=dev \
    -e RABBITMQ_DEFAULT_PASS=devpass \
    rabbitmq:3.13-management
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

- Trên MySQL, một số truy vấn hữu ích:

```sql
SELECT COUNT(*) FROM staging_order_lines;
SELECT COUNT(*) FROM dw_sales;
SELECT * FROM staging_order_lines ORDER BY id DESC LIMIT 10;
SELECT * FROM dw_sales ORDER BY id DESC LIMIT 10;
```

## Lưu ý vận hành & mở rộng

- Dead Letter Queue (`etl.dlq`): chứa message lỗi để phân tích và retry.
- Thêm nguồn dữ liệu: triển khai producer mới (ví dụ `src/producers/db_ingest.js`) để publish message cùng định dạng.
- Scale: chạy nhiều worker cho từng bước để tăng throughput; cân nhắc retry/backoff cho các lỗi tạm thời.

## Tiến độ & Phân công công việc

| STT | Thành viên          | Module phụ trách    | Nhiệm vụ cụ thể                                                                                                  | Tiến độ           | Ghi chú                                |
| --- | ------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------- | -------------------------------------- |
| 1   | **Phan Văn Thành**  | 🧩 Ingest (Extract) | - Đọc dữ liệu CSV / DB<br>- Publish message lên RabbitMQ<br>- Thiết lập exchange, queue, topology                | ✅ Hoàn thành      | Đã chạy thử với file CSV mẫu           |
| 2   | **Đỗ Huỳnh Tài**    | ✅ Validate          | - Kiểm tra schema, email, số lượng, giá trị hợp lệ<br>- Forward hợp lệ sang `etl.transform`<br>- Lỗi → `etl.dlq` | 🟡 Đang thực hiện | Cần test regex email và price          |
| 3   | **Trần Đức Cảnh**   | ⚙️ Transform        | - Chuẩn hoá format ngày/tiền<br>- Mapping category<br>- Tạo `order_line_id`, tính `total_price`                  | ⏳ Chuẩn bị        | Đợi Tài xong Validate để test pipeline |
| 4   | **Đỗ Thiên Sáng**   | 🗄️ Load            | - Upsert dimension (customer/product)<br>- Insert fact_sales<br>- Idempotent bằng `messageId`                    | ⏳ Chuẩn bị        | Dựa vào schema MySQL đã có             |
| 5   | **Dương Đình Hiếu** | 🧾 Log/Monitor      | - Ghi log từng bước ETL vào `etl_logs`<br>- Ghi lỗi / success / retry<br>- Theo dõi `q.dlq`                      | ⏳ Chuẩn bị        | Sẽ test cùng Sáng khi load hoạt động   |

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
