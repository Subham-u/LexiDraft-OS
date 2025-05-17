/**
 * Gateway service routes
 * Acts as a reverse proxy for all microservices
 */
import express, { Router, Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { createLogger } from '../../../shared/utils/logger';
import { config } from './config';
import { SERVICES } from '../../../shared/config/service';
import { checkServiceAvailability } from '../../../shared/config';

const router: Router = express.Router();
const logger = createLogger('gateway-routes');

// Heath check endpoint
router.get('/health', (req, res) => {
  const services = checkServiceAvailability();
  res.json({
    success: true,
    service: 'gateway',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services
  });
});

// Proxy middleware options
const createProxy = (target: string, pathRewrite?: Record<string, string>) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    logLevel: 'warn',
    logProvider: () => logger,
    onProxyReq: (proxyReq, req, res) => {
      // Add proxy headers
      proxyReq.setHeader('X-Forwarded-Path', req.originalUrl);
      
      // Log proxy requests
      logger.debug(`Proxying ${req.method} ${req.originalUrl} to ${target}`);
    },
    onError: (err, req, res) => {
      logger.error(`Proxy error: ${err.message}`, { error: err });
      res.status(500).json({
        success: false,
        error: 'Service Unavailable',
        message: 'The requested service is currently unavailable. Please try again later.'
      });
    }
  });
};

// Dynamically register proxy routes for all services
export function registerServiceProxies(serviceLocations: Record<string, string>) {
  // Register proxy routes for each service
  Object.entries(SERVICES).forEach(([name, service]) => {
    if (name === 'gateway') return;
    
    const targetUrl = serviceLocations[name];
    if (targetUrl) {
      const path = service.path;
      logger.info(`Registering proxy for ${name} service at ${path} -> ${targetUrl}`);
      
      // Create path rewrite rule (strip the service path prefix)
      const pathRewrite = { [`^${path}`]: '' };
      
      // Register the proxy middleware
      router.use(path, createProxy(targetUrl, pathRewrite));
    }
  });
  
  // Default 404 handler for unmatched routes
  router.use((req, res) => {
    logger.warn(`Route not found: ${req.method} ${req.path}`);
    res.status(404).json({
      success: false,
      error: 'Not Found',
      message: 'The requested resource does not exist'
    });
  });
}

export const routes = router;