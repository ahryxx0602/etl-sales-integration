# ============================================================================
# ETL Utilities - Script tổng hợp các tiện ích cho ETL System
# ============================================================================
# Sử dụng: .\etl-utils.ps1 [action]
# Ví dụ: .\etl-utils.ps1 check-data
# Hoặc chạy không tham số để hiển thị menu: .\etl-utils.ps1
# ============================================================================

param(
    [string]$Action = "",
    [string]$User = "",
    [string]$Password = "",
    [string]$DbHost = "",
    [switch]$UseEnvFile = $true
)

# ============================================================================
# Common Functions
# ============================================================================

# Hàm đọc .env file
function Read-EnvFile {
    $envFile = ".env"
    if (Test-Path $envFile) {
        $envVars = @{}
        Get-Content $envFile | ForEach-Object {
            if ($_ -match '^\s*([^#][^=]*?)\s*=\s*(.*?)\s*$') {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim()
                if ($value -match '^"(.*)"$') {
                    $value = $matches[1]
                }
                $envVars[$key] = $value
            }
        }
        return $envVars
    }
    return @{}
}

# Hàm tìm MySQL executable
function Find-MySQL {
    $mysqlInPath = Get-Command mysql -ErrorAction SilentlyContinue
    if ($mysqlInPath) { return $mysqlInPath.Path }
    
    $commonPaths = @(
        "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
        "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe",
        "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe",
        "C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysql.exe",
        "C:\Program Files (x86)\MySQL\MySQL Server 8.4\bin\mysql.exe",
        "C:\xampp\mysql\bin\mysql.exe",
        "C:\wamp64\bin\mysql\mysql8.0.27\bin\mysql.exe"
    )
    
    foreach ($path in $commonPaths) {
        if (Test-Path $path) { return $path }
    }
    return $null
}

# Hàm khởi tạo MySQL connection
function Initialize-MySQL {
    param(
        [string]$User,
        [string]$Password,
        [string]$DbHost,
        [switch]$UseEnvFile
    )
    
    # Đọc từ .env file
    if ($UseEnvFile) {
        $envVars = Read-EnvFile
        if ($envVars.Count -gt 0) {
            if ([string]::IsNullOrWhiteSpace($User) -and $envVars.ContainsKey("MYSQL_USER")) {
                $User = $envVars["MYSQL_USER"]
            }
            if ([string]::IsNullOrWhiteSpace($Password) -and $envVars.ContainsKey("MYSQL_PASS")) {
                $Password = $envVars["MYSQL_PASS"]
            }
            if ([string]::IsNullOrWhiteSpace($DbHost) -and $envVars.ContainsKey("MYSQL_HOST")) {
                $DbHost = $envVars["MYSQL_HOST"]
            }
        }
    }
    
    # Set giá trị mặc định
    if ([string]::IsNullOrWhiteSpace($User)) { $User = "root" }
    if ([string]::IsNullOrWhiteSpace($DbHost)) { $DbHost = "localhost" }
    
    # Tìm MySQL
    $mysqlPath = Find-MySQL
    if (-not $mysqlPath) {
        Write-Host "✗ Không tìm thấy MySQL!" -ForegroundColor Red
        Write-Host "Vui lòng cài đặt MySQL hoặc thêm MySQL vào PATH" -ForegroundColor Yellow
        exit 1
    }
    
    # Tạo MySQL args
    $mysqlArgs = @("-u$User", "-h$DbHost")
    if ($Password) {
        $mysqlArgs += "-p$Password"
    } else {
        $mysqlArgs += "-p"
    }
    
    return @{
        Path = $mysqlPath
        Args = $mysqlArgs
    }
}

# ============================================================================
# Action Functions
# ============================================================================

function Show-Menu {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  ETL UTILITIES - MENU" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Check Data (old_db)          - Kiểm tra dữ liệu trong old_db" -ForegroundColor White
    Write-Host "2. Check New DB                 - Kiểm tra dữ liệu trong new_db và ETL logs" -ForegroundColor White
    Write-Host "3. Check Validation Errors      - Phân tích validation errors" -ForegroundColor White
    Write-Host "4. Analyze Null Fields          - Phân tích các trường null" -ForegroundColor White
    Write-Host "5. Check Encoding               - Kiểm tra encoding trong databases" -ForegroundColor White
    Write-Host "6. Reset and Reload            - Reset và reload tất cả dữ liệu" -ForegroundColor White
    Write-Host "0. Exit" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Sử dụng: .\etl-utils.ps1 [action]" -ForegroundColor Yellow
    Write-Host "Ví dụ: .\etl-utils.ps1 check-data" -ForegroundColor Yellow
    Write-Host ""
}

function Invoke-CheckData {
    $mysql = Initialize-MySQL -User $User -Password $Password -DbHost $DbHost -UseEnvFile:$UseEnvFile
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  KIỂM TRA DỮ LIỆU DATABASES" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    $query = @"
USE old_db;
SELECT 'Stores' as Type, COUNT(*) as Count FROM old_stores
UNION ALL
SELECT 'Customers', COUNT(*) FROM old_customers
UNION ALL
SELECT 'Products', COUNT(*) FROM old_products
UNION ALL
SELECT 'Orders', COUNT(*) FROM old_orders
UNION ALL
SELECT 'Order Items', COUNT(*) FROM old_order_items;
"@
    
    Write-Host "📊 Dữ liệu trong old_db:" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Gray
    $query | & $mysql.Path $mysql.Args
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  HOÀN TẤT!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
}

function Invoke-CheckNewDb {
    $mysql = Initialize-MySQL -User $User -Password $Password -DbHost $DbHost -UseEnvFile:$UseEnvFile
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  KIỂM TRA DỮ LIỆU TRONG new_db" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    $query = @"
USE new_db;
SELECT 'Stores' as Type, COUNT(*) as Count FROM stores
UNION ALL
SELECT 'Customers', COUNT(*) FROM customers
UNION ALL
SELECT 'Products', COUNT(*) FROM products
UNION ALL
SELECT 'Orders', COUNT(*) FROM orders
UNION ALL
SELECT 'Order Items', COUNT(*) FROM order_items
UNION ALL
SELECT 'ETL Logs', COUNT(*) FROM etl_logs;
"@
    
    Write-Host "📊 Dữ liệu trong new_db (Data Warehouse):" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Gray
    $query | & $mysql.Path $mysql.Args
    
    Write-Host ""
    Write-Host "📋 ETL Logs (10 records gần nhất):" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Gray
    
    $logsQuery = @"
USE new_db;
SELECT 
    id,
    source_type,
    status,
    LEFT(message, 50) as message_preview,
    created_at
FROM etl_logs
ORDER BY created_at DESC
LIMIT 10;
"@
    
    $logsQuery | & $mysql.Path $mysql.Args
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  HOÀN TẤT!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
}

function Invoke-CheckValidationErrors {
    $mysql = Initialize-MySQL -User $User -Password $Password -DbHost $DbHost -UseEnvFile:$UseEnvFile
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  PHÂN TÍCH VALIDATION ERRORS" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # 1. Tổng quan validation errors
    Write-Host "1. Tổng quan validation errors:" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Gray
    $query1 = @"
SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci';
USE new_db;
SELECT 
    status,
    COUNT(*) as count,
    COUNT(DISTINCT order_code) as unique_orders
FROM etl_logs
WHERE status = 'validation_error'
GROUP BY status;
"@
    $query1 | & $mysql.Path $mysql.Args
    Write-Host ""
    
    # 2. Top validation errors theo order_code
    Write-Host "2. Top 20 validation errors (theo order_code):" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Gray
    $query2 = @"
SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci';
USE new_db;
SELECT 
    order_code,
    source_type,
    message,
    COUNT(*) as error_count,
    MAX(created_at) as last_error
FROM etl_logs
WHERE status = 'validation_error'
GROUP BY order_code, source_type, message
ORDER BY error_count DESC, last_error DESC
LIMIT 20;
"@
    $query2 | & $mysql.Path $mysql.Args
    Write-Host ""
    
    # 3. Phân loại validation errors
    Write-Host "3. Phân loại validation errors (theo loại lỗi):" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Gray
    $query3 = @"
SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci';
USE new_db;
SELECT 
    CASE 
        WHEN message LIKE '%order_date%' OR message LIKE '%date%' THEN 'Date Format Error'
        WHEN message LIKE '%email%' THEN 'Email Error'
        WHEN message LIKE '%unit_price%' OR message LIKE '%price%' THEN 'Price Error'
        WHEN message LIKE '%qty%' OR message LIKE '%quantity%' THEN 'Quantity Error'
        WHEN message LIKE '%currency%' THEN 'Currency Error'
        ELSE 'Other Error'
    END as error_type,
    COUNT(*) as count,
    COUNT(DISTINCT order_code) as unique_orders
FROM etl_logs
WHERE status = 'validation_error'
GROUP BY error_type
ORDER BY count DESC;
"@
    $query3 | & $mysql.Path $mysql.Args
    Write-Host ""
    
    # 4. Chi tiết validation errors mới nhất
    Write-Host "4. 10 validation errors mới nhất:" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Gray
    $query4 = @"
SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci';
USE new_db;
SELECT 
    id,
    source_table,
    source_type,
    order_code,
    message,
    created_at
FROM etl_logs
WHERE status = 'validation_error'
ORDER BY created_at DESC
LIMIT 10;
"@
    $query4 | & $mysql.Path $mysql.Args
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  HOÀN TẤT!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
}

function Invoke-AnalyzeNullFields {
    $mysql = Initialize-MySQL -User $User -Password $Password -DbHost $DbHost -UseEnvFile:$UseEnvFile
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  PHÂN TÍCH NULL FIELDS" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # 1. Orders có store_name null
    Write-Host "1. Orders có store_name NULL:" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Gray
    $query1 = @"
SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci';
USE new_db;
SELECT 
    o.id,
    o.order_code,
    o.store_id,
    s.store_code,
    s.store_name
FROM orders o
LEFT JOIN stores s ON o.store_id = s.id
WHERE s.store_name IS NULL
LIMIT 10;
"@
    $query1 | & $mysql.Path $mysql.Args
    Write-Host ""
    
    # 2. Orders có customer_name null
    Write-Host "2. Orders có customer_name NULL:" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Gray
    $query2 = @"
SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci';
USE new_db;
SELECT 
    o.id,
    o.order_code,
    o.customer_id,
    c.phone,
    c.full_name
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
WHERE c.full_name IS NULL
LIMIT 10;
"@
    $query2 | & $mysql.Path $mysql.Args
    Write-Host ""
    
    # 3. Stores không có tên
    Write-Host "3. Stores không có tên (chỉ có code):" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Gray
    $query3 = @"
SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci';
USE new_db;
SELECT 
    id,
    store_code,
    store_name,
    created_at
FROM stores
WHERE store_name IS NULL
ORDER BY created_at DESC;
"@
    $query3 | & $mysql.Path $mysql.Args
    Write-Host ""
    
    # 4. Customers không có tên
    Write-Host "4. Customers không có tên (chỉ có phone):" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Gray
    $query4 = @"
SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci';
USE new_db;
SELECT 
    id,
    phone,
    full_name,
    email,
    created_at
FROM customers
WHERE full_name IS NULL
ORDER BY created_at DESC
LIMIT 10;
"@
    $query4 | & $mysql.Path $mysql.Args
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  HOÀN TẤT!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
}

function Invoke-CheckEncoding {
    $mysql = Initialize-MySQL -User $User -Password $Password -DbHost $DbHost -UseEnvFile:$UseEnvFile
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  KIỂM TRA ENCODING TRONG DATABASES" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "📊 Kiểm tra old_db:" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Gray
    
    $oldDbQuery = @"
SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci';
USE old_db;
SELECT 'Stores' as Type, store_code, store_name FROM old_stores LIMIT 3;
SELECT 'Customers' as Type, phone, full_name FROM old_customers LIMIT 3;
SELECT 'Products' as Type, sku, product_name FROM old_products LIMIT 3;
"@
    
    $oldDbQuery | & $mysql.Path $mysql.Args
    
    Write-Host ""
    Write-Host "📊 Kiểm tra new_db:" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Gray
    
    $newDbQuery = @"
SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci';
USE new_db;
SELECT 'Stores' as Type, store_code, store_name FROM stores LIMIT 3;
SELECT 'Customers' as Type, phone, full_name FROM customers LIMIT 3;
SELECT 'Products' as Type, sku, product_name FROM products LIMIT 3;
"@
    
    $newDbQuery | & $mysql.Path $mysql.Args
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  HOÀN TẤT!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
}

function Invoke-ResetAndReload {
    $mysql = Initialize-MySQL -User $User -Password $Password -DbHost $DbHost -UseEnvFile:$UseEnvFile
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  RESET VÀ RELOAD DỮ LIỆU" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Bước 1: Truncate old_db
    Write-Host "Bước 1: Truncate old_db..." -ForegroundColor Yellow
    Get-Content sql\06_utility_truncate_old_db.sql -Raw -Encoding UTF8 | & $mysql.Path $mysql.Args
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Đã truncate old_db" -ForegroundColor Green
    } else {
        Write-Host "✗ Lỗi khi truncate old_db" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    
    # Bước 2: Insert lại fake data
    Write-Host "Bước 2: Insert fake data vào old_db..." -ForegroundColor Yellow
    Get-Content sql\03_insert_fake_data.sql -Raw -Encoding UTF8 | & $mysql.Path $mysql.Args
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Đã insert fake data vào old_db" -ForegroundColor Green
    } else {
        Write-Host "✗ Lỗi khi insert fake data" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    
    # Bước 3: Truncate new_db
    Write-Host "Bước 3: Truncate new_db..." -ForegroundColor Yellow
    Get-Content sql\05_utility_truncate.sql -Raw -Encoding UTF8 | & $mysql.Path $mysql.Args
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Đã truncate new_db" -ForegroundColor Green
    } else {
        Write-Host "✗ Lỗi khi truncate new_db" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  HOÀN TẤT!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Bây giờ bạn có thể:" -ForegroundColor Yellow
    Write-Host "1. Khởi động lại server: npm start" -ForegroundColor White
    Write-Host "2. Chạy ETL process từ web dashboard hoặc API" -ForegroundColor White
}

# ============================================================================
# Main Logic
# ============================================================================

# Nếu không có action, hiển thị menu
if ([string]::IsNullOrWhiteSpace($Action)) {
    Show-Menu
    $choice = Read-Host "Chọn chức năng (0-6)"
    
    switch ($choice) {
        "1" { Invoke-CheckData }
        "2" { Invoke-CheckNewDb }
        "3" { Invoke-CheckValidationErrors }
        "4" { Invoke-AnalyzeNullFields }
        "5" { Invoke-CheckEncoding }
        "6" { Invoke-ResetAndReload }
        "0" { Write-Host "Thoát." -ForegroundColor Gray; exit 0 }
        default { Write-Host "Lựa chọn không hợp lệ!" -ForegroundColor Red; exit 1 }
    }
} else {
    # Chạy action trực tiếp
    switch ($Action.ToLower()) {
        "check-data" { Invoke-CheckData }
        "check-new-db" { Invoke-CheckNewDb }
        "check-validation-errors" { Invoke-CheckValidationErrors }
        "analyze-null-fields" { Invoke-AnalyzeNullFields }
        "check-encoding" { Invoke-CheckEncoding }
        "reset-and-reload" { Invoke-ResetAndReload }
        default { 
            Write-Host "Action không hợp lệ: $Action" -ForegroundColor Red
            Write-Host "Các action hợp lệ: check-data, check-new-db, check-validation-errors, analyze-null-fields, check-encoding, reset-and-reload" -ForegroundColor Yellow
            exit 1
        }
    }
}

