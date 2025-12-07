/**
 * Database helper functions để giảm code lặp lại trong models
 * @module utils/dbHelpers
 */

/**
 * Thực hiện upsert và trả về ID
 * 
 * @param {Object} pool - MySQL pool
 * @param {string} table - Tên bảng
 * @param {string} keyField - Tên field làm key (ví dụ: 'store_code', 'phone')
 * @param {string} keyValue - Giá trị key
 * @param {Object} data - Dữ liệu cần insert/update
 * @param {Object} [options] - Options
 * @param {Array<string>} [options.updateFields] - Các field cần update (mặc định: tất cả)
 * @param {string} [options.idField='id'] - Tên field ID để trả về
 * @returns {Promise<number>} ID của record
 * 
 * @example
 * const storeId = await upsertAndGetId(pool, 'stores', 'store_code', 'STORE01', {
 *   store_code: 'STORE01',
 *   store_name: 'Store Name'
 * });
 */
export async function upsertAndGetId(pool, table, keyField, keyValue, data, options = {}) {
  const { updateFields, idField = 'id' } = options;
  
  // Tạo danh sách fields và values
  const fields = Object.keys(data);
  const values = fields.map(field => data[field]);
  const placeholders = fields.map(() => '?').join(', ');
  
  // Tạo ON DUPLICATE KEY UPDATE clause
  let updateClause = '';
  if (updateFields) {
    // Chỉ update các fields được chỉ định
    updateClause = updateFields
      .map(field => {
        if (data[field] === null || data[field] === undefined) {
          return `${field} = COALESCE(VALUES(${field}), ${field})`;
        }
        return `${field} = VALUES(${field})`;
      })
      .join(', ');
  } else {
    // Update tất cả fields (trừ key field)
    updateClause = fields
      .filter(field => field !== keyField)
      .map(field => {
        if (data[field] === null || data[field] === undefined) {
          return `${field} = COALESCE(VALUES(${field}), ${field})`;
        }
        return `${field} = VALUES(${field})`;
      })
      .join(', ');
  }
  
  const query = `
    INSERT INTO ${table} (${fields.join(', ')})
    VALUES (${placeholders})
    ON DUPLICATE KEY UPDATE ${updateClause}
  `;
  
  await pool.query(query, values);
  
  // Lấy ID
  const [rows] = await pool.query(`SELECT ${idField} FROM ${table} WHERE ${keyField} = ?`, [keyValue]);
  return rows[0]?.[idField] || null;
}

/**
 * Thực hiện pagination query
 * 
 * @param {Object} pool - MySQL pool
 * @param {string} baseQuery - Base SELECT query (không có LIMIT/OFFSET)
 * @param {string} countQuery - COUNT query
 * @param {Array} params - Query parameters
 * @param {number} limit - Số lượng records
 * @param {number} offset - Số records bỏ qua
 * @returns {Promise<{data: Array, total: number}>} Dữ liệu và tổng số records
 * 
 * @example
 * const result = await paginateQuery(
 *   pool,
 *   'SELECT * FROM stores',
 *   'SELECT COUNT(*) as total FROM stores',
 *   [],
 *   100,
 *   0
 * );
 */
export async function paginateQuery(pool, baseQuery, countQuery, params, limit, offset) {
  const query = `${baseQuery} LIMIT ? OFFSET ?`;
  const queryParams = [...params, limit, offset];
  
  const [rows] = await pool.query(query, queryParams);
  const [count] = await pool.query(countQuery, params);
  
  return {
    data: rows,
    total: count[0].total,
  };
}

/**
 * Thực hiện query với WHERE condition động
 * 
 * @param {Object} pool - MySQL pool
 * @param {string} baseQuery - Base SELECT query
 * @param {string} countQuery - COUNT query
 * @param {Object} filters - Filters object {field: value}
 * @param {number} limit - Số lượng records
 * @param {number} offset - Số records bỏ qua
 * @returns {Promise<{data: Array, total: number}>} Dữ liệu và tổng số records
 * 
 * @example
 * const result = await queryWithFilters(
 *   pool,
 *   'SELECT * FROM etl_logs',
 *   'SELECT COUNT(*) as total FROM etl_logs',
 *   { status: 'error' },
 *   100,
 *   0
 * );
 */
export async function queryWithFilters(pool, baseQuery, countQuery, filters, limit, offset) {
  const whereConditions = [];
  const params = [];
  
  // Tạo WHERE conditions
  for (const [field, value] of Object.entries(filters)) {
    if (value !== null && value !== undefined) {
      whereConditions.push(`${field} = ?`);
      params.push(value);
    }
  }
  
  // Thêm WHERE clause nếu có conditions
  const whereClause = whereConditions.length > 0 
    ? ` WHERE ${whereConditions.join(' AND ')}`
    : '';
  
  const query = `${baseQuery}${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`;
  const countQueryWithWhere = `${countQuery}${whereClause}`;
  
  const queryParams = [...params, limit, offset];
  
  const [rows] = await pool.query(query, queryParams);
  const [count] = await pool.query(countQueryWithWhere, params);
  
  return {
    data: rows,
    total: count[0].total,
  };
}

