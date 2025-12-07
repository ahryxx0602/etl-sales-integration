import express from 'express';
import processRoutes from './processRoutes.js';
import dataRoutes from './dataRoutes.js';
import rabbitMQRoutes from './rabbitMQRoutes.js';

const router = express.Router();

// Mount sub-routers
router.use('/process', processRoutes);
router.use('/', dataRoutes);
router.use('/rabbitmq', rabbitMQRoutes);

// Debug: Log all registered routes
console.log('  ETL Routes registered:');
console.log('  POST /api/etl/process/old-db');
console.log('  POST /api/etl/process/csv');
console.log('  POST /api/etl/process/csv-folder');
console.log('  POST /api/etl/process/raw-orders');
console.log('  GET  /api/etl/stats');
console.log('  GET  /api/etl/logs');
console.log('  GET  /api/etl/stores');
console.log('  GET  /api/etl/customers');
console.log('  GET  /api/etl/products');
console.log('  GET  /api/etl/orders');
console.log('  GET  /api/etl/order-items');

// API Info route - Đặt CUỐI CÙNG để không conflict với các routes khác
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ETL API is running',
    version: '1.0.0',
    endpoints: {
      'POST /api/etl/process/old-db': 'Xử lý dữ liệu từ old_db',
      'POST /api/etl/process/csv': 'Upload và xử lý file CSV',
      'POST /api/etl/process/csv-folder': 'Xử lý tất cả CSV files từ thư mục data',
      'POST /api/etl/process/raw-orders': 'Xử lý dữ liệu từ raw_orders',
      'GET /api/etl/stats': 'Lấy thống kê dữ liệu',
      'GET /api/etl/logs': 'Lấy logs ETL (có thể thêm ?limit=100)',
      'GET /api/etl/stores': 'Lấy danh sách cửa hàng',
      'GET /api/etl/customers': 'Lấy danh sách khách hàng',
      'GET /api/etl/products': 'Lấy danh sách sản phẩm',
      'GET /api/etl/orders': 'Lấy danh sách đơn hàng',
      'GET /api/etl/order-items': 'Lấy chi tiết đơn hàng',
      'GET /api/etl/rabbitmq/status': 'Kiểm tra trạng thái RabbitMQ',
      'GET /api/etl': 'Thông tin API (endpoint này)',
    },
    timestamp: new Date().toISOString(),
  });
});


export default router;
