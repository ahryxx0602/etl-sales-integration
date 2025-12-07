/**
 * Service quản lý queues và exchanges
 */
export class QueueService {
  constructor(connectionService, config, logger) {
    this.connectionService = connectionService;
    this.config = config;
    this.log = logger.child({ name: 'QueueService' });
  }

  get channel() {
    return this.connectionService.getChannel();
  }

  /**
   * Xóa queue (nếu cần)
   */
  async deleteQueue(queueName, ifUnused = false, ifEmpty = false) {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    try {
      await this.channel.deleteQueue(queueName, { ifUnused, ifEmpty });
      this.log.info({ queueName }, 'Queue deleted');
      return true;
    } catch (error) {
      // Queue không tồn tại hoặc đã bị xóa
      if (error.code === 404) {
        this.log.info({ queueName }, 'Queue does not exist, skipping delete');
        return false;
      }
      // Queue đang được sử dụng hoặc có messages
      if (error.code === 406) {
        this.log.warn({ queueName }, 'Queue is in use or has messages, cannot delete');
        return false;
      }
      this.log.warn({ error, queueName }, 'Error deleting queue');
      return false;
    }
  }

  /**
   * Tạo queue với xử lý lỗi cấu hình không khớp
   */
  async assertQueueSafe(queueName, options = {}) {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    try {
      await this.channel.assertQueue(queueName, options);
      return true;
    } catch (error) {
      // Lỗi PRECONDITION_FAILED - queue đã tồn tại với cấu hình khác
      if (error.code === 406) {
        this.log.warn({ queueName, error: error.message }, 'Queue exists with different config, attempting to delete and recreate');
        
        try {
          // Xóa queue cũ (force delete - bỏ qua ifUnused và ifEmpty)
          let deleted = await this.deleteQueue(queueName, false, false);
          
          if (!deleted) {
            // Nếu không xóa được, thử unbind tất cả bindings trước
            try {
              // Lấy thông tin queue để xem có bindings nào
              const queueInfo = await this.channel.checkQueue(queueName);
              this.log.info({ queueName, consumers: queueInfo.consumerCount, messages: queueInfo.messageCount }, 'Queue info before delete attempt');
              
              // Thử unbind từ exchange
              try {
                await this.channel.unbindQueue(
                  queueName,
                  this.config.RABBITMQ.exchanges.etl,
                  '*'
                );
              } catch (unbindError) {
                // Ignore unbind errors - có thể không có bindings
              }
            } catch (checkError) {
              // Ignore check errors
            }
            
            // Thử xóa lại sau khi unbind
            deleted = await this.deleteQueue(queueName, false, false);
          }
          
          if (!deleted) {
            // Nếu vẫn không xóa được, có thể queue đang có consumers hoặc messages
            this.log.error({ 
              queueName,
              message: `Queue '${queueName}' exists with different configuration and cannot be deleted. ` +
                       `Please delete it manually via RabbitMQ Management UI (http://localhost:15672) ` +
                       `or stop all consumers first. Server will continue but this queue may not work correctly.`
            }, 'Cannot recreate queue');
            
            // Vẫn cố gắng bind lại với exchange (có thể queue cũ không có binding)
            try {
              // Xác định routing key dựa trên tên queue
              let routingKey = '*';
              if (queueName.includes('extract')) routingKey = 'extract.*';
              else if (queueName.includes('transform')) routingKey = 'transform.*';
              else if (queueName.includes('load')) routingKey = 'load.*';
              else if (queueName.includes('complete')) routingKey = 'complete.*';
              
              await this.channel.bindQueue(
                queueName,
                this.config.RABBITMQ.exchanges.etl,
                routingKey
              );
              this.log.info({ queueName, routingKey }, 'Bound existing queue to exchange');
            } catch (bindError) {
              this.log.warn({ queueName, error: bindError.message }, 'Could not bind existing queue to exchange');
            }
            
            // Không throw error, chỉ log warning và tiếp tục
            this.log.warn({ queueName }, 'Continuing with existing queue (may have incompatible configuration)');
            return false;
          }
          
          // Tạo lại queue với cấu hình mới
          await this.channel.assertQueue(queueName, options);
          this.log.info({ queueName }, 'Queue recreated successfully');
          return true;
        } catch (recreateError) {
          // Nếu lỗi là do không thể xóa queue, đã được xử lý ở trên
          if (recreateError.message && recreateError.message.includes('incompatible')) {
            return false;
          }
          
          this.log.error({ queueName, error: recreateError.message }, 'Failed to recreate queue');
          // Vẫn throw error cho các lỗi khác
          throw recreateError;
        }
      }
      
      // Các lỗi khác
      throw error;
    }
  }

  /**
   * Thiết lập exchanges và queues
   */
  async setupExchangesAndQueues() {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    try {
      // Tạo exchange
      await this.channel.assertExchange(
        this.config.RABBITMQ.exchanges.etl,
        'topic',
        { durable: true }
      );
      this.log.info('Exchange created:', this.config.RABBITMQ.exchanges.etl);

      // Tạo các queues
      const queues = this.config.RABBITMQ.queues;
      
      // Queue: etl.extract - Nhận dữ liệu đã extract
      await this.assertQueueSafe(queues.etlExtract, { durable: true });
      await this.channel.bindQueue(
        queues.etlExtract,
        this.config.RABBITMQ.exchanges.etl,
        'extract.*'
      );

      // Queue: etl.transform - Nhận dữ liệu đã transform
      await this.assertQueueSafe(queues.etlTransform, { durable: true });
      await this.channel.bindQueue(
        queues.etlTransform,
        this.config.RABBITMQ.exchanges.etl,
        'transform.*'
      );

      // Queue: etl.load - Nhận dữ liệu đã load
      await this.assertQueueSafe(queues.etlLoad, { durable: true });
      await this.channel.bindQueue(
        queues.etlLoad,
        this.config.RABBITMQ.exchanges.etl,
        'load.*'
      );

      // Queue: etl.complete - Nhận thông báo hoàn thành
      await this.assertQueueSafe(queues.etlComplete, { durable: true });
      await this.channel.bindQueue(
        queues.etlComplete,
        this.config.RABBITMQ.exchanges.etl,
        'complete.*'
      );

      this.log.info('All queues and exchanges setup completed');
    } catch (error) {
      this.log.error({ error }, 'Error setting up exchanges and queues');
      throw error;
    }
  }
}

