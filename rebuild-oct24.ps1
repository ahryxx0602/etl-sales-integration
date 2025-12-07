# Script tạo lại commit history sạch từ sau 1c4dbbe
Write-Host "=== Rebuilding Clean Commit History (After Oct 24 cleanup) ===" -ForegroundColor Green

# 1. CI/CD improvements
Write-Host "`n[1/5] Creating CI/CD improvements commit..." -ForegroundColor Yellow
git add .github/ eslint.config.js package-lock.json .gitignore
git commit -m "ci: improve CI/CD workflows and ESLint configuration" 2>&1 | Out-Null

# 2. README và documentation
Write-Host "[2/5] Creating README updates commit..." -ForegroundColor Yellow
git add README.md *.md
git commit -m "docs: update README with RabbitMQ setup and project progress" 2>&1 | Out-Null

# 3. Source code restructure và improvements
Write-Host "[3/5] Creating source code improvements commit..." -ForegroundColor Yellow
git add src/
git commit -m "refactor: improve workers, services, and add validation improvements" 2>&1 | Out-Null

# 4. SQL scripts và database
Write-Host "[4/5] Creating SQL scripts commit..." -ForegroundColor Yellow
git add sql/
git commit -m "feat: add SQL migration scripts and database setup" 2>&1 | Out-Null

# 5. Frontend và public assets
Write-Host "[5/5] Creating frontend commit..." -ForegroundColor Yellow
git add public/ views/ package.json
git commit -m "feat: add frontend views, public assets, and dashboard server" 2>&1 | Out-Null

# 6. Các thay đổi còn lại
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

