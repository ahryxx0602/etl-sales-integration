/**
 * Utility functions để normalize dữ liệu trước khi validate
 * Xử lý các trường hợp dữ liệu có format sai nhưng có thể sửa được
 */

/**
 * Normalize số lượng (qty)
 * - Chuyển chữ thành số (one -> 1, two -> 2, three -> 3)
 * - Làm tròn số thập phân thành số nguyên
 * - Loại bỏ ký tự không phải số
 * 
 * @param {string|number} qty - Số lượng cần normalize
 * @returns {number|null} Số lượng đã normalize, hoặc null nếu không thể parse
 * 
 * @example
 * normalizeQty('two') // => 2
 * normalizeQty('1.5') // => 2 (làm tròn)
 * normalizeQty('1') // => 1
 * normalizeQty('abc') // => null
 */
export function normalizeQty(qty) {
  if (qty === null || qty === undefined || qty === '') {
    return null;
  }

  // Nếu đã là số, làm tròn thành số nguyên
  if (typeof qty === 'number') {
    return Math.round(qty);
  }

  const str = String(qty).trim().toLowerCase();

  // Mapping chữ thành số
  const wordToNumber = {
    'one': 1,
    'two': 2,
    'three': 3,
    'four': 4,
    'five': 5,
    'six': 6,
    'seven': 7,
    'eight': 8,
    'nine': 9,
    'ten': 10,
  };

  // Nếu là chữ, chuyển thành số
  if (wordToNumber[str]) {
    return wordToNumber[str];
  }

  // Loại bỏ ký tự không phải số và dấu chấm
  const cleaned = str.replace(/[^0-9.]/g, '');
  
  if (!cleaned) {
    return null;
  }

  // Parse số thập phân và làm tròn
  const num = parseFloat(cleaned);
  if (isNaN(num)) {
    return null;
  }

  return Math.round(num);
}

/**
 * Normalize giá (unit_price)
 * - Loại bỏ dấu chấm/phẩy phân cách hàng nghìn
 * - Chuyển string thành number
 * 
 * @param {string|number} price - Giá cần normalize
 * @returns {number|null} Giá đã normalize, hoặc null nếu không thể parse
 * 
 * @example
 * normalizePrice('22.000.000') // => 22000000
 * normalizePrice('15,000,000') // => 15000000
 * normalizePrice('5000000') // => 5000000
 * normalizePrice('abc') // => null
 */
export function normalizePrice(price) {
  if (price === null || price === undefined || price === '') {
    return null;
  }

  // Nếu đã là số, trả về luôn
  if (typeof price === 'number') {
    return price;
  }

  const str = String(price).trim();

  // Loại bỏ tất cả ký tự không phải số (bao gồm dấu chấm, phẩy, khoảng trắng)
  // Chỉ giữ lại số
  const cleaned = str.replace(/[^\d]/g, '');

  if (!cleaned) {
    return null;
  }

  // Parse như số nguyên (không có phần thập phân cho giá tiền)
  const num = parseInt(cleaned, 10);
  if (isNaN(num)) {
    return null;
  }

  return num;
}

/**
 * Normalize email
 * - Sửa email thiếu .com (tranthihoa@email -> tranthihoa@email.com)
 * - Loại bỏ khoảng trắng
 * - Chuyển thành chữ thường
 * 
 * @param {string|null|undefined} email - Email cần normalize
 * @returns {string|null} Email đã normalize, hoặc null nếu không hợp lệ
 * 
 * @example
 * normalizeEmail('tranthihoa@email') // => 'tranthihoa@email.com'
 * normalizeEmail('user@domain') // => 'user@domain.com'
 * normalizeEmail('invalid-email') // => null
 * normalizeEmail('user@domain.com') // => 'user@domain.com'
 */
export function normalizeEmail(email) {
  if (!email || typeof email !== 'string') {
    return null;
  }

  let normalized = email.trim().toLowerCase();

  // Loại bỏ khoảng trắng
  normalized = normalized.replace(/\s+/g, '');

  // Nếu không có @, không phải email hợp lệ
  if (!normalized.includes('@')) {
    return null;
  }

  // Kiểm tra nếu email kết thúc bằng @domain mà không có TLD
  // Ví dụ: user@email, user@domain -> thêm .com
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailPattern.test(normalized)) {
    // Nếu không có TLD, thử thêm .com
    if (normalized.includes('@') && !normalized.includes('@', normalized.indexOf('@') + 1)) {
      const [localPart, domain] = normalized.split('@');
      if (domain && !domain.includes('.')) {
        // Domain không có TLD, thêm .com
        normalized = `${localPart}@${domain}.com`;
      }
    }
  }

  // Kiểm tra lại pattern sau khi normalize
  if (!emailPattern.test(normalized)) {
    return null;
  }

  return normalized;
}

/**
 * Normalize currency
 * - Chuyển thành chữ hoa
 * - Xử lý các biến thể: vnd, vnđ, VND -> VND
 * 
 * @param {string|null|undefined} currency - Currency cần normalize
 * @param {string} defaultCurrency - Currency mặc định nếu không hợp lệ
 * @returns {string} Currency đã normalize
 * 
 * @example
 * normalizeCurrency('vnd') // => 'VND'
 * normalizeCurrency('vnđ') // => 'VND'
 * normalizeCurrency('usd') // => 'USD'
 */
export function normalizeCurrency(currency, defaultCurrency = 'VND') {
  if (!currency || typeof currency !== 'string') {
    return defaultCurrency;
  }

  const normalized = currency.trim().toUpperCase();

  // Xử lý các biến thể của VND
  if (normalized === 'VNĐ' || normalized === 'VND' || normalized === 'VN') {
    return 'VND';
  }

  // Các currency khác
  const validCurrencies = ['VND', 'USD', 'EUR', 'JPY', 'CNY'];
  if (validCurrencies.includes(normalized)) {
    return normalized;
  }

  return defaultCurrency;
}

