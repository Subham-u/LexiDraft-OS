/**
 * Main entry point for LexiDraft services
 * Initializes and coordinates all microservices
 */
import { createLogger } from '../shared/utils/logger';
import { SERVICES } from '../shared/config/service';
import gatewayService from './gateway-service/src';
import { startService as startUserService } from './user-service/src';

const logger = createLogger('services');

/**
 * Start all microservices and register them with the gateway
 */
export async function startServices() {
  logger.info('Starting LexiDraft microservices...');
  
  // Start the gateway service first
  const gateway = gatewayService.startGateway();
  logger.info(`Gateway service started on port ${SERVICES.gateway.port}`);
  
  // Start the user service
  const userService = startUserService();
  
  // Register services with the gateway as they become available
  userService.on('listening', () => {
    const address = userService.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    
    logger.info(`User service started on port ${port}`);
    gatewayService.registerService('user', '127.0.0.1', port);
  });
  
  // TODO: Add other services as they are implemented
  // const contractService = startContractService();
  // const lawyerService = startLawyerService();
  // etc.
  
  return {
    gateway,
    userService,
    // Add other services here
  };
}

export default {
  startServices
};