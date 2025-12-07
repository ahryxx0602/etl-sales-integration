/**
 * Service để validate product data
 */
export class ProductValidationService {
  validateSku(sku) {
    if (!sku || typeof sku !== 'string') {
      return { valid: false, error: 'SKU is required' };
    }
    const trimmed = sku.trim();
    if (trimmed.length === 0 || trimmed.length > 20) {
      return { valid: false, error: 'SKU must be 1-20 characters' };
    }
    return { valid: true, value: trimmed.toUpperCase() };
  }

  validateProductName(productName) {
    if (!productName) return { valid: true, value: null };
    const trimmed = String(productName).trim();
    if (trimmed.length === 0) return { valid: true, value: null };
    if (trimmed.length > 255) {
      return { valid: false, error: 'Product name too long (max 255 characters)' };
    }
    return { valid: true, value: trimmed };
  }

  validateQty(qty) {
    if (!qty) {
      return { valid: false, error: 'Quantity is required' };
    }
    const num = parseInt(String(qty).trim());
    if (isNaN(num) || num <= 0) {
      return { valid: false, error: 'Quantity must be a positive integer' };
    }
    return { valid: true, value: num };
  }

  validatePrice(price) {
    if (!price) {
      return { valid: false, error: 'Price is required' };
    }
    const num = parseFloat(String(price).trim().replace(/,/g, ''));
    if (isNaN(num) || num <= 0) {
      return { valid: false, error: 'Price must be a positive number' };
    }
    return { valid: true, value: Math.round(num) };
  }
}

