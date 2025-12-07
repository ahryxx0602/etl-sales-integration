-- =========================
-- Migration: Đảm bảo bảng etl_logs có đầy đủ các cột
-- =========================
-- Script này kiểm tra và thêm các cột còn thiếu vào etl_logs
-- An toàn để chạy nhiều lần (idempotent)

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

SELECT 'Migration completed: All required columns added to etl_logs' AS result;

