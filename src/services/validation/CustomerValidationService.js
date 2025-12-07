/**
 * Service để validate customer data
 */
export class CustomerValidationService {
  validatePhone(phone) {
    if (!phone) return { valid: true, value: null };
    const trimmed = String(phone).trim();
    if (trimmed.length === 0) return { valid: true, value: null };
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(trimmed)) {
      return { valid: false, error: 'Phone must be 10-11 digits' };
    }
    return { valid: true, value: trimmed };
  }

  validateEmail(email) {
    if (!email) return { valid: true, value: null };
    const trimmed = String(email).trim();
    if (trimmed.length === 0) return { valid: true, value: null };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return { valid: false, error: 'Invalid email format' };
    }
    return { valid: true, value: trimmed.toLowerCase() };
  }
}

