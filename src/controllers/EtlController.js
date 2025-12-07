import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';
import createError from 'http-errors';

/**
 * Controller xử lý các request ETL
 * 
 * Chịu trách nhiệm:
 * - Nhận HTTP requests từ routes
 * - Parse và validate input
 * - Gọi ETL service để xử lý
 * - Trả về response JSON
 * 
 * @class EtlController
 */
export class EtlController {
  /**
   * Tạo instance EtlController
   * @param {EtlService} etlService - Service để xử lý ETL
   * @param {Logger} logger - Pino logger instance
   * @param {Object} config - Application config
   */
  constructor(etlService, logger, config) {
    this.etlService = etlService;
    this.log = logger.child({ name: 'EtlController' });
    this.config = config;
  }

  /**
   * Xử lý ETL từ old_db
   * 
   * POST /api/etl/process/old-db
   * 
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @returns {Promise<void>}
   */
  async processOldDb(req, res) {
    this.log.info('Starting ETL from old_db...');
    const result = await this.etlService.processOldDb();
    
    res.json({
      success: true,
      message: 'ETL from old_db completed',
      result: result,
    });
  }

  /**
   * Xử lý ETL từ CSV file upload
   * 
   * POST /api/etl/process/csv
   * 
   * Request body: multipart/form-data với field 'csvfile'
   * 
   * @param {import('express').Request} req - Express request object (có req.file từ multer)
   * @param {import('express').Response} res - Express response object
   * @returns {Promise<void>}
   */
  async processCsv(req, res) {
    if (!req.file) {
      throw createError(400, 'No CSV file uploaded');
    }

    this.log.info({ file: req.file.filename }, 'Processing CSV file...');
    
    const filePath = req.file.path;
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

    const result = await this.etlService.processCsv(records, req.file.originalname);
    
    // Delete uploaded file
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      message: 'CSV processed successfully',
      result: result,
    });
  }

  /**
   * Xử lý ETL từ raw_orders table
   * 
   * POST /api/etl/process/raw-orders
   * 
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @returns {Promise<void>}
   */
  async processRawOrders(req, res) {
    this.log.info('Processing raw_orders...');
    const result = await this.etlService.processRawOrders();
    
    res.json({
      success: true,
      message: 'Raw orders processed',
      result: result,
    });
  }

  /**
   * Xử lý ETL từ tất cả CSV files trong thư mục data
   * 
   * POST /api/etl/process/csv-folder
   * 
   * Đọc tất cả file .csv trong thư mục được cấu hình (config.CSV_DIR)
   * và xử lý từng file một.
   * 
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @returns {Promise<void>}
   */
  async processCsvFromFolder(req, res) {
    const csvDir = this.config.CSV_DIR;
    
    if (!fs.existsSync(csvDir)) {
      throw createError(404, `CSV directory not found: ${csvDir}`);
    }

    const files = fs.readdirSync(csvDir).filter(f => f.endsWith('.csv'));
    
    if (files.length === 0) {
      return res.json({
        success: true,
        message: 'No CSV files found in data folder',
        result: {
          filesProcessed: 0,
          totalExtracted: 0,
          totalValid: 0,
          totalInvalid: 0,
          totalLoaded: 0,
          totalErrors: 0,
        },
      });
    }

      this.log.info({ csvDir, fileCount: files.length }, 'Processing CSV files from folder');

      const results = {
        filesProcessed: 0,
        totalExtracted: 0,
        totalValid: 0,
        totalInvalid: 0,
        totalLoaded: 0,
        totalErrors: 0,
        fileResults: [],
      };

      for (const file of files) {
        const filePath = path.join(csvDir, file);
        this.log.info({ file }, 'Processing CSV file');

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

          const result = await this.etlService.processCsv(records, file);
          
          results.filesProcessed++;
          results.totalExtracted += result.extracted || 0;
          results.totalValid += result.valid || 0;
          results.totalInvalid += result.invalid || 0;
          results.totalLoaded += result.loaded || 0;
          results.totalErrors += result.errors || 0;
          
          results.fileResults.push({
            file,
            extracted: result.extracted || 0,
            valid: result.valid || 0,
            invalid: result.invalid || 0,
            loaded: result.loaded || 0,
            errors: result.errors || 0,
          });
        } catch (error) {
          this.log.error({ error, file }, 'Error processing CSV file');
          results.totalErrors++;
          results.fileResults.push({
            file,
            error: error.message,
          });
        }
      }

    res.json({
      success: true,
      message: `Processed ${results.filesProcessed} CSV file(s)`,
      result: results,
    });
  }
}
