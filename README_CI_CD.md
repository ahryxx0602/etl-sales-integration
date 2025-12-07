# CI/CD Pipeline Documentation

## 📋 Tổng Quan

Dự án sử dụng GitHub Actions để tự động chạy linting và các checks khác khi push code hoặc tạo pull request.

## 🔄 Workflows

### 1. CI/CD Pipeline (`ci.yml`)

Workflow chính chạy khi push hoặc PR:
- ✅ **Lint**: Kiểm tra code style
- ✅ **Build**: Kiểm tra build
- ✅ **Security**: Security audit

**Triggers:**
- Push to `main`, `master`, `develop`
- Pull requests to `main`, `master`, `develop`

### 2. Lint & Code Quality (`lint.yml`)

Workflow cho code quality:
- ✅ **ESLint**: Kiểm tra code style
- ✅ **Format Check**: Kiểm tra code formatting

**Triggers:**
- Push to `main`, `master`, `develop`
- Pull requests

### 3. Release (`release.yml`)

Workflow cho releases:
- ✅ **Lint**: Chạy linting trước khi release
- ✅ **Changelog**: Generate changelog từ git commits
- ✅ **Release**: Tạo GitHub release với changelog

**Triggers:**
- Push tags matching `v*.*.*` (e.g., `v1.0.0`)

**Triggers:**
- Push tags matching `v*.*.*` (e.g., `v1.0.0`)

## 🚀 Cách Sử Dụng

### Local Checks

Trước khi push, chạy lệnh sau:

```bash
# Run linter
npm run lint
```

### GitHub Actions

Workflows sẽ tự động chạy khi:
1. **Push code** lên branch `main`, `master`, hoặc `develop`
2. **Tạo Pull Request** vào các branch trên
3. **Push tag** với format `v*.*.*`

### Xem Kết Quả

1. Vào tab **Actions** trên GitHub repository
2. Chọn workflow run bạn muốn xem
3. Xem logs và kết quả của từng job

### Badge Status

Thêm badge vào README để hiển thị CI status:

```markdown
![CI](https://github.com/your-username/etl-rmq/workflows/CI/badge.svg)
```

## 🔒 Secrets

Các secrets cần thiết (nếu có):
- `CODECOV_TOKEN`: Codecov token (optional)

**Setup secrets:**
1. Vào repository Settings
2. Secrets and variables → Actions
3. New repository secret

## 🐛 Troubleshooting

### Linter errors

- Chạy `npm run lint` để xem errors
- Fix errors hoặc update ESLint config

## 📝 Best Practices

1. **Always run linter locally** trước khi push
2. **Fix linter errors** trước khi commit
3. **Write meaningful commit messages**
4. **Keep PRs small** và focused
5. **Review CI results** trước khi merge

## 🔗 Links

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [ESLint Documentation](https://eslint.org/)

