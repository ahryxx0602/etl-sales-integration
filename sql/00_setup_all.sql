-- =========================
-- SCRIPT MASTER: TẠO TẤT CẢ DATABASES VÀ INSERT DATA
-- =========================
-- Chạy script này để setup toàn bộ hệ thống từ đầu
-- 
-- Cách 1: Chạy từng file riêng lẻ:
--   mysql -u root -p < sql/01_create_old_db.sql
--   mysql -u root -p < sql/02_create_new_db.sql
--   mysql -u root -p < sql/03_insert_fake_data.sql
--   mysql -u root -p < sql/04_migrate_etl_logs.sql
--
-- Cách 2: Chạy tất cả cùng lúc:
--   mysql -u root -p < sql/00_setup_all.sql
-- =========================

-- Import nội dung từ các file riêng lẻ

-- =========================
-- 1. TẠO DATABASE CŨ (Nguồn dữ liệu)
-- =========================
DROP DATABASE IF EXISTS old_db;
CREATE DATABASE old_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE old_db;

-- Bảng cửa hàng
CREATE TABLE old_stores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_code VARCHAR(20),
    store_name VARCHAR(255),
    address VARCHAR(255)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Bảng khách hàng
CREATE TABLE old_customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20),
    full_name VARCHAR(255),
    email VARCHAR(255)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Bảng sản phẩm
CREATE TABLE old_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(20),
    product_name VARCHAR(255),
    category VARCHAR(100)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Bảng đơn hàng
CREATE TABLE old_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_code VARCHAR(50),
    store_code VARCHAR(20),
    customer_phone VARCHAR(20),
    order_date VARCHAR(50)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Bảng chi tiết đơn hàng
CREATE TABLE old_order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_code VARCHAR(50),
    item_sku VARCHAR(20),
    item_name VARCHAR(255),
    qty VARCHAR(10),
    unit_price VARCHAR(20),
    currency VARCHAR(20)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Bảng raw orders (từ CSV)
CREATE TABLE raw_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50),
    store_code VARCHAR(20),
    customer_phone VARCHAR(20),
    order_date VARCHAR(50),
    item_sku VARCHAR(20),
    item_name VARCHAR(255),
    qty VARCHAR(10),
    unit_price VARCHAR(20),
    currency VARCHAR(20),
    source_file VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================
-- 2. TẠO DATABASE MỚI (Đích - Data Warehouse)
-- =========================
DROP DATABASE IF EXISTS new_db;
CREATE DATABASE new_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE new_db;

-- =========================
-- BẢNG CỬA HÀNG (CHUẨN HOÁ)
-- =========================
CREATE TABLE stores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_code VARCHAR(10) UNIQUE NOT NULL,
    store_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_store_code (store_code)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================
-- BẢNG KHÁCH HÀNG
-- =========================
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_phone (phone)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================
-- BẢNG SẢN PHẨM (CHUẨN TÊN)
-- =========================
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(20) UNIQUE NOT NULL,
    product_name VARCHAR(255),
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sku (sku)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================
-- BẢNG ĐƠN HÀNG (CHUẨN DATETIME)
-- =========================
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_code VARCHAR(50) UNIQUE NOT NULL,
    store_id INT NOT NULL,
    customer_id INT,
    order_datetime DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    INDEX idx_order_code (order_code),
    INDEX idx_order_datetime (order_datetime)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================
-- BẢNG CHI TIẾT ĐƠN HÀNG
-- =========================
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    qty INT NOT NULL,
    unit_price DECIMAL(18,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'VND',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================
-- BẢNG LOG ETL (THEO DÕI VALIDATE)
-- =========================
CREATE TABLE etl_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    source_table VARCHAR(50),
    source_type VARCHAR(20),
    record_id INT,
    order_code VARCHAR(50),
    status VARCHAR(20) NOT NULL,
    message TEXT,
    error_details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_source_type (source_type),
    INDEX idx_created_at (created_at)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================
-- 3. INSERT FAKE DATA
-- =========================
-- NOTE: Dữ liệu fake được tách ra file riêng: 03_insert_fake_data.sql
-- Chạy file đó sau khi tạo databases:
--   mysql -u root -p < sql/03_insert_fake_data.sql

-- =========================
-- 4. MIGRATION: Đảm bảo bảng etl_logs có đầy đủ các cột
-- =========================
USE new_db;

-- Kiểm tra và thêm cột source_type
SET @column_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'new_db'
    AND TABLE_NAME = 'etl_logs'
    AND COLUMN_NAME = 'source_type'
);

SET @sql = IF(@column_exists = 0,
  'ALTER TABLE etl_logs ADD COLUMN source_type VARCHAR(20) AFTER source_table',
  'SELECT "Column source_type already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Kiểm tra và thêm cột order_code
SET @column_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'new_db'
    AND TABLE_NAME = 'etl_logs'
    AND COLUMN_NAME = 'order_code'
);

SET @sql = IF(@column_exists = 0,
  'ALTER TABLE etl_logs ADD COLUMN order_code VARCHAR(50) AFTER record_id',
  'SELECT "Column order_code already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Kiểm tra và thêm cột record_id (nếu chưa có)
SET @column_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'new_db'
    AND TABLE_NAME = 'etl_logs'
    AND COLUMN_NAME = 'record_id'
);

SET @sql = IF(@column_exists = 0,
  'ALTER TABLE etl_logs ADD COLUMN record_id INT AFTER source_type',
  'SELECT "Column record_id already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Kiểm tra và thêm cột error_details (nếu chưa có)
SET @column_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'new_db'
    AND TABLE_NAME = 'etl_logs'
    AND COLUMN_NAME = 'error_details'
);

SET @sql = IF(@column_exists = 0,
  'ALTER TABLE etl_logs ADD COLUMN error_details JSON AFTER message',
  'SELECT "Column error_details already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Thêm các index nếu chưa có
SET @index_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = 'new_db'
    AND TABLE_NAME = 'etl_logs'
    AND INDEX_NAME = 'idx_source_type'
);

SET @sql = IF(@index_exists = 0,
  'CREATE INDEX idx_source_type ON etl_logs (source_type)',
  'SELECT "Index idx_source_type already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =========================
-- HOÀN TẤT
-- =========================
SELECT '========================================' AS '';
SELECT 'Setup completed successfully!' AS '';
SELECT 'Databases created:' AS '';
SELECT '  - old_db (source database)' AS '';
SELECT '  - new_db (data warehouse)' AS '';
SELECT '' AS '';
SELECT 'NOTE: Run 03_insert_fake_data.sql to insert fake data' AS '';
SELECT '========================================' AS '';
