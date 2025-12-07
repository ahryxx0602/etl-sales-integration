/**
 * Service để validate store data
 */
export class StoreValidationService {
  validateStoreCode(storeCode) {
    if (!storeCode || typeof storeCode !== 'string') {
      return { valid: false, error: 'Store code is required' };
    }
    const trimmed = storeCode.trim();
    if (trimmed.length === 0 || trimmed.length > 10) {
      return { valid: false, error: 'Store code must be 1-10 characters' };
    }
    return { valid: true, value: trimmed.toUpperCase() };
  }
}

