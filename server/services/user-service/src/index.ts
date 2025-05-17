import express from 'express';
import { createLogger } from '../../../shared/utils/logger';
import { config } from './config';
import { routes } from './routes';
import { errorHandler, notFoundHandler } from '../../../shared/middleware/error';

const app = express();
const logger = createLogger('user-service');

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Mount routes
app.use(routes);

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export function startService() {
  const server = app.listen(config.port, () => {
    // The port may be dynamically assigned
    const address = server.address();
    const actualPort = typeof address === 'object' && address ? address.port : config.port;
    
    logger.info(`User service running on port ${actualPort}`);
    
    // Update the config with the assigned port
    config.port = actualPort;
  });
  
  return server;
}

export default app;