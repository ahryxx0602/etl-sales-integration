import express from 'express';
import container from '../container/Container.js';
import { config } from '../config/config.js';

const router = express.Router();

// RabbitMQ status route
router.get('/status', async (req, res) => {
  try {
    const rabbitMQService = await container.get('rabbitMQService');
    
    // Kiểm tra an toàn để tránh circular reference
    let isReady = false;
    try {
      isReady = Boolean(rabbitMQService?.isReady?.());
    } catch (err) {
      isReady = false;
    }
    
    if (!isReady) {
      return res.json({
        success: false,
        connected: false,
        message: 'RabbitMQ not connected',
        queues: config.RABBITMQ.queues,
        exchange: config.RABBITMQ.exchanges.etl,
      });
    }

    // Lấy channel an toàn
    let channel = null;
    try {
      channel = rabbitMQService.getChannel();
    } catch (err) {
      // Nếu getChannel() throw error, coi như không có channel
      channel = null;
    }
    
    // Kiểm tra channel có tồn tại không
    if (!channel) {
      return res.json({
        success: false,
        connected: false,
        message: 'RabbitMQ channel not available',
        queues: config.RABBITMQ.queues,
        exchange: config.RABBITMQ.exchanges.etl,
      });
    }

    const queues = config.RABBITMQ.queues;
    const queueInfo = {};

    // Lấy thông tin từng queue
    for (const [key, queueName] of Object.entries(queues)) {
      try {
        const queue = await channel.checkQueue(queueName);
        queueInfo[key] = {
          name: queueName,
          messages: queue.messageCount || 0,
          consumers: queue.consumerCount || 0,
        };
      } catch (error) {
        // Chỉ lấy error message để tránh circular reference
        let errorMessage = 'Unknown error';
        try {
          if (error && typeof error === 'object') {
            errorMessage = error.message || String(error) || 'Unknown error';
          } else {
            errorMessage = String(error) || 'Unknown error';
          }
        } catch (e) {
          errorMessage = 'Error occurred but could not extract message';
        }
        queueInfo[key] = {
          name: queueName,
          error: errorMessage,
        };
      }
    }

    // Đảm bảo response chỉ chứa plain objects
    const response = {
      success: true,
      connected: true,
      exchange: config.RABBITMQ.exchanges.etl,
      queues: queueInfo,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    // Chỉ lấy error message để tránh circular reference
    let errorMessage = 'Unknown error';
    try {
      if (error) {
        if (typeof error === 'string') {
          errorMessage = error;
        } else if (error.message) {
          errorMessage = String(error.message);
        } else if (error.toString && typeof error.toString === 'function') {
          errorMessage = error.toString();
        } else {
          errorMessage = 'Unknown error';
        }
      }
    } catch (e) {
      // Nếu vẫn không lấy được message, dùng fallback
      errorMessage = 'Error occurred but could not extract message';
    }
    
    // Đảm bảo response chỉ chứa plain objects
    const errorResponse = {
      success: false,
      connected: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };
    
    res.status(500).json(errorResponse);
  }
});

export default router;

