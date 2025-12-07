import { getOldDbPool, getNewDbPool } from '../config/database.js';

async function testConnections() {
  console.log('Testing database connections...\n');

  // Test Old DB
  try {
    console.log('Testing old_db connection...');
    const oldPool = await getOldDbPool();
    const [oldResult] = await oldPool.query('SELECT DATABASE() as db, NOW() as time');
    console.log('  old_db connected successfully!');
    console.log(`   Database: ${oldResult[0].db}`);
    console.log(`   Server time: ${oldResult[0].time}`);
    
    // Test tables
    const [oldTables] = await oldPool.query('SHOW TABLES');
    console.log(`   Tables found: ${oldTables.length}`);
    oldTables.forEach(t => console.log(`     - ${Object.values(t)[0]}`));
  } catch (error) {
    console.error(' old_db connection failed:', error.message);
  }

  console.log('');

  // Test New DB
  try {
    console.log('Testing new_db connection...');
    const newPool = await getNewDbPool();
    const [newResult] = await newPool.query('SELECT DATABASE() as db, NOW() as time');
    console.log('  new_db connected successfully!');
    console.log(`   Database: ${newResult[0].db}`);
    console.log(`   Server time: ${newResult[0].time}`);
    
    // Test tables
    const [newTables] = await newPool.query('SHOW TABLES');
    console.log(`   Tables found: ${newTables.length}`);
    newTables.forEach(t => console.log(`     - ${Object.values(t)[0]}`));
  } catch (error) {
    console.error(' new_db connection failed:', error.message);
  }

  console.log('\nDone!');
  process.exit(0);
}

testConnections().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

