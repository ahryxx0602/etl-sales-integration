import { logToDB } from '../utils/logger.js';
import logger from '../utils/logger.js';

(async () => {
  try {
    logger.info('🧪 Test ghi log vào MySQL...');
    await logToDB({
      stage: 'validate',
      status: 'success',
      message: 'Kiểm tra dữ liệu mẫu thành công',
      data: { order_id: 123, customer: 'Hiếu', total: 450000 },
    });
    logger.info('✅ Đã ghi log thành công vào MySQL.');
  } catch (err) {
    logger.error('❌ Lỗi khi ghi log:', err);
  }
})();
