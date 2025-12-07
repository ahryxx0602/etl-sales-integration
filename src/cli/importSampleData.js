import { getOldDbPool } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importSampleData() {
  console.log('Importing sample data to old_db...\n');

  try {
    const pool = await getOldDbPool();
    
    // Check if data already exists
    const [orders] = await pool.query('SELECT COUNT(*) as count FROM old_orders');
    if (orders[0].count > 0) {
      console.log('  Data already exists in old_orders. Skipping import.');
      console.log(`   Current orders: ${orders[0].count}`);
      process.exit(0);
    }
    
    console.log('Inserting sample data...\n');
    
    // Insert sample orders
    await pool.query(`
      INSERT INTO old_orders (order_code, store_code, customer_phone, order_date) VALUES
      ('ORD001', 'ST001', '0912345678', '2024-01-15 10:30:00'),
      ('ORD002', 'ST002', '0923456789', '2024-01-16 14:20:00'),
      ('ORD003', 'ST001', '0934567890', '2024-01-17 09:15:00')
    `);
    console.log('  Inserted 3 sample orders');
    
    // Insert sample order items
    await pool.query(`
      INSERT INTO old_order_items (order_code, item_sku, item_name, qty, unit_price, currency) VALUES
      ('ORD001', 'SKU001', 'Laptop Dell', '1', '15000000', 'VND'),
      ('ORD001', 'SKU003', 'Tai nghe Bluetooth', '2', '500000', 'VND'),
      ('ORD002', 'SKU002', 'Điện thoại Samsung', '1', '12000000', 'VND'),
      ('ORD003', 'SKU001', 'Laptop Dell', '1', '15000000', 'VND')
    `);
    console.log('  Inserted 4 sample order items');
    
    // Verify
    const [newOrders] = await pool.query('SELECT COUNT(*) as count FROM old_orders');
    const [newItems] = await pool.query('SELECT COUNT(*) as count FROM old_order_items');
    
    console.log('\n📊 Verification:');
    console.log(`   Orders: ${newOrders[0].count}`);
    console.log(`   Order items: ${newItems[0].count}`);
    console.log('\n  Sample data imported successfully!');
    console.log('   You can now run ETL from Old DB.');
    
  } catch (error) {
    console.error(' Error importing sample data:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
  
  process.exit(0);
}

importSampleData().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

