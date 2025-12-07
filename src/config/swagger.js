import swaggerJsdoc from 'swagger-jsdoc';

/**
 * Swagger configuration
 */
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ETL-RMQ API',
      version: '1.0.0',
      description: 'API documentation cho hệ thống ETL xử lý và chuẩn hóa dữ liệu bán hàng',
      contact: {
        name: 'ETL Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    tags: [
      {
        name: 'ETL Processing',
        description: 'Các endpoints để xử lý ETL từ các nguồn khác nhau',
      },
      {
        name: 'Data Query',
        description: 'Các endpoints để query dữ liệu từ Data Warehouse',
      },
      {
        name: 'RabbitMQ',
        description: 'Các endpoints để kiểm tra trạng thái RabbitMQ',
      },
    ],
    components: {
      schemas: {
        EtlProcessResult: {
          type: 'object',
          properties: {
            extracted: { type: 'number', description: 'Số records đã extract' },
            valid: { type: 'number', description: 'Số records hợp lệ' },
            invalid: { type: 'number', description: 'Số records không hợp lệ' },
            loaded: { type: 'number', description: 'Số records đã load thành công' },
            errors: { type: 'number', description: 'Số lỗi xảy ra' },
          },
        },
        PaginationResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { type: 'object' } },
            total: { type: 'number' },
            limit: { type: 'number' },
            offset: { type: 'number' },
            hasMore: { type: 'boolean' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'], // Paths to files containing OpenAPI definitions
};

export const swaggerSpec = swaggerJsdoc(options);

