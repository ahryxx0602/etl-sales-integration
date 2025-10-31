// src/dev/transformLocal.js
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import pino from 'pino';

const log = pino({ name: 'transformLocal' });

// --- Nơi chứa file đầu vào & đầu ra ---
const inputDir = path.resolve('data');
const outputDir = path.resolve('output');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// --- Load category map (nếu có) ---
const categoryMapPath = path.resolve('./config/category-map.json');
let categoryMap = {};
if (fs.existsSync(categoryMapPath)) {
  categoryMap = JSON.parse(fs.readFileSync(categoryMapPath, 'utf8'));
  log.info(`✅ Loaded category map (${Object.keys(categoryMap).length} entries)`);
} else {
  log.warn('⚠️ No category map found, default category = "Khác"');
}

// --- Helpers ---
function normalizeCurrency(value) {
  if (!value) return 0;
  const v = parseFloat(String(value).replace(/[^\d.-]/g, ''));
  return isNaN(v) ? 0 : +v.toFixed(2);
}

function normalizeDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.includes('/') ? dateStr.split('/') : dateStr.split('-');
  let d;
  if (parts.length >= 3) {
    const [day, month, rest] = parts;
    const [year, time] = rest.split(' ');
    d = new Date(`${year}-${month}-${day} ${time || '00:00'}`);
  } else {
    d = new Date(dateStr);
  }
  return isNaN(d.getTime())
    ? null
    : d.toISOString().slice(0, 19).replace('T', ' ');
}

function mapCategory(item_name = '') {
  const name = item_name.toLowerCase();
  for (const [key, cat] of Object.entries(categoryMap)) {
    if (name.includes(key.toLowerCase())) return cat;
  }
  return 'Khác';
}

// --- Xử lý 1 file CSV ---
async function transformFile(filePath, sourceTag) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (r) => {
        try {
          const order_ts = normalizeDate(r.order_date || r.date);
          const qty = Number(r.qty) || 0;
          const unit_price = normalizeCurrency(r.unit_price || r.price);
          const line_total = +(qty * unit_price).toFixed(2);
          const category = mapCategory(r.item_name || '');
          const order_line_id = `${r.order_id}-${r.item_sku}`;
          const total_price = line_total;

          results.push({
            order_key: `${r.order_id}|${sourceTag}`,
            order_line_id,
            store_code: (r.store_code || '').trim(),
            customer_phone: r.customer_phone || null,
            order_ts,
            item_sku: (r.item_sku || '').trim(),
            item_name: r.item_name || null,
            qty,
            unit_price,
            line_total,
            total_price,
            category,
            currency: (r.currency || 'VND').toUpperCase(),
            source_tag: sourceTag,
          });
        } catch (err) {
          log.error(err, `❌ Error transforming record: ${JSON.stringify(r)}`);
        }
      })
      .on('end', () => {
        log.info(`✅ Transformed ${results.length} rows from ${path.basename(filePath)}`);
        resolve(results);
      })
      .on('error', reject);
  });
}

// --- Hàm chính ---
const files = [
  { name: 'orders_import_oct.csv', tag: 'import' },
  { name: 'orders_pos_oct.csv', tag: 'pos' },
  { name: 'orders_web_oct.csv', tag: 'web' },
];

const allResults = [];
for (const f of files) {
  const fullPath = path.join(inputDir, f.name);
  if (fs.existsSync(fullPath)) {
    const data = await transformFile(fullPath, f.tag);
    allResults.push(...data);
  } else {
    log.warn(`⚠️ File not found: ${fullPath}`);
  }
}

// --- Ghi file kết quả ---
const outputFile = path.join(outputDir, 'transformed_orders_oct.json');
fs.writeFileSync(outputFile, JSON.stringify(allResults, null, 2), 'utf8');
log.info(`🎯 Done! Output written to ${outputFile}`);
