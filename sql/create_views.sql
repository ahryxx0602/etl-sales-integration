
-- ======================================================
-- 📊 VIEW 1: Tổng hợp doanh thu theo tháng & cửa hàng
-- ======================================================
CREATE OR REPLACE VIEW vw_sales_summary AS
SELECT 
  d.year,
  d.month,
  s.store_code,
  SUM(f.qty) AS total_qty,
  SUM(f.line_total) AS total_sales,
  f.currency
FROM fact_sales f
JOIN dim_store s ON f.store_key = s.store_key
JOIN dim_date d ON f.date_key = d.date_key
GROUP BY d.year, d.month, s.store_code, f.currency;

-- ======================================================
-- 📊 VIEW 2: Top sản phẩm bán chạy
-- ======================================================
CREATE OR REPLACE VIEW vw_top_products AS
SELECT 
  p.item_sku,
  p.item_name,
  SUM(f.qty) AS total_qty,
  SUM(f.line_total) AS total_sales,
  f.currency
FROM fact_sales f
JOIN dim_product p ON f.product_key = p.product_key
GROUP BY p.item_sku, p.item_name, f.currency
ORDER BY total_sales DESC;

-- ======================================================
-- 📊 VIEW 3: Tổng doanh thu theo nguồn bán hàng
-- ======================================================
CREATE OR REPLACE VIEW vw_sales_by_source AS
SELECT 
  f.source_tag,
  COUNT(DISTINCT f.order_key) AS total_orders,
  SUM(f.line_total) AS total_sales,
  f.currency
FROM fact_sales f
GROUP BY f.source_tag, f.currency
ORDER BY total_sales DESC;
