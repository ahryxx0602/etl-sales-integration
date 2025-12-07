/**
 * Reusable Table Component cho Alpine.js
 * Giảm thiểu code lặp lại trong HTML
 */
export function createTableComponent(tableName, columns, emptyMessage = 'Không có dữ liệu') {
  return {
    tableName,
    columns,
    emptyMessage,
    
    // Render table HTML
    render(state, formatDate, formatNumber) {
      const colCount = columns.length;
      
      return `
        <div class="data-section">
          <h2>${this.getTitle()}</h2>
          <div class="filters">
            <button class="btn-secondary" @click="loadTable('${tableName}')">Làm mới</button>
            <span class="total-count">Tổng: <span x-text="${state}.total || 0"></span></span>
            <select class="page-size-select" 
                    :value="${state}.pageSize"
                    @change="changePageSize('${tableName}', $event.target.value)">
              <option value="10">10 / trang</option>
              <option value="25">25 / trang</option>
              <option value="50">50 / trang</option>
              <option value="100">100 / trang</option>
            </select>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  ${columns.map(col => `<th>${col.label}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                <template x-if="${state}.loading">
                  <tr><td colspan="${colCount}" style="text-align: center; padding: 40px;">Đang tải...</td></tr>
                </template>
                <template x-if="!${state}.loading && ${state}.error">
                  <tr><td colspan="${colCount}" style="color: red; padding: 20px;" x-text="'Lỗi: ' + ${state}.error"></td></tr>
                </template>
                <template x-if="!${state}.loading && !${state}.error && ${state}.data.length === 0">
                  <tr><td colspan="${colCount}" style="text-align: center; padding: 40px;">${emptyMessage}</td></tr>
                </template>
                <template x-if="!${state}.loading && !${state}.error && ${state}.data.length > 0">
                  <template x-for="row in ${state}.data" :key="row.id">
                    <tr>
                      ${columns.map(col => this.renderCell(col)).join('')}
                    </tr>
                  </template>
                </template>
              </tbody>
            </table>
          </div>
          ${this.renderPagination(state)}
        </div>
      `;
    },
    
    renderCell(column) {
      if (column.formatter) {
        return `<td x-html="${column.formatter}"></td>`;
      }
      return `<td x-text="row.${column.key} || '-'"></td>`;
    },
    
    renderPagination(state) {
      return `
        <div class="pagination" x-show="getPaginationInfo('${tableName}')">
          <template x-if="getPaginationInfo('${tableName}')">
            <div>
              <button @click="goToPage('${tableName}', ${state}.page - 1)" 
                      :disabled="!getPaginationInfo('${tableName}').hasPrev">‹ Trước</button>
              <template x-for="page in Array.from({length: getPaginationInfo('${tableName}').endPage - getPaginationInfo('${tableName}').startPage + 1}, (_, i) => getPaginationInfo('${tableName}').startPage + i)" :key="page">
                <button @click="goToPage('${tableName}', page)" 
                        :class="{ active: page === ${state}.page }"
                        x-text="page"></button>
              </template>
              <button @click="goToPage('${tableName}', ${state}.page + 1)" 
                      :disabled="!getPaginationInfo('${tableName}').hasNext">Sau ›</button>
              <span class="page-info">
                Trang <span x-text="${state}.page"></span> / <span x-text="getPaginationInfo('${tableName}').totalPages"></span>
                (<span x-text="getPaginationInfo('${tableName}').startItem"></span>-<span x-text="getPaginationInfo('${tableName}').endItem"></span> / <span x-text="${state}.total"></span>)
              </span>
            </div>
          </template>
        </div>
      `;
    },
    
    getTitle() {
      const titles = {
        stores: 'Cửa hàng',
        customers: 'Khách hàng',
        products: 'Sản phẩm',
        orders: 'Đơn hàng',
        orderItems: 'Chi tiết đơn hàng',
        logs: 'ETL Logs'
      };
      return titles[tableName] || tableName;
    }
  };
}

