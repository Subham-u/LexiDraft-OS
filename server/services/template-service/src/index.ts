import express from 'express';
import { createLogger } from '../../../shared/utils/logger';
import { config } from './config';
import { routes } from './routes';

const app = express();
const logger = createLogger('service-name');

app.use(express.json());
app.use(routes);

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  logger.error(`Error: ${message}`, { status, stack: err.stack });
  
  res.status(status).json({ 
    success: false, 
    message, 
    status 
  });
});

export function startService() {
  app.listen(config.port, () => {
    logger.info(`Service running on port ${config.port}`);
  });
}

export default app;