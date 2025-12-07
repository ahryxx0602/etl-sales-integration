-- =========================
-- INSERT FAKE DATA VÀO old_db
-- =========================
-- File này chứa nhiều dữ liệu fake với các lỗi để test validation và transform
-- Bao gồm: sai chính tả, định dạng tiền tệ sai, định dạng ngày tháng sai, số lượng sai

USE old_db;

-- =========================
-- 1. INSERT STORES (15 cửa hàng)
-- =========================
INSERT INTO old_stores (store_code, store_name, address) VALUES
-- Tên đúng
('ST001', 'Cửa hàng Hà Nội', '123 Đường Trần Hưng Đạo, Quận Hoàn Kiếm, Hà Nội'),
('ST002', 'Cửa hàng Hồ Chí Minh', '456 Đường Nguyễn Huệ, Quận 1, TP.HCM'),
('ST003', 'Cửa hàng Đà Nẵng', '789 Đường Bạch Đằng, Quận Hải Châu, Đà Nẵng'),
('ST004', 'Cửa hàng Cần Thơ', '321 Đường Nguyễn Văn Cừ, Quận Ninh Kiều, Cần Thơ'),
('ST005', 'Cửa hàng Hải Phòng', '654 Đường Lạch Tray, Quận Ngô Quyền, Hải Phòng'),
-- Tên sai chính tả: thiếu dấu
('ST006', 'Cua hang Sai Gon', '789 Le Loi, Quan 1, Sai Gon'),  -- "Cua hang", "Sai Gon", "Le Loi", "Quan"
('ST007', 'Cua hang Da Nang', '123 Tran Phu, Da Nang'),  -- "Cua hang", "Da Nang", "Tran Phu"
('ST008', 'Cua hang Can Tho', '456 Nguyen Van Cu, Can Tho'),  -- "Cua hang", "Can Tho"
-- Tên sai chính tả: chữ hoa sai
('ST009', 'Cửa Hàng Hà Nội', '123 Đường Trần Hưng Đạo, Hà Nội'),  -- "Cửa Hàng" (chữ H hoa)
('ST010', 'Cửa Hàng Hồ Chí Minh', '456 Đường Nguyễn Huệ, TP.HCM'),  -- "Cửa Hàng"
-- Tên đúng
('ST011', 'Cửa hàng Nha Trang', '789 Đường Trần Phú, Nha Trang'),
('ST012', 'Cửa hàng Vũng Tàu', '321 Đường Thùy Vân, Vũng Tàu'),
('ST013', 'Cửa hàng Huế', '654 Đường Lê Lợi, Huế'),
('ST014', 'Cửa hàng Quy Nhơn', '123 Đường Nguyễn Tất Thành, Quy Nhơn'),
('ST015', 'Cửa hàng Đà Lạt', '456 Đường Trần Hưng Đạo, Đà Lạt');

-- =========================
-- 2. INSERT CUSTOMERS (30 khách hàng)
-- =========================
INSERT INTO old_customers (phone, full_name, email) VALUES
-- Tên đúng (15 khách hàng)
('0912345678', 'Nguyễn Văn Anh', 'nguyenvananh@email.com'),
('0923456789', 'Trần Thị Bình', 'tranthibinh@email.com'),
('0934567890', 'Lê Văn Cường', 'levancuong@email.com'),
('0987654321', 'Phạm Thị Dung', 'phamthidung@email.com'),
('0976543210', 'Hoàng Văn Em', 'hoangvanem@email.com'),
('0965432109', 'Vũ Thị Phương', 'vuthiphuong@email.com'),
('0954321098', 'Đỗ Văn Giang', 'dovangiang@email.com'),
('0943210987', 'Bùi Thị Hoa', 'buithihoa@email.com'),
('0932109876', 'Ngô Văn Khoa', 'ngovankhoa@email.com'),
('0921098765', 'Đinh Thị Lan', 'dinhthilan@email.com'),
('0910987654', 'Lý Văn Minh', 'lyvanminh@email.com'),
('0909876543', 'Võ Thị Nga', 'vothinga@email.com'),
('0998765432', 'Đặng Văn Phúc', 'dangvanphuc@email.com'),
('0987654321', 'Bạch Thị Quỳnh', 'bachthiquynh@email.com'),
('0976543210', 'Cao Văn Sơn', 'caovanson@email.com'),
-- Tên sai chính tả: thiếu dấu (10 khách hàng)
('0911111111', 'Nguyen Van Phong', 'nguyenvanphong@email.com'),  -- Thiếu dấu
('0922222222', 'Tran Thi Hoa', 'tranthihoa@email'),  -- Thiếu dấu + Email sai: thiếu .com
('0933333333', 'Le Van Hung', 'invalid-email'),  -- Thiếu dấu + Email sai format
('0944444444', 'Pham Thi Lan', 'phamthilan@email.com'),  -- Thiếu dấu
('0955555555', 'Hoang Van Minh', 'hoangvanminh@email.com'),  -- Thiếu dấu
('0966666666', 'Vu Thi Phuong', 'vuthiphuong@email.com'),  -- Thiếu dấu
('0977777777', 'Do Van Giang', 'dovangiang@email.com'),  -- Thiếu dấu
('0988888888', 'Bui Thi Hoa', 'buithihoa@email'),  -- Thiếu dấu + Email sai
('0999999999', 'Ngo Van Khoa', 'ngovankhoa@email.com'),  -- Thiếu dấu
('0900000000', 'Dinh Thi Lan', 'dinhthilan@email.com'),  -- Thiếu dấu
-- Tên sai chính tả: sai dấu (5 khách hàng)
('0912345001', 'Nguyễn Văn Phúc', 'nguyenvanphuc@email.com'),
('0912345002', 'Trần Thị Quỳnh', 'tranthiquynh@email.com'),
('0912345003', 'Lê Văn Sơn', 'levanson@email.com'),
('0912345004', 'Phạm Thị Tuyết', 'phamthituyet@email.com'),
('0912345005', 'Hoàng Văn Tuấn', 'hoangvantuan@email.com');

-- =========================
-- 3. INSERT PRODUCTS (40 sản phẩm)
-- =========================
INSERT INTO old_products (sku, product_name, category) VALUES
-- Tên đúng (20 sản phẩm)
('SKU001', 'Laptop Dell Inspiron 15', 'Điện tử'),
('SKU002', 'Điện thoại Samsung Galaxy S24', 'Điện tử'),
('SKU003', 'Tai nghe Bluetooth Sony WH-1000XM5', 'Phụ kiện'),
('SKU004', 'Laptop Asus ROG Strix G15', 'Điện tử'),
('SKU005', 'Điện thoại iPhone 15 Pro Max', 'Điện tử'),
('SKU006', 'Tai nghe AirPods Pro 2', 'Phụ kiện'),
('SKU007', 'Laptop HP Pavilion 15', 'Điện tử'),
('SKU008', 'Điện thoại Xiaomi Redmi Note 13', 'Điện tử'),
('SKU009', 'Tai nghe JBL Tune 770NC', 'Phụ kiện'),
('SKU010', 'Laptop Lenovo ThinkPad X1', 'Điện tử'),
('SKU011', 'Điện thoại Oppo Find X7', 'Điện tử'),
('SKU012', 'Tai nghe Sony WF-1000XM5', 'Phụ kiện'),
('SKU013', 'Laptop MacBook Pro M3', 'Điện tử'),
('SKU014', 'Điện thoại Vivo Y100', 'Điện tử'),
('SKU015', 'Tai nghe Samsung Galaxy Buds2 Pro', 'Phụ kiện'),
('SKU016', 'Laptop Acer Nitro 5', 'Điện tử'),
('SKU017', 'Điện thoại Realme GT 5', 'Điện tử'),
('SKU018', 'Tai nghe Beats Studio Pro', 'Phụ kiện'),
('SKU019', 'Laptop MSI Katana 15', 'Điện tử'),
('SKU020', 'Điện thoại OnePlus 12', 'Điện tử'),
-- Tên sai chính tả: chữ hoa sai vị trí (10 sản phẩm)
('SKU021', 'LapTop Dell Inspiron', 'Điện tử'),  -- "LapTop"
('SKU022', 'Điện Thoại Samsung', 'Điện tử'),  -- "Điện Thoại"
('SKU023', 'Tai Nghe Bluetooth', 'Phụ kiện'),  -- "Tai Nghe"
('SKU024', 'LapTop Asus ROG', 'Điện tử'),  -- "LapTop"
('SKU025', 'Điện Thoại iPhone', 'Điện tử'),  -- "Điện Thoại"
('SKU026', 'Tai Nghe AirPods', 'Phụ kiện'),  -- "Tai Nghe"
('SKU027', 'LapTop HP Pavilion', 'Điện tử'),  -- "LapTop"
('SKU028', 'Điện Thoại Xiaomi', 'Điện tử'),  -- "Điện Thoại"
('SKU029', 'Tai Nghe JBL', 'Phụ kiện'),  -- "Tai Nghe"
('SKU030', 'LapTop Lenovo', 'Điện tử'),  -- "LapTop"
-- Tên sai chính tả: thiếu dấu (10 sản phẩm)
('SKU031', 'Dien thoai Oppo Find X', 'Điện tử'),  -- "Dien thoai"
('SKU032', 'Tai nghe Sony WF', 'Phụ kiện'),  -- Đúng
('SKU033', 'Laptop MacBook Pro', 'Điện tử'),  -- Đúng
('SKU034', 'Dien thoai Vivo Y100', 'Điện tử'),  -- "Dien thoai"
('SKU035', 'Tai nghe Samsung Galaxy', 'Phụ kiện'),  -- Đúng
('SKU036', 'Laptop Acer Nitro', 'Điện tử'),  -- Đúng
('SKU037', 'Dien thoai Realme GT', 'Điện tử'),  -- "Dien thoai"
('SKU038', 'Tai nghe Beats Studio', 'Phụ kiện'),  -- Đúng
('SKU039', 'Laptop MSI Katana', 'Điện tử'),  -- Đúng
('SKU040', 'Dien thoai OnePlus', 'Điện tử');  -- "Dien thoai"

-- =========================
-- 4. INSERT ORDERS (50 đơn hàng)
-- =========================
INSERT INTO old_orders (order_code, store_code, customer_phone, order_date) VALUES
-- Định dạng ngày tháng đúng (15 đơn hàng)
('ORD001', 'ST001', '0912345678', '2024-01-15 10:30:00'),
('ORD002', 'ST002', '0923456789', '2024-01-16 14:20:00'),
('ORD003', 'ST003', '0934567890', '2024-01-17 09:15:00'),
('ORD004', 'ST004', '0987654321', '2024-01-18 11:45:00'),
('ORD005', 'ST005', '0976543210', '2024-01-19 15:30:00'),
('ORD006', 'ST001', '0965432109', '2024-01-20 08:20:00'),
('ORD007', 'ST002', '0954321098', '2024-01-21 13:10:00'),
('ORD008', 'ST003', '0943210987', '2024-01-22 16:40:00'),
('ORD009', 'ST004', '0932109876', '2024-01-23 10:00:00'),
('ORD010', 'ST005', '0921098765', '2024-01-24 14:50:00'),
('ORD011', 'ST001', '0910987654', '2024-01-25 09:30:00'),
('ORD012', 'ST002', '0909876543', '2024-01-26 12:20:00'),
('ORD013', 'ST003', '0998765432', '2024-01-27 15:10:00'),
('ORD014', 'ST004', '0987654321', '2024-01-28 11:40:00'),
('ORD015', 'ST005', '0976543210', '2024-01-29 16:00:00'),
-- Định dạng ngày tháng sai: dd/mm/yyyy (10 đơn hàng)
('ORD016', 'ST001', '0911111111', '15/01/2024 10:30:00'),
('ORD017', 'ST002', '0922222222', '16/01/2024 14:20:00'),
('ORD018', 'ST003', '0933333333', '17/01/2024 09:15:00'),
('ORD019', 'ST004', '0944444444', '18/01/2024 11:45:00'),
('ORD020', 'ST005', '0955555555', '19/01/2024 15:30:00'),
('ORD021', 'ST001', '0966666666', '20/01/2024 08:20:00'),
('ORD022', 'ST002', '0977777777', '21/01/2024 13:10:00'),
('ORD023', 'ST003', '0988888888', '22/01/2024 16:40:00'),
('ORD024', 'ST004', '0999999999', '23/01/2024 10:00:00'),
('ORD025', 'ST005', '0900000000', '24/01/2024 14:50:00'),
-- Định dạng ngày tháng sai: dd-mm-yyyy (10 đơn hàng)
('ORD026', 'ST001', '0912345001', '25-01-2024 09:30:00'),
('ORD027', 'ST002', '0912345002', '26-01-2024 12:20:00'),
('ORD028', 'ST003', '0912345003', '27-01-2024 15:10:00'),
('ORD029', 'ST004', '0912345004', '28-01-2024 11:40:00'),
('ORD030', 'ST005', '0912345005', '29-01-2024 16:00:00'),
('ORD031', 'ST001', '0912345678', '30-01-2024 10:30:00'),
('ORD032', 'ST002', '0923456789', '31-01-2024 14:20:00'),
('ORD033', 'ST003', '0934567890', '01-02-2024 09:15:00'),
('ORD034', 'ST004', '0987654321', '02-02-2024 11:45:00'),
('ORD035', 'ST005', '0976543210', '03-02-2024 15:30:00'),
-- Định dạng ngày tháng sai: yyyy/mm/dd (5 đơn hàng)
('ORD036', 'ST001', '0965432109', '2024/02/04 08:20:00'),
('ORD037', 'ST002', '0954321098', '2024/02/05 13:10:00'),
('ORD038', 'ST003', '0943210987', '2024/02/06 16:40:00'),
('ORD039', 'ST004', '0932109876', '2024/02/07 10:00:00'),
('ORD040', 'ST005', '0921098765', '2024/02/08 14:50:00'),
-- Định dạng ngày tháng sai: dấu chấm (5 đơn hàng)
('ORD041', 'ST001', '0910987654', '2024.02.09 09:30:00'),
('ORD042', 'ST002', '0909876543', '2024.02.10 12:20:00'),
('ORD043', 'ST003', '0998765432', '2024.02.11 15:10:00'),
('ORD044', 'ST004', '0987654321', '2024.02.12 11:40:00'),
('ORD045', 'ST005', '0976543210', '2024.02.13 16:00:00'),
-- Định dạng ngày tháng sai: thiếu giờ/giây (5 đơn hàng)
('ORD046', 'ST001', '0911111111', '2024-02-14'),  -- Thiếu giờ
('ORD047', 'ST002', '0922222222', '15-02-2024'),  -- Thiếu giờ
('ORD048', 'ST003', '0933333333', '16/02/2024 18:00'),  -- Thiếu giây
('ORD049', 'ST004', '0944444444', '2024-02-17'),  -- Thiếu giờ
('ORD050', 'ST005', '0955555555', '18-02-2024');  -- Thiếu giờ

-- =========================
-- 5. INSERT ORDER ITEMS (100 items với nhiều lỗi)
-- =========================
INSERT INTO old_order_items (order_code, item_sku, item_name, qty, unit_price, currency) VALUES
-- Dữ liệu đúng (20 items)
('ORD001', 'SKU001', 'Laptop Dell Inspiron 15', '1', '15000000', 'VND'),
('ORD001', 'SKU003', 'Tai nghe Bluetooth Sony WH-1000XM5', '2', '5000000', 'VND'),
('ORD002', 'SKU002', 'Điện thoại Samsung Galaxy S24', '1', '12000000', 'VND'),
('ORD003', 'SKU004', 'Laptop Asus ROG Strix G15', '1', '25000000', 'VND'),
('ORD004', 'SKU005', 'Điện thoại iPhone 15 Pro Max', '1', '30000000', 'VND'),
('ORD005', 'SKU006', 'Tai nghe AirPods Pro 2', '1', '6000000', 'VND'),
('ORD006', 'SKU007', 'Laptop HP Pavilion 15', '1', '18000000', 'VND'),
('ORD007', 'SKU008', 'Điện thoại Xiaomi Redmi Note 13', '1', '8500000', 'VND'),
('ORD008', 'SKU009', 'Tai nghe JBL Tune 770NC', '2', '2500000', 'VND'),
('ORD009', 'SKU010', 'Laptop Lenovo ThinkPad X1', '1', '22000000', 'VND'),
('ORD010', 'SKU011', 'Điện thoại Oppo Find X7', '1', '15000000', 'VND'),
('ORD011', 'SKU012', 'Tai nghe Sony WF-1000XM5', '1', '5500000', 'VND'),
('ORD012', 'SKU013', 'Laptop MacBook Pro M3', '1', '45000000', 'VND'),
('ORD013', 'SKU014', 'Điện thoại Vivo Y100', '1', '7000000', 'VND'),
('ORD014', 'SKU015', 'Tai nghe Samsung Galaxy Buds2 Pro', '1', '4000000', 'VND'),
('ORD015', 'SKU016', 'Laptop Acer Nitro 5', '1', '20000000', 'VND'),
('ORD002', 'SKU017', 'Điện thoại Realme GT 5', '1', '10000000', 'VND'),
('ORD003', 'SKU018', 'Tai nghe Beats Studio Pro', '1', '8000000', 'VND'),
('ORD004', 'SKU019', 'Laptop MSI Katana 15', '1', '23000000', 'VND'),
('ORD005', 'SKU020', 'Điện thoại OnePlus 12', '1', '16000000', 'VND'),
-- Định dạng tiền tệ sai: có dấu phẩy (20 items)
('ORD016', 'SKU001', 'Laptop Dell Inspiron 15', '1', '15,000,000', 'VND'),
('ORD017', 'SKU002', 'Điện thoại Samsung Galaxy S24', '1', '12,000,000', 'VND'),
('ORD018', 'SKU003', 'Tai nghe Bluetooth Sony WH-1000XM5', '2', '5,000,000', 'VND'),
('ORD019', 'SKU004', 'Laptop Asus ROG Strix G15', '1', '25,000,000', 'VND'),
('ORD020', 'SKU005', 'Điện thoại iPhone 15 Pro Max', '1', '30,000,000', 'VND'),
('ORD021', 'SKU006', 'Tai nghe AirPods Pro 2', '1', '6,000,000', 'VND'),
('ORD022', 'SKU007', 'Laptop HP Pavilion 15', '1', '18,000,000', 'VND'),
('ORD023', 'SKU008', 'Điện thoại Xiaomi Redmi Note 13', '1', '8,500,000', 'VND'),
('ORD024', 'SKU009', 'Tai nghe JBL Tune 770NC', '2', '2,500,000', 'VND'),
('ORD025', 'SKU010', 'Laptop Lenovo ThinkPad X1', '1', '22,000,000', 'VND'),
('ORD026', 'SKU011', 'Điện thoại Oppo Find X7', '1', '15,000,000', 'VND'),
('ORD027', 'SKU012', 'Tai nghe Sony WF-1000XM5', '1', '5,500,000', 'VND'),
('ORD028', 'SKU013', 'Laptop MacBook Pro M3', '1', '45,000,000', 'VND'),
('ORD029', 'SKU014', 'Điện thoại Vivo Y100', '1', '7,000,000', 'VND'),
('ORD030', 'SKU015', 'Tai nghe Samsung Galaxy Buds2 Pro', '1', '4,000,000', 'VND'),
('ORD031', 'SKU016', 'Laptop Acer Nitro 5', '1', '20,000,000', 'VND'),
('ORD032', 'SKU017', 'Điện thoại Realme GT 5', '1', '10,000,000', 'VND'),
('ORD033', 'SKU018', 'Tai nghe Beats Studio Pro', '1', '8,000,000', 'VND'),
('ORD034', 'SKU019', 'Laptop MSI Katana 15', '1', '23,000,000', 'VND'),
('ORD035', 'SKU020', 'Điện thoại OnePlus 12', '1', '16,000,000', 'VND'),
-- Định dạng tiền tệ sai: có dấu chấm (20 items)
('ORD036', 'SKU021', 'LapTop Dell Inspiron', '1', '15.000.000', 'VND'),  -- Tên sai + Tiền có dấu chấm
('ORD037', 'SKU022', 'Điện Thoại Samsung', '1', '12.000.000', 'VND'),  -- Tên sai + Tiền có dấu chấm
('ORD038', 'SKU023', 'Tai Nghe Bluetooth', '2', '5.000.000', 'VND'),  -- Tên sai + Tiền có dấu chấm
('ORD039', 'SKU024', 'LapTop Asus ROG', '1', '25.000.000', 'VND'),  -- Tên sai + Tiền có dấu chấm
('ORD040', 'SKU025', 'Điện Thoại iPhone', '1', '30.000.000', 'VND'),  -- Tên sai + Tiền có dấu chấm
('ORD041', 'SKU026', 'Tai Nghe AirPods', '1', '6.000.000', 'VND'),  -- Tên sai + Tiền có dấu chấm
('ORD042', 'SKU027', 'LapTop HP Pavilion', '1', '18.000.000', 'VND'),  -- Tên sai + Tiền có dấu chấm
('ORD043', 'SKU028', 'Điện Thoại Xiaomi', '1', '8.500.000', 'VND'),  -- Tên sai + Tiền có dấu chấm
('ORD044', 'SKU029', 'Tai Nghe JBL', '2', '2.500.000', 'VND'),  -- Tên sai + Tiền có dấu chấm
('ORD045', 'SKU030', 'LapTop Lenovo', '1', '22.000.000', 'VND'),  -- Tên sai + Tiền có dấu chấm
('ORD016', 'SKU031', 'Dien thoai Oppo Find X', '1', '15.000.000', 'VND'),  -- Tên sai + Tiền có dấu chấm
('ORD017', 'SKU032', 'Tai nghe Sony WF', '1', '5.500.000', 'VND'),  -- Tiền có dấu chấm
('ORD018', 'SKU033', 'Laptop MacBook Pro', '1', '45.000.000', 'VND'),  -- Tiền có dấu chấm
('ORD019', 'SKU034', 'Dien thoai Vivo Y100', '1', '7.000.000', 'VND'),  -- Tên sai + Tiền có dấu chấm
('ORD020', 'SKU035', 'Tai nghe Samsung Galaxy', '1', '4.000.000', 'VND'),  -- Tiền có dấu chấm
('ORD021', 'SKU036', 'Laptop Acer Nitro', '1', '20.000.000', 'VND'),  -- Tiền có dấu chấm
('ORD022', 'SKU037', 'Dien thoai Realme GT', '1', '10.000.000', 'VND'),  -- Tên sai + Tiền có dấu chấm
('ORD023', 'SKU038', 'Tai nghe Beats Studio', '1', '8.000.000', 'VND'),  -- Tiền có dấu chấm
('ORD024', 'SKU039', 'Laptop MSI Katana', '1', '23.000.000', 'VND'),  -- Tiền có dấu chấm
('ORD025', 'SKU040', 'Dien thoai OnePlus', '1', '16.000.000', 'VND'),  -- Tên sai + Tiền có dấu chấm
-- Số lượng sai: chữ hoặc số thập phân (15 items)
('ORD026', 'SKU001', 'Laptop Dell Inspiron 15', 'one', '15000000', 'VND'),  -- Số lượng là chữ
('ORD027', 'SKU002', 'Điện thoại Samsung Galaxy S24', 'two', '12000000', 'VND'),  -- Số lượng là chữ
('ORD028', 'SKU003', 'Tai nghe Bluetooth Sony WH-1000XM5', '2.5', '5000000', 'VND'),  -- Số lượng thập phân
('ORD029', 'SKU004', 'Laptop Asus ROG Strix G15', '1.5', '25000000', 'VND'),  -- Số lượng thập phân
('ORD030', 'SKU005', 'Điện thoại iPhone 15 Pro Max', 'three', '30000000', 'VND'),  -- Số lượng là chữ
('ORD031', 'SKU006', 'Tai nghe AirPods Pro 2', '2.3', '6000000', 'VND'),  -- Số lượng thập phân
('ORD032', 'SKU007', 'Laptop HP Pavilion 15', 'one', '18000000', 'VND'),  -- Số lượng là chữ
('ORD033', 'SKU008', 'Điện thoại Xiaomi Redmi Note 13', '1.2', '8500000', 'VND'),  -- Số lượng thập phân
('ORD034', 'SKU009', 'Tai nghe JBL Tune 770NC', 'two', '2500000', 'VND'),  -- Số lượng là chữ
('ORD035', 'SKU010', 'Laptop Lenovo ThinkPad X1', '1.8', '22000000', 'VND'),  -- Số lượng thập phân
('ORD036', 'SKU011', 'Điện thoại Oppo Find X7', 'three', '15000000', 'VND'),  -- Số lượng là chữ
('ORD037', 'SKU012', 'Tai nghe Sony WF-1000XM5', '2.1', '5500000', 'VND'),  -- Số lượng thập phân
('ORD038', 'SKU013', 'Laptop MacBook Pro M3', 'one', '45000000', 'VND'),  -- Số lượng là chữ
('ORD039', 'SKU014', 'Điện thoại Vivo Y100', '1.5', '7000000', 'VND'),  -- Số lượng thập phân
('ORD040', 'SKU015', 'Tai nghe Samsung Galaxy Buds2 Pro', 'two', '4000000', 'VND'),  -- Số lượng là chữ
-- Currency sai (10 items)
('ORD041', 'SKU016', 'Laptop Acer Nitro 5', '1', '20000000', 'vnd'),  -- Currency chữ thường
('ORD042', 'SKU017', 'Điện thoại Realme GT 5', '1', '10000000', 'USD'),  -- Currency sai
('ORD043', 'SKU018', 'Tai nghe Beats Studio Pro', '1', '8000000', 'EUR'),  -- Currency sai
('ORD044', 'SKU019', 'Laptop MSI Katana 15', '1', '23000000', 'vnd'),  -- Currency chữ thường
('ORD045', 'SKU020', 'Điện thoại OnePlus 12', '1', '16000000', 'USD'),  -- Currency sai
('ORD046', 'SKU021', 'LapTop Dell Inspiron', '1', '15000000', 'EUR'),  -- Tên sai + Currency sai
('ORD047', 'SKU022', 'Điện Thoại Samsung', '1', '12000000', 'vnd'),  -- Tên sai + Currency chữ thường
('ORD048', 'SKU023', 'Tai Nghe Bluetooth', '2', '5000000', 'USD'),  -- Tên sai + Currency sai
('ORD049', 'SKU024', 'LapTop Asus ROG', '1', '25000000', 'EUR'),  -- Tên sai + Currency sai
('ORD050', 'SKU025', 'Điện Thoại iPhone', '1', '30000000', 'vnd'),  -- Tên sai + Currency chữ thường
-- Kết hợp nhiều lỗi (15 items)
('ORD016', 'SKU021', 'LapTop Dell Inspiron', 'two', '15,000,000', 'VND'),  -- Tên sai + Số lượng chữ + Tiền có dấu phẩy
('ORD017', 'SKU022', 'Điện Thoại Samsung', '1.5', '12.000.000', 'VND'),  -- Tên sai + Số lượng thập phân + Tiền có dấu chấm
('ORD018', 'SKU023', 'Tai Nghe Bluetooth', 'three', '5,000,000', 'USD'),  -- Tên sai + Số lượng chữ + Tiền có dấu phẩy + Currency sai
('ORD019', 'SKU031', 'Dien thoai Oppo Find X', 'two', '15.000.000', 'EUR'),  -- Tên sai + Số lượng chữ + Tiền có dấu chấm + Currency sai
('ORD020', 'SKU034', 'Dien thoai Vivo Y100', '1.2', '7,000,000', 'vnd'),  -- Tên sai + Số lượng thập phân + Tiền có dấu phẩy + Currency chữ thường
('ORD021', 'SKU037', 'Dien thoai Realme GT', 'one', '10.000.000', 'USD'),  -- Tên sai + Số lượng chữ + Tiền có dấu chấm + Currency sai
('ORD022', 'SKU040', 'Dien thoai OnePlus', '2.5', '16,000,000', 'EUR'),  -- Tên sai + Số lượng thập phân + Tiền có dấu phẩy + Currency sai
('ORD023', 'SKU021', 'LapTop Dell Inspiron', 'three', '15.000.000', 'vnd'),  -- Tên sai + Số lượng chữ + Tiền có dấu chấm + Currency chữ thường
('ORD024', 'SKU022', 'Điện Thoại Samsung', '1.8', '12,000,000', 'USD'),  -- Tên sai + Số lượng thập phân + Tiền có dấu phẩy + Currency sai
('ORD025', 'SKU023', 'Tai Nghe Bluetooth', 'two', '5.000.000', 'EUR'),  -- Tên sai + Số lượng chữ + Tiền có dấu chấm + Currency sai
('ORD026', 'SKU024', 'LapTop Asus ROG', 'one', '25,000,000', 'vnd'),  -- Tên sai + Số lượng chữ + Tiền có dấu phẩy + Currency chữ thường
('ORD027', 'SKU025', 'Điện Thoại iPhone', '2.3', '30.000.000', 'USD'),  -- Tên sai + Số lượng thập phân + Tiền có dấu chấm + Currency sai
('ORD028', 'SKU026', 'Tai Nghe AirPods', 'three', '6,000,000', 'EUR'),  -- Tên sai + Số lượng chữ + Tiền có dấu phẩy + Currency sai
('ORD029', 'SKU027', 'LapTop HP Pavilion', '1.2', '18.000.000', 'vnd'),  -- Tên sai + Số lượng thập phân + Tiền có dấu chấm + Currency chữ thường
('ORD030', 'SKU028', 'Điện Thoại Xiaomi', 'two', '8,500,000', 'USD');  -- Tên sai + Số lượng chữ + Tiền có dấu phẩy + Currency sai

SELECT 'Fake data inserted successfully!' AS result;
SELECT CONCAT('Total stores: ', COUNT(*)) AS summary FROM old_stores;
SELECT CONCAT('Total customers: ', COUNT(*)) AS summary FROM old_customers;
SELECT CONCAT('Total products: ', COUNT(*)) AS summary FROM old_products;
SELECT CONCAT('Total orders: ', COUNT(*)) AS summary FROM old_orders;
SELECT CONCAT('Total order items: ', COUNT(*)) AS summary FROM old_order_items;

