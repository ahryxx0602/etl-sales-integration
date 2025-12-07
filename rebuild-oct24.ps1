# Script tạo lại commit history sạch từ sau 1c4dbbe
Write-Host "=== Rebuilding Clean Commit History (After Oct 24 cleanup) ===" -ForegroundColor Green

# 1. CI/CD improvements
Write-Host "`n[1/6] Creating CI/CD improvements commit..." -ForegroundColor Yellow
git add .github/ eslint.config.js package-lock.json .gitignore
git commit -m "ci: improve CI/CD workflows and ESLint configuration" 2>&1 | Out-Null

# 2. README updates
Write-Host "[2/6] Creating README updates commit..." -ForegroundColor Yellow
git add README.md *.md
git commit -m "docs: update README with RabbitMQ setup and project progress" 2>&1 | Out-Null

# 3. Worker improvements (loadWorker, transformWorker)
Write-Host "[3/6] Creating worker improvements commit..." -ForegroundColor Yellow
git add src/workers/ src/services/
git commit -m "refactor: improve loadWorker and transformWorker with better date parsing and DW pool integration" 2>&1 | Out-Null

# 4. Validation improvements
Write-Host "[4/6] Creating validation improvements commit..." -ForegroundColor Yellow
git add src/services/validation/
git commit -m "feat: add item_name validation and improve validation services" 2>&1 | Out-Null

# 5. Deploy and PM2 improvements
Write-Host "[5/6] Creating deploy improvements commit..." -ForegroundColor Yellow
git add .github/workflows/deploy.yml package.json
git commit -m "refactor(deploy): streamline workflow defaults and improve PM2 commands" 2>&1 | Out-Null

# 6. Log/Monitor feature
Write-Host "[6/6] Creating Log/Monitor feature commit..." -ForegroundColor Yellow
git add src/ src/dashboard/ sql/
git commit -m "feat: add ETL logging to MySQL and create dashboard server" 2>&1 | Out-Null

# 7. Các thay đổi còn lại
Write-Host "`nChecking for remaining changes..." -ForegroundColor Yellow
$remaining = git status --short
if ($remaining) {
    Write-Host "Found remaining changes, creating final commit..." -ForegroundColor Cyan
    git add -A
    git commit -m "chore: finalize project structure and cleanup" 2>&1 | Out-Null
} else {
    Write-Host "No remaining changes." -ForegroundColor Green
}

Write-Host "`n=== Rebuild Complete ===" -ForegroundColor Green
Write-Host "Review commits: git log --oneline -10" -ForegroundColor Cyan
Write-Host "Force push: git push origin main --force" -ForegroundColor Yellow

