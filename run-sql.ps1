# Script PowerShell để chạy các file SQL trong MySQL
# Sử dụng: .\run-sql.ps1 <file-sql>
# Ví dụ: .\run-sql.ps1 sql\00_setup_all.sql

param(
    [Parameter(Mandatory=$true)]
    [string]$SqlFile,
    
    [string]$User = "",
    [string]$Password = "",
    [string]$DbHost = "",
    [string]$MySQLPath = "",
    [switch]$NoPassword = $false,  # Nếu MySQL không có password
    [switch]$UseEnvFile = $true     # Đọc từ .env file nếu có
)

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
if ($MySQLPath -and (Test-Path $MySQLPath)) {
    $mysqlPath = $MySQLPath
} else {
    $mysqlPath = Find-MySQL
}

if (-not $mysqlPath) {
    Write-Host "✗ Lỗi: Không tìm thấy MySQL!" -ForegroundColor Red
    Write-Host "Vui lòng chỉ định đường dẫn MySQL với tham số -MySQLPath" -ForegroundColor Yellow
    exit 1
}

# Kiểm tra file có tồn tại không
if (-not (Test-Path $SqlFile)) {
    Write-Host "Lỗi: File không tồn tại: $SqlFile" -ForegroundColor Red
    exit 1
}

# Xây dựng lệnh MySQL
$mysqlCmd = $mysqlPath

# Thêm thông tin kết nối
if ($Password) {
    $mysqlCmd += " -u$User -p$Password"
} else {
    $mysqlCmd += " -u$User -p"
}

$mysqlCmd += " -h$DbHost"

Write-Host "Đang chạy file SQL: $SqlFile" -ForegroundColor Green
Write-Host "MySQL: $mysqlPath" -ForegroundColor Yellow

# Đọc nội dung file và pipe vào MySQL
try {
    # Xây dựng arguments cho MySQL
    $mysqlArgs = @("-u$User", "-h$DbHost")
    
    if ($NoPassword) {
        # MySQL không có password - không thêm -p
    } elseif ($Password) {
        # Có password, truyền trực tiếp
        $mysqlArgs += "-p$Password"
    } else {
        # Không truyền password, MySQL sẽ tự động hỏi
        $mysqlArgs += "-p"
    }
    
    # Chạy MySQL với arguments đúng cách
    Get-Content $SqlFile -Raw -Encoding UTF8 | & $mysqlPath $mysqlArgs
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Thành công!" -ForegroundColor Green
    } else {
        Write-Host "✗ Có lỗi xảy ra (Exit code: $LASTEXITCODE)" -ForegroundColor Red
        exit $LASTEXITCODE
    }
} catch {
    Write-Host "Lỗi khi chạy MySQL: $_" -ForegroundColor Red
    exit 1
}

