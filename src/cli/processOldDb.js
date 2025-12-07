import container from '../container/Container.js';

async function processOldDb() {
  console.log('Starting ETL from old_db...\n');

  try {
    const etlService = await container.get('etlService');
    const result = await etlService.processOldDb();
    
    console.log('Results:');
    console.log(`  Extracted: ${result.extracted}`);
    console.log(`  Valid: ${result.valid}`);
    console.log(`  Invalid: ${result.invalid}`);
    console.log(`  Loaded: ${result.loaded}`);
    console.log(`  Errors: ${result.errors}`);
    
    console.log('\nDone!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

processOldDb();
