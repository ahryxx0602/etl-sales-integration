/**
 * Service để extract dữ liệu từ các nguồn khác nhau
 */
export class ExtractService {
  constructor(oldDbModel, lookupService, rabbitMQService, logger) {
    this.oldDbModel = oldDbModel;
    this.lookupService = lookupService;
    this.rabbitMQService = rabbitMQService;
    this.log = logger.child({ name: 'ExtractService' });
  }

  async extractFromOldDb() {
    this.log.info('Extracting data from old_db...');
    
    try {
      const orders = await this.oldDbModel.getAllOrders();
      this.log.info({ ordersCount: orders.length }, 'Found orders in old_db');
      
      if (orders.length === 0) {
        this.log.warn('No orders found in old_db. Please check if database has data.');
        return [];
      }
      
      // Load reference data vào cache
      await this.lookupService.loadReferenceData();
      
      // Get all order items
      const allOrderItems = [];
      for (const order of orders) {
        const items = await this.oldDbModel.getOrderItemsByOrderCode(order.order_code);
        allOrderItems.push(...items);
      }
      const orderItems = allOrderItems;
      this.log.info({ orderItemsCount: orderItems.length }, 'Found order items');
      
      // Group order items by order_code
      const itemsByOrder = {};
      for (const item of orderItems) {
        if (!itemsByOrder[item.order_code]) {
          itemsByOrder[item.order_code] = [];
        }
        itemsByOrder[item.order_code].push(item);
      }
      
      // Combine orders with their items
      const data = [];
      for (const order of orders) {
        const items = itemsByOrder[order.order_code] || [];
        for (const item of items) {
          const storeName = this.lookupService.lookupStoreName(order.store_code);
          const customer = this.lookupService.lookupCustomer(order.customer_phone);
          const product = this.lookupService.lookupProduct(item.item_sku);
          
          data.push({
            order_code: order.order_code,
            store_code: order.store_code,
            store_name: storeName,
            customer_phone: order.customer_phone,
            customer_name: customer.full_name,
            customer_email: customer.email,
            order_date: order.order_date,
            item_sku: item.item_sku,
            item_name: item.item_name,
            product_name: product.product_name,
            category: product.category,
            qty: item.qty,
            unit_price: item.unit_price,
            currency: item.currency,
            source_type: 'old_db',
            record_id: item.id, // ID từ old_order_items
          });
        }
      }
      
      this.log.info({ count: data.length }, 'Extracted data from old_db');
      
      // Gửi message vào RabbitMQ queue
      try {
        await this.rabbitMQService.publishMessage('extract.old_db', {
          source: 'old_db',
          count: data.length,
          timestamp: new Date().toISOString(),
          data: data.slice(0, 10), // Gửi sample 10 records đầu tiên
        });
      } catch (rmqError) {
        this.log.warn({ error: rmqError }, 'Failed to send extract message to RabbitMQ');
      }
      
      return data;
    } catch (error) {
      this.log.error({ error }, 'Error extracting from old_db');
      throw error;
    }
  }

  async extractFromCsv(csvData, sourceFile) {
    this.log.info({ file: sourceFile }, 'Extracting data from CSV...');
    
    // Load reference data vào cache
    await this.lookupService.loadReferenceData();
    
    // Map và enrich dữ liệu với thông tin từ các bảng tham chiếu
    const data = csvData.map(row => {
      const enriched = this.lookupService.enrichRow(row);
      
      return {
        order_code: row.order_id || row.orderId || row.order_code,
        store_code: enriched.store_code,
        store_name: enriched.store_name,
        customer_phone: enriched.customer_phone,
        customer_name: enriched.customer_name,
        customer_email: enriched.customer_email,
        order_date: row.order_date || row.date,
        item_sku: enriched.item_sku,
        item_name: row.item_name || row.name,
        product_name: enriched.product_name,
        category: enriched.category,
        qty: row.qty,
        unit_price: row.unit_price || row.price,
        currency: row.currency || 'VND',
        source_type: 'csv',
        source_file: sourceFile,
      };
    });
    
    this.log.info({ count: data.length }, 'Extracted data from CSV');
    
    // Gửi message vào RabbitMQ queue
    try {
      await this.rabbitMQService.publishMessage('extract.csv', {
        source: 'csv',
        sourceFile: sourceFile,
        count: data.length,
        timestamp: new Date().toISOString(),
        data: data.slice(0, 10), // Gửi sample 10 records đầu tiên
      });
    } catch (rmqError) {
      this.log.warn({ error: rmqError }, 'Failed to send extract message to RabbitMQ');
    }
    
    return data;
  }

  async extractFromRawOrders() {
    this.log.info('Extracting data from raw_orders...');
    
    // Lấy dữ liệu từ raw_orders
    const rawOrders = await this.oldDbModel.getAllRawOrders();
    
    // Load reference data vào cache
    await this.lookupService.loadReferenceData();
    
    // Map và enrich dữ liệu với thông tin từ các bảng tham chiếu
    const data = rawOrders.map(row => {
      const enriched = this.lookupService.enrichRow(row);
      
      return {
        order_code: row.order_id,
        store_code: enriched.store_code,
        store_name: enriched.store_name,
        customer_phone: enriched.customer_phone,
        customer_name: enriched.customer_name,
        customer_email: enriched.customer_email,
        order_date: row.order_date,
        item_sku: enriched.item_sku,
        item_name: row.item_name,
        product_name: enriched.product_name,
        category: enriched.category,
        qty: row.qty,
        unit_price: row.unit_price,
        currency: row.currency,
        source_type: 'raw_orders',
        source_file: row.source_file,
        record_id: row.id, // ID từ raw_orders
      };
    });
    
    this.log.info({ count: data.length }, 'Extracted data from raw_orders');
    
    return data;
  }
}

