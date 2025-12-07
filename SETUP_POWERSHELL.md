# Hướng dẫn Setup Databases trên PowerShell

## Vấn đề
PowerShell trên Windows không hỗ trợ toán tử redirect `<` như bash/sh, nên lệnh `mysql -u root -p < file.sql` sẽ không hoạt động.

## Giải pháp

### Cách 1: Sử dụng script tự động (Khuyến nghị)

Chạy script setup tự động:
```powershell
.\setup-databases.ps1
```

Script này sẽ:
- **Tự động tìm MySQL** trong PATH hoặc các đường dẫn thông thường
- **Tự động đọc từ file `.env`** (MYSQL_USER, MYSQL_PASS, MYSQL_HOST) nếu có
- Hỏi bạn chọn setup đầy đủ (theo README) hoặc từng file riêng lẻ
- Tự động chạy `00_setup_all.sql` rồi `03_insert_fake_data.sql` (theo đúng README.md)
- Tự động xử lý password
- Hiển thị tiến trình và kết quả

### Cách 2: Sử dụng script chạy file SQL đơn lẻ

Chạy một file SQL cụ thể:
```powershell
.\run-sql.ps1 sql\00_setup_all.sql
```

Hoặc với các file khác:
```powershell
.\run-sql.ps1 sql\01_create_old_db.sql
.\run-sql.ps1 sql\02_create_new_db.sql
.\run-sql.ps1 sql\03_insert_fake_data.sql
.\run-sql.ps1 sql\04_migrate_etl_logs.sql
```

### Cách 3: Sử dụng Get-Content trực tiếp

Nếu muốn chạy trực tiếp trong PowerShell mà không dùng script:

```powershell
# Chạy file setup tất cả
Get-Content sql\00_setup_all.sql -Raw | mysql -u root -p

# Hoặc chạy từng file
Get-Content sql\01_create_old_db.sql -Raw | mysql -u root -p
Get-Content sql\02_create_new_db.sql -Raw | mysql -u root -p
Get-Content sql\03_insert_fake_data.sql -Raw | mysql -u root -p
Get-Content sql\04_migrate_etl_logs.sql -Raw | mysql -u root -p
```

## Lưu ý

1. **Tự động tìm MySQL**: Scripts sẽ tự động tìm MySQL trong:
   - PATH environment variable
   - Các đường dẫn thông thường (Program Files, XAMPP, WAMP, etc.)
   - Nếu không tìm thấy, sẽ hiển thị hướng dẫn

2. **Encoding**: Scripts đã được cấu hình để sử dụng UTF-8, đảm bảo các ký tự tiếng Việt được xử lý đúng.

3. **Tự động đọc từ .env file**: 
   - Script sẽ tự động đọc `MYSQL_USER`, `MYSQL_PASS`, `MYSQL_HOST` từ file `.env` nếu có
   - Bạn không cần truyền tham số nếu đã có file `.env`
   - Ví dụ file `.env`:
     ```
     MYSQL_HOST=127.0.0.1
     MYSQL_USER=root
     MYSQL_PASS=123456
     ```

4. **Password**: 
   - **Tự động từ .env**: Nếu có file `.env` với `MYSQL_PASS`, script sẽ tự động dùng
   - **Mặc định**: Nếu không có trong .env và không truyền password, MySQL sẽ tự động hỏi password khi chạy (an toàn nhất)
   - **Truyền trực tiếp**: `.\run-sql.ps1 sql\00_setup_all.sql -Password "yourpassword"` (không an toàn nhưng tiện)
   - **Không có password**: Nếu MySQL của bạn không có password: `.\setup-databases.ps1 -NoPassword`
   - **Tắt đọc .env**: `.\setup-databases.ps1 -UseEnvFile:$false` (nếu muốn không đọc từ .env)

4. **Execution Policy**: Nếu gặp lỗi về execution policy, chạy:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

5. **MySQL không tìm thấy**: Nếu MySQL không được tìm thấy tự động, bạn có thể:
   - Thêm MySQL vào PATH, hoặc
   - Chỉ định đường dẫn MySQL: `.\run-sql.ps1 sql\00_setup_all.sql -MySQLPath "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"`

## Thứ tự chạy (nếu chạy từng file)

1. `sql\01_create_old_db.sql` - Tạo database cũ
2. `sql\02_create_new_db.sql` - Tạo database mới  
3. `sql\03_insert_fake_data.sql` - Insert dữ liệu test
4. `sql\04_migrate_etl_logs.sql` - Migrate ETL logs

Hoặc đơn giản chỉ cần chạy:
```powershell
.\run-sql.ps1 sql\00_setup_all.sql
```

File `00_setup_all.sql` đã bao gồm tất cả các bước trên.

