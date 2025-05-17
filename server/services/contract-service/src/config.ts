/**
 * Contract service configuration
 */
import { ENV, IS_PRODUCTION } from '../../../shared/config/service';

export const config = {
  port: process.env.CONTRACT_SERVICE_PORT 
    ? parseInt(process.env.CONTRACT_SERVICE_PORT) 
    : 0, // Will be assigned dynamically
  serviceName: 'contract-service',
  version: '1.0.0'
};