/**
 * Gateway service configuration
 */
import { SERVER_CONFIG, SERVICES } from '../../../shared/config/service';

export const config = {
  port: SERVER_CONFIG.port,
  host: SERVER_CONFIG.host,
  reusePort: SERVER_CONFIG.reusePort,
  serviceName: 'gateway-service',
  version: '1.0.0',
  services: SERVICES,
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://lexidraft.com', 'https://app.lexidraft.com'] 
      : '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-dev-uid']
  }
};