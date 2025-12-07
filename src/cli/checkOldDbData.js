import { getOldDbPool } from '../config/database.js';

async function checkOldDbData() {
  console.log('Checking data in old_db...\n');

  try {
    const pool = await getOldDbPool();
    
    // Check orders
    const [orders] = await pool.query('SELECT COUNT(*) as count FROM old_orders');
    console.log(`📦 old_orders: ${orders[0].count} records`);
    
    if (orders[0].count > 0) {
      const [sampleOrder] = await pool.query('SELECT * FROM old_orders LIMIT 1');
      console.log('   Sample order:', JSON.stringify(sampleOrder[0], null, 2));
    }
    
    // Check order items
    const [orderItems] = await pool.query('SELECT COUNT(*) as count FROM old_order_items');
    console.log(`📋 old_order_items: ${orderItems[0].count} records`);
    
    if (orderItems[0].count > 0) {
      const [sampleItem] = await pool.query('SELECT * FROM old_order_items LIMIT 1');
      console.log('   Sample item:', JSON.stringify(sampleItem[0], null, 2));
    }
    
    // Check stores
    const [stores] = await pool.query('SELECT COUNT(*) as count FROM old_stores');
    console.log(`🏪 old_stores: ${stores[0].count} records`);
    
    // Check customers
    const [customers] = await pool.query('SELECT COUNT(*) as count FROM old_customers');
    console.log(`👥 old_customers: ${customers[0].count} records`);
    
    // Check products
    const [products] = await pool.query('SELECT COUNT(*) as count FROM old_products');
    console.log(`🛍️  old_products: ${products[0].count} records`);
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`   Total orders: ${orders[0].count}`);
    console.log(`   Total order items: ${orderItems[0].count}`);
    console.log(`   Total stores: ${stores[0].count}`);
    console.log(`   Total customers: ${customers[0].count}`);
    console.log(`   Total products: ${products[0].count}`);
    
    if (orders[0].count === 0) {
      console.log('\n  WARNING: No orders found in old_orders table!');
      console.log('   Please check if the database has been populated with data.');
    }
    
  } catch (error) {
    console.error(' Error checking old_db data:', error.message);
    console.error(error.stack);
  }
  
  process.exit(0);
}

checkOldDbData().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

