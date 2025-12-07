/**
 * Dependency Injection Container
 * Quản lý và cung cấp các dependencies cho toàn bộ ứng dụng
 */
import { OldDbModel } from '../models/OldDbModel.js';
import { NewDbModel } from '../models/NewDbModel.js';
import { TransformService } from '../services/TransformService.js';
import { ValidationService } from '../services/validation/ValidationService.js';
import { LookupService } from '../services/LookupService.js';
import { RabbitMQService } from '../services/RabbitMQService.js';
import { EtlService } from '../services/etl/EtlService.js';
import { EtlController } from '../controllers/EtlController.js';
import { DataController } from '../controllers/DataController.js';
import { getOldDbPool, getNewDbPool } from '../config/database.js';
import { config } from '../config/config.js';
import pino from 'pino';

class Container {
  constructor() {
    this.services = new Map();
    this.singletons = new Map();
  }

  /**
   * Đăng ký một service vào container
   * @param {string} name - Tên service
   * @param {Function} factory - Factory function để tạo instance
   * @param {boolean} singleton - Có phải singleton không
   */
  register(name, factory, singleton = true) {
    this.services.set(name, { factory, singleton });
  }

  /**
   * Lấy một service từ container
   * @param {string} name - Tên service
   * @returns {Promise|*} Service instance (Promise nếu factory là async, hoặc value nếu sync)
   */
  async get(name) {
    const service = this.services.get(name);
    
    if (!service) {
      throw new Error(`Service '${name}' not found in container`);
    }

    // Nếu là singleton và đã có instance, trả về instance đó
    if (service.singleton && this.singletons.has(name)) {
      const cached = this.singletons.get(name);
      // Nếu là Promise, await nó
      return cached instanceof Promise ? await cached : cached;
    }

    // Tạo instance mới (factory function nhận container instance làm tham số)
    const instance = service.factory(this);

    // Nếu là singleton, lưu lại
    if (service.singleton) {
      this.singletons.set(name, instance);
    }

    // Nếu là Promise, await nó
    return instance instanceof Promise ? await instance : instance;
  }

  /**
   * Kiểm tra service đã được đăng ký chưa
   * @param {string} name - Tên service
   * @returns {boolean}
   */
  has(name) {
    return this.services.has(name);
  }

  /**
   * Xóa một service (dùng cho testing)
   * @param {string} name - Tên service
   */
  remove(name) {
    this.services.delete(name);
    this.singletons.delete(name);
  }

  /**
   * Xóa tất cả services (dùng cho testing)
   */
  clear() {
    this.services.clear();
    this.singletons.clear();
  }
}

// Tạo container instance
const container = new Container();

// Đăng ký các dependencies
container.register('config', () => config, true);
// Logger phải được tạo trực tiếp, không qua factory function
const logger = pino({ name: 'App' });
container.register('logger', () => logger, true);

// Database pools - Lazy initialization
container.register('oldDbPool', async (c) => {
  if (!c.singletons.has('oldDbPool')) {
    c.singletons.set('oldDbPool', await getOldDbPool());
  }
  return c.singletons.get('oldDbPool');
}, true);

container.register('newDbPool', async (c) => {
  if (!c.singletons.has('newDbPool')) {
    c.singletons.set('newDbPool', await getNewDbPool());
  }
  return c.singletons.get('newDbPool');
}, true);

// Models - Lazy initialization với async pools
container.register('oldDbModel', async (c) => {
  const pool = await c.get('oldDbPool');
  return new OldDbModel(pool);
}, true);

container.register('newDbModel', async (c) => {
  const pool = await c.get('newDbPool');
  return new NewDbModel(pool);
}, true);

// Services
container.register('validationService', (c) => {
  return new ValidationService();
}, true);

container.register('transformService', async (c) => {
  const validationService = await c.get('validationService');
  return new TransformService(validationService);
}, true);

container.register('lookupService', async (c) => {
  const oldDbModel = await c.get('oldDbModel');
  const newDbModel = await c.get('newDbModel');
  return new LookupService(oldDbModel, newDbModel);
}, true);

container.register('rabbitMQService', async (c) => {
  const config = await c.get('config');
  const logger = await c.get('logger');
  return new RabbitMQService(config, logger);
}, true);

container.register('etlService', async (c) => {
  const oldDbModel = await c.get('oldDbModel');
  const newDbModel = await c.get('newDbModel');
  const transformService = await c.get('transformService');
  const lookupService = await c.get('lookupService');
  const rabbitMQService = await c.get('rabbitMQService');
  const logger = await c.get('logger');
  
  return new EtlService(
    oldDbModel,
    newDbModel,
    transformService,
    lookupService,
    rabbitMQService,
    logger
  );
}, true);

// Controllers
container.register('etlController', async (c) => {
  const etlService = await c.get('etlService');
  const logger = await c.get('logger');
  const config = await c.get('config');
  
  return new EtlController(etlService, logger, config);
}, true);

container.register('dataController', async (c) => {
  const newDbModel = await c.get('newDbModel');
  const logger = await c.get('logger');
  
  return new DataController(newDbModel, logger);
}, true);

export default container;
export { Container };

