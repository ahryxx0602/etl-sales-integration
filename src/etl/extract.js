import { logToDB } from '../utils/logger.js';

export async function extractData() {
  try {
    await logToDB({
      stage: 'Extract',
      status: 'processing',
      message: 'Bắt đầu trích xuất dữ liệu',
      data: {}
    });

    // --- Đây là ví dụ code trích xuất ---
    const data = [
      { id: 1, name: 'Sản phẩm A' },
      { id: 2, name: 'Sản phẩm B' }
    ];

    await logToDB({
      stage: 'Extract',
      status: 'success',
      message: `Đã trích xuất ${data.length} bản ghi`,
      data
    });

    return data;
  } catch (err) {
    await logToDB({
      stage: 'Extract',
      status: 'failed',
      message: err.message,
      data: {}
    });
  }
}
