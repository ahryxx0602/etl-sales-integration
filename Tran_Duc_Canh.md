# Nhiệm vụ: Trần Đức Cảnh

## Module phụ trách: Transform

## Tổng quan
Bạn chịu trách nhiệm cho phần **Transform** của hệ thống ETL. Nhiệm vụ của bạn là chuẩn hóa và biến đổi dữ liệu đã được validate thành format chuẩn để load vào Data Warehouse. Transform được thực hiện cùng lúc với Validation trong method `validateAndTransform()` của `ProcessService`.

---

## Nhiệm vụ cụ thể

### 1. Transform Order Data (Method chính)
- **Method**: `TransformService.transformOrderData(rawData, sourceType)`
- **Chức năng**: Validate và transform dữ liệu order trong cùng một method
- **Input**: Raw data từ Extract (order_code, store_code, customer_phone, order_date, item_sku, item_name, qty, unit_price, currency, etc.)
- **Output**: Object `{ valid: boolean, data: transformedData, errors: [] }`
- **Flow**: Validate từng field → Transform nếu valid → Collect errors → Return result

**Files liên quan:**
- `src/services/TransformService.js` - Method `transformOrderData()`
- `src/services/etl/ProcessService.js` - Method `validateAndTransform()` gọi TransformService

### 2. Chuẩn hóa Format Ngày/Thời gian
- **Parse date/time**: Chuyển đổi các format ngày khác nhau thành format chuẩn MySQL datetime
- **Format chuẩn**: `YYYY-MM-DD HH:mm:ss` (MySQL datetime format)
- **Hỗ trợ formats**: 
  - `YYYY-MM-DD HH:mm:ss` (chuẩn)
  - `YYYY-MM-DD` (thêm `00:00:00`)
  - `DD/MM/YYYY` hoặc `DD/MM/YYYY HH:mm:ss`
  - `DD-MM-YYYY` hoặc `DD-MM-YYYY HH:mm:ss`
  - `YYYY/MM/DD` hoặc `YYYY/MM/DD HH:mm:ss`
  - ISO format (default Date parsing)
- **Validation**: Sử dụng `OrderValidationService.validateDateTime()` để validate và transform

**Files liên quan:**
- `src/services/TransformService.js` - Method `transformOrderData()`, xử lý `order_date` → `order_datetime`
- `src/services/validation/OrderValidationService.js` - Method `validateDateTime()` (parse và format)

### 3. Chuẩn hóa Format Tiền tệ
- **Currency normalization**: Chuẩn hóa currency code thành uppercase (VND, USD, etc.)
- **Price formatting**: 
  - Loại bỏ dấu phẩy (`,`) trong giá trị
  - Convert sang number
  - Làm tròn về số nguyên (Math.round)
- **Default currency**: Set default currency là 'VND' nếu không có
- **Validation**: Sử dụng `ProductValidationService.validatePrice()` để validate và transform

**Files liên quan:**
- `src/services/TransformService.js` - Method `transformOrderData()`, xử lý `currency` và `unit_price`
- `src/services/validation/ProductValidationService.js` - Method `validatePrice()` (loại bỏ dấu phẩy, convert number)

### 4. Chuẩn hóa SKU
- **SKU normalization**: 
  - Trim whitespace
  - Convert sang uppercase
  - Validate độ dài 1-20 ký tự
- **Validation**: Sử dụng `ProductValidationService.validateSku()`

**Files liên quan:**
- `src/services/TransformService.js` - Method `transformOrderData()`, xử lý `item_sku`
- `src/services/validation/ProductValidationService.js` - Method `validateSku()`

### 5. Chuẩn hóa Tên sản phẩm
- **Product name normalization**: 
  - Sửa dấu tiếng Việt cho tên sản phẩm (sử dụng `fixProductName()`)
  - Trim whitespace
  - Validate độ dài ≤ 255 ký tự
- **Mapping**: Tự động sửa các lỗi chính tả phổ biến (Bluetoth → Bluetooth, logtech → Logitech, etc.)
- **Validation**: Sử dụng `ProductValidationService.validateProductName()`

**Files liên quan:**
- `src/services/TransformService.js` - Methods `normalizeProductName()`, `transformOrderData()`
- `src/utils/vietnameseUtils.js` - Function `fixProductName()` để sửa dấu tiếng Việt và lỗi chính tả

### 6. Chuẩn hóa Tên người và Category
- **Customer/Store name normalization**: 
  - Thêm dấu tiếng Việt cho tên khách hàng và cửa hàng
  - Sử dụng `addVietnameseAccentsToName()` để tự động thêm dấu
- **Category normalization**: 
  - Thêm dấu tiếng Việt cho category
  - Sử dụng `addVietnameseAccentsToName()`

**Files liên quan:**
- `src/services/TransformService.js` - Method `transformOrderData()`, xử lý `store_name`, `customer_name`, `category`
- `src/utils/vietnameseUtils.js` - Function `addVietnameseAccentsToName()` để thêm dấu tiếng Việt

### 7. Chuẩn hóa Quantity
- **Quantity normalization**: 
  - Convert string sang number (parseInt)
  - Validate phải là số nguyên dương (> 0)
- **Validation**: Sử dụng `ProductValidationService.validateQty()`

**Files liên quan:**
- `src/services/TransformService.js` - Method `transformOrderData()`, xử lý `qty`
- `src/services/validation/ProductValidationService.js` - Method `validateQty()`

### 8. Chuẩn hóa Order Code và Store Code
- **Order code normalization**: 
  - Trim whitespace
  - Validate độ dài 1-50 ký tự
- **Store code normalization**: 
  - Trim whitespace
  - Validate độ dài 1-10 ký tự

**Files liên quan:**
- `src/services/TransformService.js` - Method `transformOrderData()`, xử lý `order_code`, `store_code`
- `src/services/validation/OrderValidationService.js` - Method `validateOrderCode()`
- `src/services/validation/StoreValidationService.js` - Method `validateStoreCode()`

---

## Các file cần đọc và hiểu

### Main Transform Service
1. **`src/services/TransformService.js`**
   - `transformOrderData(rawData, sourceType)` - Method chính transform dữ liệu order
   - `normalizeProductName(productName)` - Chuẩn hóa tên sản phẩm (hiện tại ít dùng, chủ yếu dùng `fixProductName()`)
   - Xử lý: order_code, store_code, customer_phone, order_date → order_datetime, item_sku, item_name, qty, unit_price, currency, category, store_name, customer_name, customer_email, product_name

### Utility Functions
2. **`src/utils/vietnameseUtils.js`**
   - `fixProductName(productName)` - Sửa dấu tiếng Việt và lỗi chính tả cho tên sản phẩm
   - `addVietnameseAccentsToName(name)` - Thêm dấu tiếng Việt cho tên (customer, store, category)

### Validation Service (Integration)
3. **`src/services/ValidationService.js`**
   - Facade pattern để orchestrate các validation services
   - Methods: `validateOrderCode()`, `validateStoreCode()`, `validatePhone()`, `validateDateTime()`, `validateSku()`, `validateQty()`, `validatePrice()`, `validateProductName()`

### Sub Validation Services
4. **`src/services/validation/OrderValidationService.js`**
   - `validateOrderCode()` - Validate và trim order code
   - `validateDateTime()` - Parse nhiều format date và chuẩn hóa về MySQL datetime format

5. **`src/services/validation/ProductValidationService.js`**
   - `validateSku()` - Validate và uppercase SKU
   - `validateQty()` - Validate và convert sang number
   - `validatePrice()` - Validate, loại bỏ dấu phẩy, convert sang number, làm tròn
   - `validateProductName()` - Validate độ dài

6. **`src/services/validation/CustomerValidationService.js`**
   - `validatePhone()` - Validate format phone (10-11 chữ số)
   - `validateEmail()` - Validate email format và lowercase

7. **`src/services/validation/StoreValidationService.js`**
   - `validateStoreCode()` - Validate store code (1-10 ký tự)

### ETL Service (Integration)
8. **`src/services/etl/ProcessService.js`**
   - `validateAndTransform(rawData)` - Orchestrate validation và transform
   - Gọi `transformService.transformOrderData()` cho từng record
   - TransformService sử dụng Joi schema và ValidationService để validate
   - Collect valid và invalid records
   - Publish message vào RabbitMQ sau khi transform

9. **`src/schemas/orderSchema.js`**
   - Joi schema với custom extension để validate date với nhiều format
   - Validate tất cả các trường của order data

---

## Transform Rules

### Date/Time Transformation
- **Input formats**: 
  - `YYYY-MM-DD HH:mm:ss` (chuẩn)
  - `YYYY-MM-DD` (thêm `00:00:00`)
  - `DD/MM/YYYY` hoặc `DD/MM/YYYY HH:mm:ss`
  - `DD-MM-YYYY` hoặc `DD-MM-YYYY HH:mm:ss`
  - `YYYY/MM/DD` hoặc `YYYY/MM/DD HH:mm:ss`
  - ISO format (default Date parsing)
- **Output format**: `YYYY-MM-DD HH:mm:ss` (MySQL datetime format)
- **Default time**: `00:00:00` nếu chỉ có date không có time

### Currency Transformation
- **Input**: `vnd`, `VND`, `usd`, `USD`, etc. (có thể có dấu phẩy trong giá trị)
- **Output**: `VND`, `USD` (uppercase)
- **Default**: `VND`

### Price Transformation
- **Input**: String có thể chứa dấu phẩy (`,`) như `"15,000,000"` hoặc `"15.000.000"`
- **Process**: Loại bỏ dấu phẩy → Convert sang number → Làm tròn về số nguyên
- **Output**: Number (integer)

### SKU Transformation
- **Input**: String (có thể lowercase hoặc mixed case)
- **Output**: Uppercase, trimmed

### Product Name Normalization
- **Input**: Tên sản phẩm có thể thiếu dấu, sai chính tả
- **Process**: 
  - Sửa lỗi chính tả (Bluetoth → Bluetooth, logtech → Logitech, etc.)
  - Chuẩn hóa đơn vị (GB, W, MHz, etc.)
  - Sửa dấu tiếng Việt
  - Viết hoa chữ cái đầu
- **Output**: Tên sản phẩm đã được chuẩn hóa

### Name Normalization (Customer, Store, Category)
- **Input**: Tên có thể thiếu dấu tiếng Việt (Nguyen Van → Nguyễn Văn)
- **Process**: Sử dụng `addVietnameseAccentsToName()` để tự động thêm dấu
- **Output**: Tên đã có dấu tiếng Việt

### Quantity Transformation
- **Input**: String hoặc number (có thể là `"one"`, `"2.5"`, etc.)
- **Process**: Convert sang number (parseInt) → Validate phải là số nguyên dương
- **Output**: Number (integer > 0)

---

## Luồng xử lý

### Transform Flow
```
Raw Data (from Extract)
    ↓
ProcessService.validateAndTransform()
    ↓
For each record:
    TransformService.transformOrderData(row)
        ↓
        ├─ Validate order_code → transform
        ├─ Validate store_code → transform
        ├─ Validate customer_phone → transform (có thể null)
        ├─ Validate order_date → parse & format → order_datetime
        ├─ Validate item_sku → uppercase
        ├─ Validate item_name → fixProductName() (sửa dấu tiếng Việt)
        ├─ Validate qty → convert number
        ├─ Validate unit_price → remove comma, convert number, round
        ├─ Normalize currency → uppercase, default VND
        ├─ Normalize store_name → addVietnameseAccentsToName()
        ├─ Normalize customer_name → addVietnameseAccentsToName()
        ├─ Normalize customer_email → trim, lowercase (nếu có)
        ├─ Normalize product_name → fixProductName()
        ├─ Normalize category → addVietnameseAccentsToName()
        └─ Collect errors
        ↓
    Return { valid, data, errors }
    ↓
Separate valid và invalid records
    ↓
Return { valid: [...], invalid: [...] }
    ↓
Publish message → RabbitMQ (transform.data)
```

### Transform Process (Chi tiết)
```
For each validated record:
    1. Validate & transform order_code (trim, validate length)
    2. Validate & transform store_code (trim, validate length)
    3. Validate & transform customer_phone (validate format, có thể null)
    4. Validate & transform order_date → order_datetime (parse nhiều format, format MySQL)
    5. Validate & transform item_sku (trim, uppercase)
    6. Validate & transform item_name/product_name (fixProductName - sửa dấu tiếng Việt)
    7. Validate & transform qty (parseInt, validate > 0)
    8. Validate & transform unit_price (remove comma, parseFloat, round)
    9. Normalize currency (uppercase, default VND)
    10. Normalize store_name (addVietnameseAccentsToName - nếu có)
    11. Normalize customer_name (addVietnameseAccentsToName - nếu có)
    12. Normalize customer_email (trim, lowercase - nếu có)
    13. Normalize product_name (fixProductName - nếu có)
    14. Normalize category (addVietnameseAccentsToName - nếu có)
    15. Collect all errors
    16. Return { valid: errors.length === 0, data: transformed, errors }
```

---

## Lưu ý quan trọng

1. **Validation và Transform cùng lúc**: TransformService sử dụng ValidationService để validate trước khi transform. Nếu validation fail, field đó không được transform và error được collect.

2. **Vietnamese Text**: Quan trọng nhất là xử lý đúng dấu tiếng Việt cho tên sản phẩm, tên người, category sử dụng các utility functions từ `vietnameseUtils.js`.

3. **Data Type**: Đảm bảo các giá trị số (qty, price) được convert đúng sang number sau khi loại bỏ dấu phẩy.

4. **Null Handling**: 
   - `customer_phone`, `customer_email` có thể null (optional)
   - `store_name`, `customer_name`, `category` có thể null (optional)
   - Các trường optional được giữ lại trong transformed data (kể cả null)

5. **Error Collection**: Collect tất cả errors trong một record, không dừng ở lỗi đầu tiên. Return `{ valid: false, data: partial, errors: [...] }` nếu có lỗi.

6. **Idempotency**: Transform nên là idempotent (chạy nhiều lần cho cùng input sẽ cho cùng output).

7. **Price Rounding**: Giá được làm tròn về số nguyên (Math.round) để tránh lỗi floating point.

8. **Date Parsing**: Hỗ trợ nhiều format date khác nhau và tự động parse, sau đó format về MySQL datetime format.

---

## Tiến độ
✅ Hoàn thành - Đã transform thành công với đầy đủ các tính năng chuẩn hóa
