import { logToDB } from '../utils/logger.js';

export async function loadData(data) {
  try {
    await logToDB({
      stage: 'Load',
      status: 'processing',
      message: 'Đang ghi dữ liệu vào hệ thống đích...',
      data: { count: data.length }
    });

    // --- Giả lập tải dữ liệu thành công ---
    await new Promise(resolve => setTimeout(resolve, 1000));

    await logToDB({
      stage: 'Load',
      status: 'success',
      message: 'Ghi dữ liệu hoàn tất',
      data: { count: data.length }
    });
  } catch (err) {
    await logToDB({
      stage: 'Load',
      status: 'failed',
      message: err.message,
      data: {}
    });
  }
}
