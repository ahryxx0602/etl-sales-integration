import container from '../container/Container.js';
import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function processCsvFiles() {
  const csvDir = config.CSV_DIR;
  const files = fs.readdirSync(csvDir).filter(f => f.endsWith('.csv'));

  if (files.length === 0) {
    console.log('No CSV files found in', csvDir);
    return;
  }

  console.log(`Found ${files.length} CSV file(s)`);

  const etlService = await container.get('etlService');

  for (const file of files) {
    const filePath = path.join(csvDir, file);
    console.log(`\nProcessing: ${file}`);

    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      
      const records = await new Promise((resolve, reject) => {
        parse(fileContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        }, (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });

      const result = await etlService.processCsv(records, file);
      
      console.log(`  Extracted: ${result.extracted}`);
      console.log(`  Valid: ${result.valid}`);
      console.log(`  Invalid: ${result.invalid}`);
      console.log(`  Loaded: ${result.loaded}`);
      console.log(`  Errors: ${result.errors}`);
    } catch (error) {
      console.error(`  Error processing ${file}:`, error.message);
    }
  }
}

processCsvFiles()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
