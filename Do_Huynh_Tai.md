# Nhiệm vụ: Đỗ Huỳnh Tài

## Module phụ trách: Validate

## Tổng quan
Bạn chịu trách nhiệm cho phần **Validation** của hệ thống ETL. Nhiệm vụ của bạn là kiểm tra tính hợp lệ của dữ liệu trước khi chuyển sang bước Transform. Validation được thực hiện cùng lúc với Transform trong method `validateAndTransform()` của `ProcessService`. Dữ liệu hợp lệ sẽ được forward sang Load, còn dữ liệu không hợp lệ sẽ được log vào `etl_logs` với status `validation_error`.

---

## Nhiệm vụ cụ thể

### 1. Kiểm tra Schema và Format

#### 1.1. Validate Order Code
- **Method**: `OrderValidationService.validateOrderCode(orderCode)`
- **Rules**:
  - Không được null hoặc undefined
  - Phải là string
  - Độ dài: 1-50 ký tự (sau khi trim)
- **Output**: `{ valid: boolean, value: string, error?: string }`

**Files liên quan:**
- `src/services/validation/OrderValidationService.js` - Method `validateOrderCode()`
- `src/services/ValidationService.js` - Facade method `validateOrderCode()`

#### 1.2. Validate Store Code
- **Method**: `StoreValidationService.validateStoreCode(storeCode)`
- **Rules**:
  - Không được null hoặc undefined
  - Phải là string
  - Độ dài: 1-10 ký tự (sau khi trim)
- **Output**: `{ valid: boolean, value: string, error?: string }`

**Files liên quan:**
- `src/services/validation/StoreValidationService.js` - Method `validateStoreCode()`
- `src/services/ValidationService.js` - Facade method `validateStoreCode()`

#### 1.3. Validate SKU
- **Method**: `ProductValidationService.validateSku(sku)`
- **Rules**:
  - Không được null hoặc undefined
  - Phải là string
  - Độ dài: 1-20 ký tự (sau khi trim)
- **Transform**: Uppercase sau khi validate
- **Output**: `{ valid: boolean, value: string (uppercase), error?: string }`

**Files liên quan:**
- `src/services/validation/ProductValidationService.js` - Method `validateSku()`
- `src/services/ValidationService.js` - Facade method `validateSku()`

### 2. Kiểm tra Email hợp lệ
- **Method**: `CustomerValidationService.validateEmail(email)`
- **Rules**:
  - Có thể null hoặc empty (optional field)
  - Nếu có giá trị: Phải match regex pattern `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **Transform**: Lowercase sau khi validate
- **Output**: `{ valid: boolean, value: string (lowercase) | null, error?: string }`

**Files liên quan:**
- `src/services/validation/CustomerValidationService.js` - Method `validateEmail()`
- `src/services/ValidationService.js` - Facade method `validateEmail()`

### 3. Kiểm tra Phone hợp lệ
- **Method**: `CustomerValidationService.validatePhone(phone)`
- **Rules**:
  - Có thể null hoặc empty (optional field)
  - Nếu có giá trị: Phải match regex pattern `/^[0-9]{10,11}$/` (10-11 chữ số)
- **Output**: `{ valid: boolean, value: string | null, error?: string }`

**Files liên quan:**
- `src/services/validation/CustomerValidationService.js` - Method `validatePhone()`
- `src/services/ValidationService.js` - Facade method `validatePhone()`

### 4. Kiểm tra Số lượng và Giá trị hợp lệ

#### 4.1. Validate Quantity
- **Method**: `ProductValidationService.validateQty(qty)`
- **Rules**:
  - Không được null hoặc undefined
  - Phải convert được sang số nguyên (parseInt)
  - Phải lớn hơn 0
- **Transform**: Convert sang number (parseInt)
- **Output**: `{ valid: boolean, value: number, error?: string }`

**Files liên quan:**
- `src/services/validation/ProductValidationService.js` - Method `validateQty()`
- `src/services/ValidationService.js` - Facade method `validateQty()`

#### 4.2. Validate Price
- **Method**: `ProductValidationService.validatePrice(price)`
- **Rules**:
  - Không được null hoặc undefined
  - Phải convert được sang số (parseFloat)
  - Loại bỏ dấu phẩy (`,`) trước khi parse
  - Phải lớn hơn 0
- **Transform**: 
  - Loại bỏ dấu phẩy
  - Convert sang number (parseFloat)
  - Làm tròn về số nguyên (Math.round)
- **Output**: `{ valid: boolean, value: number (integer), error?: string }`

**Files liên quan:**
- `src/services/validation/ProductValidationService.js` - Method `validatePrice()`
- `src/services/ValidationService.js` - Facade method `validatePrice()`

### 5. Kiểm tra Date/DateTime hợp lệ
- **Method**: `OrderValidationService.validateDateTime(dateTimeStr)`
- **Rules**:
  - Không được null hoặc undefined
  - Phải parse được thành Date object
  - Hỗ trợ nhiều formats:
    - `YYYY-MM-DD HH:mm:ss` (chuẩn)
    - `YYYY-MM-DD` (thêm `00:00:00`)
    - `DD/MM/YYYY` hoặc `DD/MM/YYYY HH:mm:ss`
    - `DD-MM-YYYY` hoặc `DD-MM-YYYY HH:mm:ss`
    - `YYYY/MM/DD` hoặc `YYYY/MM/DD HH:mm:ss`
    - ISO format (default Date parsing)
- **Transform**: Format về MySQL datetime format `YYYY-MM-DD HH:mm:ss`
- **Output**: `{ valid: boolean, value: string (MySQL datetime format), error?: string }`

**Files liên quan:**
- `src/services/validation/OrderValidationService.js` - Method `validateDateTime()`
- `src/services/ValidationService.js` - Facade method `validateDateTime()`

### 6. Kiểm tra Product Name hợp lệ
- **Method**: `ProductValidationService.validateProductName(productName)`
- **Rules**:
  - Có thể null hoặc empty (optional field)
  - Nếu có giá trị: Độ dài ≤ 255 ký tự
- **Output**: `{ valid: boolean, value: string | null, error?: string }`

**Files liên quan:**
- `src/services/validation/ProductValidationService.js` - Method `validateProductName()`
- `src/services/ValidationService.js` - Facade method `validateProductName()`

### 7. Error Collection và Logging
- **Error Collection**: Collect tất cả errors trong một record, không dừng ở lỗi đầu tiên
- **Invalid Data Handling**: 
  - Dữ liệu không hợp lệ được collect vào mảng `invalid`
  - Mỗi invalid record có format: `{ raw_data: {...}, errors: [{ field, error }, ...] }`
- **Logging**: 
  - Log validation errors vào `etl_logs` với status `validation_error`
  - Message: Tổng hợp tất cả errors (field: error; field: error)
  - Error details: JSON chứa errors và raw_data

**Files liên quan:**
- `src/services/etl/ProcessService.js` - Method `validateAndTransform()` collect errors
- `src/services/etl/LoadService.js` - Method `logValidationErrors()` log vào database
- `src/models/NewDbModel.js` - Method `insertLog()` insert vào etl_logs

---

## Các file cần đọc và hiểu

### Main Validation Service
1. **`src/services/ValidationService.js`**
   - Facade pattern để orchestrate các validation services
   - Methods: 
     - `validateStoreCode(storeCode)`
     - `validatePhone(phone)`
     - `validateEmail(email)`
     - `validateSku(sku)`
     - `validateQty(qty)`
     - `validatePrice(price)`
     - `validateOrderCode(orderCode)`
     - `validateDateTime(dateTimeStr)`
     - `validateProductName(productName)`

### Sub Validation Services
2. **`src/services/validation/OrderValidationService.js`**
   - `validateOrderCode(orderCode)` - Validate order code (1-50 ký tự)
   - `validateDateTime(dateTimeStr)` - Parse nhiều format date và format về MySQL datetime

3. **`src/services/validation/StoreValidationService.js`**
   - `validateStoreCode(storeCode)` - Validate store code (1-10 ký tự)

4. **`src/services/validation/ProductValidationService.js`**
   - `validateSku(sku)` - Validate SKU (1-20 ký tự, uppercase)
   - `validateQty(qty)` - Validate quantity (số nguyên dương)
   - `validatePrice(price)` - Validate price (loại bỏ dấu phẩy, số dương, làm tròn)
   - `validateProductName(productName)` - Validate product name (≤ 255 ký tự)

5. **`src/services/validation/CustomerValidationService.js`**
   - `validatePhone(phone)` - Validate phone (10-11 chữ số, optional)
   - `validateEmail(email)` - Validate email format (regex, optional, lowercase)

### ETL Service (Integration)
6. **`src/services/etl/ProcessService.js`**
   - `validateAndTransform(rawData)` - Orchestrate validation và transform
   - Gọi `transformService.transformOrderData()` cho từng record
   - TransformService sử dụng Joi schema và ValidationService để validate
   - Collect valid và invalid records
   - Publish message vào RabbitMQ sau khi transform

7. **`src/services/TransformService.js`**
   - `transformOrderData(rawData, sourceType)` - Validate và transform cùng lúc
   - Sử dụng Joi schema (`orderSchema`) để validate toàn bộ cấu trúc trước
   - Sau đó sử dụng ValidationService để validate từng field chi tiết
   - Collect errors nếu validation fail
   - Return `{ valid: boolean, data: transformed, errors: [] }`

8. **`src/schemas/orderSchema.js`**
   - Joi schema với custom extension để validate date với nhiều format
   - Validate tất cả các trường của order data

### Supporting Files
8. **`src/services/etl/LoadService.js`**
   - `logValidationErrors(invalidData)` - Log validation errors vào database

9. **`src/models/NewDbModel.js`**
   - `insertLog(...)` - Insert log vào `etl_logs` table

---

## Validation Rules

### Order Code
- **Required**: Yes
- **Type**: String
- **Length**: 1-50 ký tự (sau khi trim)
- **Error message**: "Order code is required" hoặc "Order code must be 1-50 characters"

### Store Code
- **Required**: Yes
- **Type**: String
- **Length**: 1-10 ký tự (sau khi trim)
- **Error message**: "Store code is required" hoặc "Store code must be 1-10 characters"

### Phone
- **Required**: No (optional)
- **Type**: String
- **Format**: 10-11 chữ số (regex: `/^[0-9]{10,11}$/`)
- **Error message**: "Phone must be 10-11 digits" (chỉ khi có giá trị)

### Email
- **Required**: No (optional)
- **Type**: String
- **Format**: Email hợp lệ (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- **Transform**: Lowercase sau khi validate
- **Error message**: "Invalid email format" (chỉ khi có giá trị)

### SKU
- **Required**: Yes
- **Type**: String
- **Length**: 1-20 ký tự (sau khi trim)
- **Transform**: Uppercase sau khi validate
- **Error message**: "SKU is required" hoặc "SKU must be 1-20 characters"

### Quantity
- **Required**: Yes
- **Type**: Number (integer)
- **Range**: > 0
- **Transform**: Convert string sang number (parseInt)
- **Error message**: "Quantity is required" hoặc "Quantity must be a positive integer"

### Price
- **Required**: Yes
- **Type**: Number (integer)
- **Range**: > 0
- **Transform**: 
  - Loại bỏ dấu phẩy (`,`)
  - Convert string sang number (parseFloat)
  - Làm tròn về số nguyên (Math.round)
- **Error message**: "Price is required" hoặc "Price must be a positive number"

### Date/DateTime
- **Required**: Yes
- **Type**: String (MySQL datetime format)
- **Formats supported**:
  - `YYYY-MM-DD HH:mm:ss`
  - `YYYY-MM-DD` (thêm `00:00:00`)
  - `DD/MM/YYYY` hoặc `DD/MM/YYYY HH:mm:ss`
  - `DD-MM-YYYY` hoặc `DD-MM-YYYY HH:mm:ss`
  - `YYYY/MM/DD` hoặc `YYYY/MM/DD HH:mm:ss`
  - ISO format
- **Transform**: Format về `YYYY-MM-DD HH:mm:ss`
- **Error message**: "Order date is required" hoặc "Invalid date format: {value}"

### Product Name
- **Required**: No (optional)
- **Type**: String
- **Length**: ≤ 255 ký tự
- **Error message**: "Product name too long (max 255 characters)" (chỉ khi có giá trị và > 255)

---

## Luồng xử lý

### Validation Flow
```
Raw Data (from Extract)
    ↓
ProcessService.validateAndTransform(rawData)
    ↓
For each record:
    TransformService.transformOrderData(row)
        ↓
        ├─ Validate order_code
        ├─ Validate store_code
        ├─ Validate customer_phone (optional)
        ├─ Validate customer_email (optional)
        ├─ Validate order_date → order_datetime
        ├─ Validate item_sku
        ├─ Validate item_name/product_name (optional)
        ├─ Validate qty
        ├─ Validate unit_price
        └─ Collect all errors
        ↓
    Return { valid: boolean, data: transformed, errors: [] }
    ↓
Separate valid và invalid records
    ↓
    ├─ Valid → Forward to Load
    └─ Invalid → Log to etl_logs (status: validation_error)
    ↓
Publish message → RabbitMQ (transform.data)
```

### Validation Process (Chi tiết)
```
For each record:
    1. Validate order_code
       - Check null/undefined
       - Check type (string)
       - Check length (1-50)
       - Trim
       - If invalid → Add error
    
    2. Validate store_code
       - Check null/undefined
       - Check type (string)
       - Check length (1-10)
       - Trim
       - If invalid → Add error
    
    3. Validate customer_phone (optional)
       - If null/empty → Valid (null)
       - If has value → Check regex (10-11 digits)
       - If invalid → Add error
    
    4. Validate customer_email (optional)
       - If null/empty → Valid (null)
       - If has value → Check regex (email format)
       - Lowercase
       - If invalid → Add error
    
    5. Validate order_date
       - Check null/undefined
       - Try parse nhiều formats
       - Format về MySQL datetime
       - If invalid → Add error
    
    6. Validate item_sku
       - Check null/undefined
       - Check type (string)
       - Check length (1-20)
       - Trim, uppercase
       - If invalid → Add error
    
    7. Validate item_name/product_name (optional)
       - If null/empty → Valid (null)
       - If has value → Check length (≤ 255)
       - If invalid → Add error
    
    8. Validate qty
       - Check null/undefined
       - ParseInt
       - Check > 0
       - If invalid → Add error
    
    9. Validate unit_price
       - Check null/undefined
       - Remove comma
       - ParseFloat
       - Check > 0
       - Round to integer
       - If invalid → Add error
    
    10. Collect all errors
    11. If errors.length > 0 → Invalid
    12. Else → Valid
```

---

## Lưu ý quan trọng

1. **Validation và Transform cùng lúc**: 
   - TransformService sử dụng ValidationService để validate trước khi transform
   - Nếu validation fail, field đó không được transform và error được collect
   - Validation và transform được thực hiện trong cùng một method `transformOrderData()`

2. **Error Collection**: 
   - Collect tất cả errors trong một record, không dừng ở lỗi đầu tiên
   - Mỗi error có format: `{ field: string, error: string }`
   - Return `{ valid: false, data: partial, errors: [...] }` nếu có lỗi

3. **Optional Fields**: 
   - `customer_phone`, `customer_email`, `product_name` là optional
   - Nếu null/empty → Valid (return null)
   - Chỉ validate format nếu có giá trị

4. **Data Type Conversion**: 
   - Convert kiểu dữ liệu trước khi validate (string → number cho qty, price)
   - Loại bỏ dấu phẩy trong price trước khi parse

5. **Date Parsing**: 
   - Hỗ trợ nhiều format date khác nhau
   - Tự động parse và format về MySQL datetime format
   - Nếu không parse được → Invalid

6. **Transform trong Validation**: 
   - Một số validation methods cũng transform giá trị (uppercase SKU, lowercase email, format date)
   - Transform được thực hiện sau khi validate thành công

7. **Performance**: 
   - Validation nên nhanh, không block quá lâu
   - Sử dụng regex patterns hiệu quả

8. **Error Messages**: 
   - Cung cấp error messages rõ ràng, dễ hiểu
   - Include giá trị invalid trong error message (nếu có)

---

## Tiến độ
✅ Hoàn thành - Validation hoạt động đúng với đầy đủ các rules
