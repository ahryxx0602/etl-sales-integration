import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(customParseFormat);
dayjs.extend(utc);

/**
 * Các format date được hỗ trợ
 * @readonly
 */
const DATE_FORMATS = [
  'YYYY-MM-DD HH:mm:ss',
  'YYYY-MM-DD HH:mm',      // Thiếu giây
  'YYYY-MM-DD',
  'DD/MM/YYYY HH:mm:ss',
  'DD/MM/YYYY HH:mm',      // Thiếu giây
  'DD/MM/YYYY',
  'DD-MM-YYYY HH:mm:ss',
  'DD-MM-YYYY HH:mm',      // Thiếu giây
  'DD-MM-YYYY',
  'YYYY/MM/DD HH:mm:ss',
  'YYYY/MM/DD HH:mm',      // Thiếu giây
  'YYYY/MM/DD',
  'DD.MM.YYYY HH:mm:ss',
  'DD.MM.YYYY HH:mm',      // Thiếu giây
  'DD.MM.YYYY',
  'YYYY.MM.DD HH:mm:ss',
  'YYYY.MM.DD HH:mm',      // Thiếu giây
  'YYYY.MM.DD',
  'MM-DD-YYYY',            // Format Mỹ
  'MM/DD/YYYY',
];

/**
 * Validate và parse date string
 * 
 * Thử parse với nhiều format khác nhau để hỗ trợ các định dạng date phổ biến.
 * 
 * @param {string} dateStr - Date string cần parse
 * @returns {{valid: boolean, value?: string, error?: string}}
 *   - `valid`: true nếu parse thành công
 *   - `value`: Date string đã format theo MySQL datetime (YYYY-MM-DD HH:mm:ss)
 *   - `error`: Error message nếu parse thất bại
 * 
 * @example
 * validateAndParseDate('2024-01-15 10:30:00') // => { valid: true, value: '2024-01-15 10:30:00' }
 * validateAndParseDate('15/01/2024') // => { valid: true, value: '2024-01-15 00:00:00' }
 * validateAndParseDate('invalid') // => { valid: false, error: 'Invalid date format: invalid' }
 */
export function validateAndParseDate(dateStr) {
  if (!dateStr) {
    return { valid: false, error: 'Order date is required' };
  }

  const str = String(dateStr).trim();

  // Thử parse với các format đã định nghĩa
  for (const format of DATE_FORMATS) {
    const parsed = dayjs(str, format, true); // strict mode
    if (parsed.isValid()) {
      return {
        valid: true,
        value: parsed.format('YYYY-MM-DD HH:mm:ss'),
      };
    }
  }

  // Thử parse với ISO format hoặc default parsing
  const parsed = dayjs(str);
  if (parsed.isValid()) {
    return {
      valid: true,
      value: parsed.format('YYYY-MM-DD HH:mm:ss'),
    };
  }

  return {
    valid: false,
    error: `Invalid date format: ${str}`,
  };
}

/**
 * Format date to MySQL datetime
 * 
 * @param {Date|string|dayjs.Dayjs} date - Date object, string hoặc dayjs object
 * @returns {string} MySQL datetime format (YYYY-MM-DD HH:mm:ss)
 * 
 * @example
 * formatToMySQLDateTime(new Date()) // => '2024-01-15 10:30:00'
 * formatToMySQLDateTime('2024-01-15') // => '2024-01-15 00:00:00'
 */
export function formatToMySQLDateTime(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}

