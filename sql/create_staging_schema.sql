-- ======================================================
-- 🏗️  CREATE STAGING SCHEMA: etl_sales
-- ======================================================

CREATE DATABASE IF NOT EXISTS etl_sales
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE etl_sales;

CREATE TABLE IF NOT EXISTS staging_order_lines (
  order_key VARCHAR(50) NOT NULL PRIMARY KEY,
  store_code VARCHAR(50),
  customer_phone VARCHAR(20),
  order_ts DATETIME,
  item_sku VARCHAR(100),
  item_name VARCHAR(255),
  qty INT,
  unit_price DECIMAL(18,2),
  line_total DECIMAL(18,2),
  currency VARCHAR(10),
  source_tag VARCHAR(20),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE INDEX idx_stg_store ON staging_order_lines(store_code);
CREATE INDEX idx_stg_sku ON staging_order_lines(item_sku);
CREATE INDEX idx_stg_order_ts ON staging_order_lines(order_ts);
