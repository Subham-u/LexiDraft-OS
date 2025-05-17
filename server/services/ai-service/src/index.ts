/**
 * AI service entry point
 */
import { config } from './config';
import { routes } from './routes';
import { createLogger } from '../../../shared/utils/logger';

const logger = createLogger('ai-service');

// Export the service configuration and routes
export {
  config,
  routes
};

// Log service initialization
logger.info(`AI service initialized with version ${config.version}`);