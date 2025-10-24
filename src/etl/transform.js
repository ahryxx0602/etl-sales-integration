import { logToDB } from '../utils/logger.js';

export async function transformData(rawData) {
  try {
    await logToDB({
      stage: 'Transform',
      status: 'processing',
      message: 'Đang xử lý dữ liệu...',
      data: { count: rawData.length }
    });

    const transformed = rawData.map(item => ({
      ...item,
      name: item.name.toUpperCase(),
    }));

    await logToDB({
      stage: 'Transform',
      status: 'success',
      message: 'Xử lý dữ liệu thành công',
      data: transformed
    });

    return transformed;
  } catch (err) {
    await logToDB({
      stage: 'Transform',
      status: 'failed',
      message: err.message,
      data: {}
    });
  }
}
