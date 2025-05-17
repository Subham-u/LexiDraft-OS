/**
 * Swagger API documentation route
 */
import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../config/swagger';
import { createLogger } from '../utils/logger';

const logger = createLogger('swagger');
const router = Router();

// Serve swagger docs
router.use('/api-docs', swaggerUi.serve);
router.get('/api-docs', swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'LexiDraft API Documentation',
}));

// Serve swagger spec as JSON
router.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

logger.info('Swagger API documentation routes initialized');

export const swaggerRoutes = router;