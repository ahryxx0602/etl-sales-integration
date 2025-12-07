import amqp from 'amqplib';

/**
 * Service quản lý kết nối RabbitMQ
 */
export class ConnectionService {
  constructor(config, logger) {
    this.config = config;
    this.log = logger.child({ name: 'ConnectionService' });
    this.connection = null;
    this.channel = null;
    this.isConnected = false;
  }

  /**
   * Kết nối đến RabbitMQ server
   */
  async connect() {
    if (this.isConnected && this.connection) {
      return this.connection;
    }

    try {
      this.log.info({ url: this.config.RABBITMQ.url }, 'Connecting to RabbitMQ...');
      this.connection = await amqp.connect(this.config.RABBITMQ.url);
      this.channel = await this.connection.createChannel();
      this.isConnected = true;

      // Xử lý lỗi kết nối
      this.connection.on('error', (err) => {
        this.log.error({ error: err }, 'RabbitMQ connection error');
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        this.log.warn('RabbitMQ connection closed');
        this.isConnected = false;
      });

      this.log.info('RabbitMQ connected successfully');
      return this.connection;
    } catch (error) {
      this.log.error({ error }, 'Failed to connect to RabbitMQ');
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Đóng kết nối
   */
  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      this.isConnected = false;
      this.log.info('RabbitMQ connection closed');
    } catch (error) {
      this.log.error({ error }, 'Error closing RabbitMQ connection');
      throw error;
    }
  }

  /**
   * Kiểm tra kết nối
   */
  isReady() {
    return this.isConnected && this.connection && this.channel;
  }

  /**
   * Get channel (read-only access)
   */
  getChannel() {
    return this.channel;
  }

  /**
   * Get connection
   */
  getConnection() {
    return this.connection;
  }
}

