import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import etlRoutes from './routes/etlRoutes.js';
import container from './container/Container.js';
import { config } from './config/config.js';
import { errorHandler } from './middleware/errorHandler.js';
import { swaggerSpec } from './config/swagger.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, '..', 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware - log all API requests
app.use('/api/etl', (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/etl', etlRoutes);

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'ETL-RMQ API Documentation',
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root route - render EJS template
app.get('/', (req, res) => {
  try {
    res.render('pages/index');
  } catch (error) {
    console.error('Error rendering index page:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }
});

// Static files - đặt SAU route root để không chặn route /
app.use(express.static(path.resolve(__dirname, '..', 'public')));

// Error handler middleware - phải đặt CUỐI CÙNG sau tất cả routes
app.use(errorHandler);

const PORT = config.PORT;

// Khởi tạo RabbitMQ connection và consumers
async function initializeRabbitMQ() {
  try {
    const rabbitMQService = await container.get('rabbitMQService');
    await rabbitMQService.connect();
    console.log('  RabbitMQ connected successfully');
  } catch (error) {
    console.error(' Failed to connect to RabbitMQ:', error.message);
    console.warn('  Server will continue without RabbitMQ. Some features may not work.');
  }
}

// Health check với RabbitMQ status
app.get('/health/rabbitmq', async (req, res) => {
  try {
    const rabbitMQService = await container.get('rabbitMQService');
    
    // Kiểm tra an toàn để tránh circular reference
    let isReady = false;
    try {
      isReady = Boolean(rabbitMQService?.isReady?.());
    } catch (err) {
      // Nếu isReady() throw error, coi như không connected
      isReady = false;
    }
    
    // Đảm bảo response chỉ chứa plain objects
    const response = {
      status: isReady ? 'connected' : 'disconnected',
      ready: isReady,
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
      status: 'error',
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };
    
    res.status(500).json(errorResponse);
  }
});

app.listen(PORT, async () => {
  console.log(`ETL Server running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api/etl`);
  
  // Khởi tạo RabbitMQ
  await initializeRabbitMQ();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing RabbitMQ connection...');
  try {
    const rabbitMQService = await container.get('rabbitMQService');
    await rabbitMQService.close();
  } catch (error) {
    console.error('Error closing RabbitMQ:', error);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing RabbitMQ connection...');
  try {
    const rabbitMQService = await container.get('rabbitMQService');
    await rabbitMQService.close();
  } catch (error) {
    console.error('Error closing RabbitMQ:', error);
  }
  process.exit(0);
});

export default app;

