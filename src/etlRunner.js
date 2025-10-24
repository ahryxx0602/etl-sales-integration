import { extractData } from './etl/extract.js';
import { transformData } from './etl/transform.js';
import { loadData } from './etl/load.js';
import logger from './utils/logger.js';

async function runETL() {
  logger.info('🚀 Bắt đầu quy trình ETL...');

  const rawData = await extractData();
  const transformedData = await transformData(rawData);
  await loadData(transformedData);

  logger.info('✅ ETL hoàn tất.');
}

runETL().catch(err => logger.error('ETL lỗi:', err));
