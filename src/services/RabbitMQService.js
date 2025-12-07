/**
 * Main RabbitMQ Service - Facade pattern để orchestrate các services con
 */
import { ConnectionService } from './rabbitmq/ConnectionService.js';
import { QueueService } from './rabbitmq/QueueService.js';
import { PublisherService } from './rabbitmq/PublisherService.js';

export class RabbitMQService {
  constructor(config, logger) {
    this.connectionService = new ConnectionService(config, logger);
    this.queueService = new QueueService(this.connectionService, config, logger);
    this.publisherService = new PublisherService(this.connectionService, this.queueService, config, logger);
    this.config = config;
    this.log = logger.child({ name: 'RabbitMQService' });
  }

  /**
   * Kết nối đến RabbitMQ server
   */
  async connect() {
    await this.connectionService.connect();
    await this.queueService.setupExchangesAndQueues();
  }

  /**
   * Đóng kết nối
   */
  async close() {
    return this.connectionService.close();
  }

  /**
   * Kiểm tra kết nối
   */
  isReady() {
    return this.connectionService.isReady();
  }

  /**
   * Get channel (read-only access)
   */
  getChannel() {
    return this.connectionService.getChannel();
  }

  /**
   * Gửi message vào queue
   */
  async publishMessage(routingKey, message, options = {}) {
    return this.publisherService.publishMessage(routingKey, message, options);
  }

  /**
   * Gửi message vào queue cụ thể
   */
  async sendToQueue(queueName, message, options = {}) {
    return this.publisherService.sendToQueue(queueName, message, options);
  }

  /**
   * Consume messages từ queue
   */
  async consumeQueue(queueName, handler, options = {}) {
    if (!this.connectionService.isReady()) {
      await this.connectionService.connect();
      await this.queueService.setupExchangesAndQueues();
    }

    const channel = this.connectionService.getChannel();
    
    try {
      await channel.assertQueue(queueName, { durable: true });
      
      // Set prefetch để xử lý từng message một
      await channel.prefetch(1);

      const defaultOptions = {
        noAck: false,
        ...options,
      };

      await channel.consume(queueName, async (msg) => {
        if (!msg) {
          return;
        }

        try {
          const content = JSON.parse(msg.content.toString());
          this.log.info({ queueName, messageId: msg.properties.messageId }, 'Received message');

          // Xử lý message
          await handler(content, msg);

          // Acknowledge message
          if (!defaultOptions.noAck) {
            channel.ack(msg);
          }
        } catch (error) {
          this.log.error({ error, queueName }, 'Error processing message');
          
          // Nack message và requeue
          if (!defaultOptions.noAck) {
            channel.nack(msg, false, true);
          }
        }
      }, defaultOptions);

      this.log.info({ queueName }, 'Started consuming queue');
    } catch (error) {
      this.log.error({ error, queueName }, 'Error consuming queue');
      throw error;
    }
  }
}
