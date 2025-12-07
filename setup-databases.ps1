# Script PowerShell để setup toàn bộ databases
# Chạy script này để tạo tất cả databases và tables

param(
    [string]$User = "",
    [string]$Password = "",
    [string]$DbHost = "",
    [switch]$NoPassword = $false,  # Nếu MySQL không có password
    [switch]$UseEnvFile = $true    # Đọc từ .env file nếu có
)

$ErrorActionPreference = "Stop"

# Hàm đọc .env file
function Read-EnvFile {
    $envFile = ".env"
    if (Test-Path $envFile) {
        $envVars = @{}
        Get-Content $envFile | ForEach-Object {
            if ($_ -match '^\s*([^#][^=]*?)\s*=\s*(.*?)\s*$') {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim()
                # Loại bỏ dấu ngoặc kép nếu có
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

# Đọc từ .env file nếu được bật
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

# Set giá trị mặc định nếu vẫn trống
if ([string]::IsNullOrWhiteSpace($User)) {
    $User = "root"
}
if ([string]::IsNullOrWhiteSpace($DbHost)) {
    $DbHost = "localhost"
}

# Hàm tìm MySQL executable
function Find-MySQL {
    # Thử tìm trong PATH trước
    $mysqlInPath = Get-Command mysql -ErrorAction SilentlyContinue
    if ($mysqlInPath) {
        return $mysqlInPath.Path
    }
    
    # Tìm trong các đường dẫn thông thường của MySQL trên Windows
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
        if (Test-Path $path) {
            return $path
        }
    }
    
    # Tìm trong Program Files
    $programFiles = @("C:\Program Files", "C:\Program Files (x86)")
    foreach ($pf in $programFiles) {
        if (Test-Path $pf) {
            $mysqlDirs = Get-ChildItem -Path $pf -Filter "MySQL*" -Directory -ErrorAction SilentlyContinue
            foreach ($dir in $mysqlDirs) {
                $mysqlExe = Join-Path $dir.FullName "bin\mysql.exe"
                if (Test-Path $mysqlExe) {
                    return $mysqlExe
                }
            }
        }
    }
    
    return $null
}

# Tìm MySQL
$mysqlPath = Find-MySQL
if (-not $mysqlPath) {
    Write-Host "✗ Lỗi: Không tìm thấy MySQL!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Vui lòng:" -ForegroundColor Yellow
    Write-Host "1. Đảm bảo MySQL đã được cài đặt" -ForegroundColor White
    Write-Host "2. Thêm MySQL vào PATH, hoặc" -ForegroundColor White
    Write-Host "3. Chạy script với đường dẫn đầy đủ đến mysql.exe" -ForegroundColor White
    Write-Host ""
    Write-Host "Ví dụ: .\setup-databases.ps1 -MySQLPath 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe'" -ForegroundColor Cyan
    exit 1
}

Write-Host "✓ Tìm thấy MySQL tại: $mysqlPath" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SETUP DATABASES - ETL SALES SYSTEM" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Danh sách các file SQL cần chạy theo thứ tự (theo README.md)
# Bước 1: Tạo databases và tables (không có dữ liệu)
# Bước 2: Insert fake data với nhiều lỗi để test validation và transform
$sqlFilesRecommended = @(
    "sql\00_setup_all.sql",          # Bước 1: Tạo databases và tables
    "sql\03_insert_fake_data.sql"    # Bước 2: Insert fake data
)

# Hoặc chạy từng file riêng lẻ (nếu muốn)
$sqlFilesIndividual = @(
    "sql\01_create_old_db.sql",
    "sql\02_create_new_db.sql",
    "sql\03_insert_fake_data.sql",
    "sql\04_migrate_etl_logs.sql"
)

Write-Host "Chọn phương thức:" -ForegroundColor Yellow
Write-Host "1. Setup đầy đủ (00_setup_all.sql + 03_insert_fake_data.sql) - Khuyến nghị" -ForegroundColor White
Write-Host "2. Chạy từng file riêng lẻ" -ForegroundColor White
Write-Host ""
$choice = Read-Host "Nhập lựa chọn (1 hoặc 2, mặc định: 1)"

if ([string]::IsNullOrWhiteSpace($choice)) {
    $choice = "1"
}

$filesToRun = if ($choice -eq "2") { $sqlFilesIndividual } else { $sqlFilesRecommended }

foreach ($sqlFile in $filesToRun) {
    if (-not (Test-Path $sqlFile)) {
        Write-Host "⚠ Cảnh báo: File không tồn tại: $sqlFile" -ForegroundColor Yellow
        continue
    }
    
    Write-Host ""
    Write-Host "Đang chạy: $sqlFile" -ForegroundColor Green
    Write-Host "----------------------------------------" -ForegroundColor Gray
    
    try {
        # Xây dựng arguments cho MySQL
        $mysqlArgs = @("-u$User", "-h$DbHost")
        
        if ($NoPassword) {
            # MySQL không có password - không thêm -p
        } elseif ($Password) {
            # Có password, truyền trực tiếp (không an toàn nhưng tiện)
            $mysqlArgs += "-p$Password"
        } else {
            # Không truyền password, MySQL sẽ tự động hỏi (an toàn)
            $mysqlArgs += "-p"
        }
        
        # Chạy MySQL với arguments đúng cách
        Get-Content $sqlFile -Raw -Encoding UTF8 | & $mysqlPath $mysqlArgs
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Thành công: $sqlFile" -ForegroundColor Green
        } else {
            Write-Host "✗ Lỗi khi chạy: $sqlFile (Exit code: $LASTEXITCODE)" -ForegroundColor Red
            $continue = Read-Host "Tiếp tục với file tiếp theo? (y/n)"
            if ($continue -ne "y" -and $continue -ne "Y") {
                exit $LASTEXITCODE
            }
        }
    } catch {
        Write-Host "✗ Exception: $_" -ForegroundColor Red
        $continue = Read-Host "Tiếp tục với file tiếp theo? (y/n)"
        if ($continue -ne "y" -and $continue -ne "Y") {
            exit 1
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  HOÀN TẤT SETUP!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

