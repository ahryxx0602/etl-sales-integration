-- ======================================================
-- 🏗️  CREATE STAR SCHEMA: etl_dw
-- ======================================================

CREATE DATABASE IF NOT EXISTS etl_dw
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;


-- ======================================================
-- 🧭  DIMENSION: STORE
-- ======================================================
CREATE TABLE IF NOT EXISTS dim_store (
  store_key INT AUTO_INCREMENT PRIMARY KEY,
  store_code VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- Index để tìm store nhanh (theo mã)
CREATE INDEX idx_store_code ON dim_store(store_code);


-- ======================================================
-- 🧭  DIMENSION: PRODUCT
-- ======================================================
CREATE TABLE IF NOT EXISTS dim_product (
  product_key INT AUTO_INCREMENT PRIMARY KEY,
  item_sku VARCHAR(100) NOT NULL UNIQUE,
  item_name VARCHAR(255)
) ENGINE=InnoDB;

CREATE INDEX idx_product_sku ON dim_product(item_sku);


-- ======================================================
-- 🧭  DIMENSION: DATE
-- ======================================================
CREATE TABLE IF NOT EXISTS dim_date (
  date_key INT PRIMARY KEY,         -- YYYYMMDD
  date_value DATE,
  year INT,
  month INT,
  day INT,
  dow INT,
  month_name VARCHAR(12)
) ENGINE=InnoDB;

CREATE INDEX idx_date_year_month ON dim_date(year, month);


-- ======================================================
-- 📦  FACT TABLE: SALES
-- ======================================================
CREATE TABLE IF NOT EXISTS fact_sales (
  fact_key BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_key VARCHAR(50) NOT NULL,
  date_key INT NOT NULL,
  store_key INT NOT NULL,
  product_key INT NOT NULL,
  qty INT NOT NULL,
  line_total DECIMAL(18,2),
  currency VARCHAR(10),
  source_tag VARCHAR(20),
  order_ts DATETIME,
  UNIQUE KEY uniq_order_product (order_key, product_key),
  FOREIGN KEY (date_key) REFERENCES dim_date(date_key),
  FOREIGN KEY (store_key) REFERENCES dim_store(store_key),
  FOREIGN KEY (product_key) REFERENCES dim_product(product_key)
) ENGINE=InnoDB;

-- ======================================================
-- ⚡ INDEX TỐI ƯU HÓA TRUY VẤN
-- ======================================================
CREATE INDEX idx_fact_sales_date ON fact_sales(date_key);
CREATE INDEX idx_fact_sales_store ON fact_sales(store_key);
CREATE INDEX idx_fact_sales_product ON fact_sales(product_key);
CREATE INDEX idx_fact_sales_currency ON fact_sales(currency);
CREATE INDEX idx_fact_sales_order_ts ON fact_sales(order_ts);
