/**
 * Reusable components và table configurations
 */
import { utils } from './utils.js';

export const tableConfigs = {
  stores: {
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'store_code', label: 'Mã cửa hàng' },
      { key: 'store_name', label: 'Tên cửa hàng' }
    ],
    emptyMessage: 'Không có dữ liệu cửa hàng'
  },
  customers: {
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'phone', label: 'Số điện thoại' },
      { key: 'full_name', label: 'Họ tên' },
      { key: 'email', label: 'Email' }
    ],
    emptyMessage: 'Không có dữ liệu khách hàng'
  },
  products: {
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'sku', label: 'SKU' },
      { key: 'product_name', label: 'Tên sản phẩm' },
      { key: 'category', label: 'Danh mục' }
    ],
    emptyMessage: 'Không có dữ liệu sản phẩm'
  },
  orders: {
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'order_code', label: 'Mã đơn hàng' },
      { key: 'store_name', label: 'Cửa hàng' },
      { key: 'customer_name', label: 'Khách hàng', formatter: (row) => row.customer_name || row.customer_phone || '-' },
      { key: 'order_datetime', label: 'Thời gian đặt', formatter: (row) => utils.formatDate(row.order_datetime) }
    ],
    emptyMessage: 'Không có dữ liệu đơn hàng'
  },
  'orderItems': {
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'order_code', label: 'Mã đơn hàng' },
      { key: 'product_name', label: 'Sản phẩm' },
      { key: 'sku', label: 'SKU' },
      { key: 'qty', label: 'Số lượng' },
      { key: 'unit_price', label: 'Đơn giá', formatter: (row) => utils.formatNumber(row.unit_price) },
      { key: 'currency', label: 'Tiền tệ' }
    ],
    emptyMessage: 'Không có dữ liệu chi tiết đơn hàng'
  },
  logs: {
    columns: [
      { key: 'created_at', label: 'Thời gian', formatter: (row) => utils.formatDate(row.created_at) },
      { key: 'source_table', label: 'Nguồn' },
      { key: 'source_type', label: 'Loại' },
      { key: 'order_code', label: 'Order Code' },
      { key: 'status', label: 'Status', formatter: (row) => `<span class="status-badge ${utils.getStatusBadgeClass(row.status)}">${row.status || '-'}</span>` },
      { key: 'message', label: 'Message' }
    ],
    emptyMessage: 'Không có logs'
  }
};

