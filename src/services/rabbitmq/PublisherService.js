/**
 * Service để publish messages vào RabbitMQ
 */
export class PublisherService {
  constructor(connectionService, queueService, config, logger) {
    this.connectionService = connectionService;
    this.queueService = queueService;
    this.config = config;
    this.log = logger.child({ name: 'PublisherService' });
  }

  get channel() {
    return this.connectionService.getChannel();
  }

  /**
   * Gửi message vào queue
   * @param {string} routingKey - Routing key (extract.data, transform.data, load.data, complete.job)
   * @param {object} message - Message object
   * @param {object} options - Options (persistent, priority, etc.)
   */
  async publishMessage(routingKey, message, options = {}) {
    if (!this.connectionService.isReady()) {
      await this.connectionService.connect();
      await this.queueService.setupExchangesAndQueues();
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));
      const defaultOptions = {
        persistent: true,
        timestamp: Date.now(),
        ...options,
      };

      const published = this.channel.publish(
        this.config.RABBITMQ.exchanges.etl,
        routingKey,
        messageBuffer,
        defaultOptions
      );

      if (published) {
        this.log.info({ routingKey, messageSize: messageBuffer.length }, 'Message published');
      } else {
        this.log.warn({ routingKey }, 'Message buffer full, message not published');
      }

      return published;
    } catch (error) {
      this.log.error({ error, routingKey }, 'Error publishing message');
      throw error;
    }
  }

  /**
   * Gửi message vào queue cụ thể (không qua exchange)
   * @param {string} queueName - Tên queue
   * @param {object} message - Message object
   * @param {object} options - Options
   */
  async sendToQueue(queueName, message, options = {}) {
    if (!this.connectionService.isReady()) {
      await this.connectionService.connect();
    }

    try {
      await this.channel.assertQueue(queueName, { durable: true });
      const messageBuffer = Buffer.from(JSON.stringify(message));
      const defaultOptions = {
        persistent: true,
        timestamp: Date.now(),
        ...options,
      };

      const sent = this.channel.sendToQueue(queueName, messageBuffer, defaultOptions);
      
      if (sent) {
        this.log.info({ queueName, messageSize: messageBuffer.length }, 'Message sent to queue');
      } else {
        this.log.warn({ queueName }, 'Message buffer full');
      }

      return sent;
    } catch (error) {
      this.log.error({ error, queueName }, 'Error sending message to queue');
      throw error;
    }
  }
}

