-- =========================
-- UTILITY: TRUNCATE old_db
-- =========================
-- Script này xóa tất cả dữ liệu trong old_db để test lại ETL process
-- Giữ nguyên cấu trúc tables
-- 
-- Lưu ý: Chỉ xóa dữ liệu trong old_db, không ảnh hưởng new_db
-- =========================

USE old_db;

-- Tắt foreign key checks tạm thời để truncate
SET FOREIGN_KEY_CHECKS = 0;

-- Truncate tất cả tables trong old_db
TRUNCATE TABLE old_order_items;
TRUNCATE TABLE old_orders;
TRUNCATE TABLE raw_orders;
TRUNCATE TABLE old_products;
TRUNCATE TABLE old_customers;
TRUNCATE TABLE old_stores;

-- Bật lại foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Thông báo hoàn thành
SELECT '========================================' AS '';
SELECT 'old_db truncated successfully!' AS '';
SELECT 'All data in old_db has been deleted.' AS '';
SELECT 'Tables structure remains intact.' AS '';
SELECT '========================================' AS '';

