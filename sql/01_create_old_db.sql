-- =========================
-- TẠO DATABASE CŨ (Nguồn dữ liệu)
-- =========================
-- Script này chỉ tạo old_db và các tables, không có dữ liệu
-- Dữ liệu sẽ được insert từ file 03_insert_fake_data.sql

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

SELECT 'old_db created successfully!' AS result;
