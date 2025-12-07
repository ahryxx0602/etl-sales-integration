-- =========================
-- UTILITY: TRUNCATE TẤT CẢ CÁC BẢNG TRONG new_db
-- =========================
-- Script này sẽ xóa tất cả dữ liệu trong các bảng nhưng giữ nguyên cấu trúc
-- Sử dụng khi cần reset dữ liệu để test lại ETL process

USE new_db;

-- Tắt kiểm tra foreign key tạm thời
SET FOREIGN_KEY_CHECKS = 0;

-- Truncate các bảng theo thứ tự (từ bảng con đến bảng cha)
TRUNCATE TABLE order_items;
TRUNCATE TABLE orders;
TRUNCATE TABLE etl_logs;
TRUNCATE TABLE products;
TRUNCATE TABLE customers;
TRUNCATE TABLE stores;

-- Bật lại kiểm tra foreign key
SET FOREIGN_KEY_CHECKS = 1;

SELECT 'All tables in new_db have been truncated successfully' AS result;

