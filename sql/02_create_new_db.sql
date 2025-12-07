-- =========================
-- TẠO DATABASE MỚI (Đích - Data Warehouse)
-- =========================
-- Script này chỉ tạo new_db và các tables, không có dữ liệu

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

SELECT 'new_db created successfully!' AS result;
