import { getOldDbPool, getNewDbPool } from '../config/database.js';

async function checkNewDbData() {
  console.log('🔍 Kiểm tra dữ liệu trong new_db sau khi ETL...\n');
  
  try {
    const oldPool = await getOldDbPool();
    const newPool = await getNewDbPool();
    
    // Lấy dữ liệu từ old_stores
    const [oldStores] = await oldPool.query('SELECT * FROM old_stores ORDER BY store_code');
    
    // Lấy dữ liệu từ new_db stores
    const [newStores] = await newPool.query('SELECT * FROM stores ORDER BY store_code');
    
    // Lấy dữ liệu từ new_db customers
    const [newCustomers] = await newPool.query('SELECT * FROM customers ORDER BY phone');
    
    // Lấy dữ liệu từ new_db products
    const [newProducts] = await newPool.query('SELECT * FROM products ORDER BY sku');
    
    // Lấy dữ liệu từ new_db orders
    const [newOrders] = await newPool.query(`
      SELECT o.*, s.store_name, c.full_name as customer_name
      FROM orders o
      LEFT JOIN stores s ON o.store_id = s.id
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.order_code
      LIMIT 20
    `);
    
    console.log('📦 STORES:');
    console.log('─'.repeat(100));
    console.log(`Tổng số stores trong old_stores: ${oldStores.length}`);
    console.log(`Tổng số stores trong new_db: ${newStores.length}\n`);
    
    // Tạo map để so sánh
    const oldStoreMap = new Map();
    oldStores.forEach(s => {
      const key = s.store_code ? String(s.store_code).trim().toUpperCase() : null;
      if (key) oldStoreMap.set(key, s);
    });
    
    const newStoreMap = new Map();
    newStores.forEach(s => {
      const key = s.store_code ? String(s.store_code).trim().toUpperCase() : null;
      if (key) newStoreMap.set(key, s);
    });
    
    // Kiểm tra từng store
    let missingStoreName = 0;
    let correctStoreName = 0;
    
    console.log('Chi tiết stores:');
    newStores.forEach(store => {
      const key = store.store_code ? String(store.store_code).trim().toUpperCase() : null;
      const oldStore = key ? oldStoreMap.get(key) : null;
      
      const status = store.store_name ? ' ' : '❌';
      if (!store.store_name) missingStoreName++;
      else correctStoreName++;
      
      console.log(`${status} ${(store.store_code || '').padEnd(10)} | New: ${(store.store_name || '(null)').padEnd(30)} | Old: ${oldStore?.store_name || '(not found)'}`);
    });
    
    console.log(`\n  Có store_name: ${correctStoreName}`);
    console.log(` Thiếu store_name: ${missingStoreName}\n`);
    
    console.log('👥 CUSTOMERS:');
    console.log('─'.repeat(100));
    console.log(`Tổng số customers: ${newCustomers.length}`);
    
    let missingCustomerName = 0;
    let hasCustomerName = 0;
    
    newCustomers.slice(0, 10).forEach(customer => {
      const status = customer.full_name ? ' ' : '❌';
      if (!customer.full_name) missingCustomerName++;
      else hasCustomerName++;
      
      console.log(`${status} ${(customer.phone || '').padEnd(15)} | Name: ${customer.full_name || '(null)'} | Email: ${customer.email || '(null)'}`);
    });
    
    if (newCustomers.length > 10) {
      console.log(`... và ${newCustomers.length - 10} customers khác`);
    }
    
    console.log(`\n  Có full_name: ${hasCustomerName}`);
    console.log(` Thiếu full_name: ${missingCustomerName}\n`);
    
    console.log('🛍️  PRODUCTS:');
    console.log('─'.repeat(100));
    console.log(`Tổng số products: ${newProducts.length}`);
    
    let missingProductName = 0;
    let hasProductName = 0;
    let missingCategory = 0;
    let hasCategory = 0;
    
    newProducts.slice(0, 10).forEach(product => {
      const nameStatus = product.product_name ? ' ' : '❌';
      const catStatus = product.category ? ' ' : '❌';
      
      if (!product.product_name) missingProductName++;
      else hasProductName++;
      
      if (!product.category) missingCategory++;
      else hasCategory++;
      
      console.log(`${nameStatus}${catStatus} ${(product.sku || '').padEnd(15)} | Name: ${(product.product_name || '(null)').padEnd(40)} | Category: ${product.category || '(null)'}`);
    });
    
    if (newProducts.length > 10) {
      console.log(`... và ${newProducts.length - 10} products khác`);
    }
    
    console.log(`\n  Có product_name: ${hasProductName} | Thiếu: ${missingProductName}`);
    console.log(`  Có category: ${hasCategory} | Thiếu: ${missingCategory}\n`);
    
    console.log('📋 ORDERS (sample 10 orders đầu tiên):');
    console.log('─'.repeat(100));
    
    newOrders.forEach(order => {
      const storeStatus = order.store_name ? ' ' : '❌';
      const customerStatus = order.customer_name ? ' ' : '❌';
      
      console.log(`${storeStatus}${customerStatus} ${(order.order_code || '').padEnd(10)} | Store: ${(order.store_name || '(null)').padEnd(30)} | Customer: ${order.customer_name || '(null)'}`);
    });
    
    console.log('\n  Kiểm tra hoàn tất!');
    
    process.exit(0);
  } catch (error) {
    console.error(' Lỗi:', error);
    process.exit(1);
  }
}

checkNewDbData();

