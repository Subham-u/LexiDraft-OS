/**
 * Swagger configuration for LexiDraft API documentation
 */
import swaggerJSDoc from 'swagger-jsdoc';
import { version } from '../../../package.json';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'LexiDraft API Documentation',
    version,
    description: 'API documentation for LexiDraft - An AI-powered legal contract platform',
    license: {
      name: 'Private',
      url: 'https://lexidraft.com/license',
    },
    contact: {
      name: 'LexiDraft Support',
      url: 'https://lexidraft.com/support',
      email: 'support@lexidraft.com',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'Legacy API endpoints (for frontend compatibility)',
    },
    {
      url: '/user',
      description: 'User Service API',
    },
    {
      url: '/contract',
      description: 'Contract Service API',
    },
    {
      url: '/payment',
      description: 'Payment Service API',
    },
    {
      url: '/ai',
      description: 'AI Service API',
    },
    {
      url: '/lawyer',
      description: 'Lawyer Service API',
    },
    {
      url: '/consultation',
      description: 'Consultation Service API',
    },
    {
      url: '/template',
      description: 'Template Service API',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  tags: [
    {
      name: 'Auth',
      description: 'Authentication and authorization operations',
    },
    {
      name: 'Users',
      description: 'User operations',
    },
    {
      name: 'Contracts',
      description: 'Contract management operations',
    },
    {
      name: 'Templates',
      description: 'Contract template operations',
    },
    {
      name: 'Lawyers',
      description: 'Lawyer marketplace operations',
    },
    {
      name: 'Consultations',
      description: 'Legal consultation operations',
    },
    {
      name: 'Payments',
      description: 'Payment operations',
    },
    {
      name: 'AI',
      description: 'AI integration operations',
    },
  ],
};

const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: [
    './server/services/*/src/routes.ts',
    './server/services/api-routes.ts',
    './server/shared/models/*.ts',
    './server/shared/schema.ts',
  ],
};

export const swaggerSpec = swaggerJSDoc(options);