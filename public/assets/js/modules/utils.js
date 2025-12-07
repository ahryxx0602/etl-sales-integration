/**
 * Utility functions - Sử dụng dayjs và numeral.js
 */
import dayjs from 'https://cdn.jsdelivr.net/npm/dayjs@1.11.10/+esm';
import numeral from 'https://cdn.jsdelivr.net/npm/numeral@2.0.6/+esm';

// Note: dayjs locale có thể gây lỗi với ESM, dùng format thủ công cho đơn giản

export const utils = {
  formatDate(dateString) {
    if (!dateString) return '-';
    return dayjs(dateString).format('DD/MM/YYYY HH:mm:ss');
  },

  formatNumber(num) {
    if (!num && num !== 0) return '-';
    return numeral(num).format('0,0');
  },

  formatCurrency(amount, currency = 'VND') {
    if (!amount && amount !== 0) return '-';
    return `${numeral(amount).format('0,0')} ${currency}`;
  },

  getStatusBadgeClass(status) {
    const statusMap = {
      'success': 'success',
      'error': 'error',
      'validation_error': 'validation_error'
    };
    return statusMap[status] || '';
  },

  calculatePagination(page, pageSize, total) {
    const totalPages = Math.ceil(total / pageSize);
    const startItem = (page - 1) * pageSize + 1;
    const endItem = Math.min(page * pageSize, total);
    
    const maxVisiblePages = 7;
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    return {
      totalPages,
      startItem,
      endItem,
      startPage,
      endPage,
      hasPrev: page > 1,
      hasNext: page < totalPages
    };
  }
};
