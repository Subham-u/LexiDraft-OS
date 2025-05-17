/**
 * Gateway service entry point
 * Coordinates and proxies requests to all microservices
 */
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { createLogger } from '../../../shared/utils/logger';
import { setupVite, serveStatic } from '../../../vite';
import { config } from './config';
import { routes, registerServiceProxies } from './routes';
import { errorHandler } from '../../../shared/middleware/error';
import { logServiceStatus } from '../../../shared/config';

const app = express();
const logger = createLogger('gateway-service');

// Service location registry (will be populated as services start)
const serviceLocations: Record<string, string> = {};

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS configuration
app.use(cors(config.cors));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Capture JSON responses for logging
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // Log completed requests
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // Include response body in logs (truncated)
      if (capturedJsonResponse) {
        const responseStr = JSON.stringify(capturedJsonResponse);
        logLine += ` :: ${responseStr.length > 70 ? responseStr.slice(0, 69) + "…" : responseStr}`;
      }

      logger.info(logLine);
    }
  });

  next();
});

// Log service availability
logServiceStatus();

// Create HTTP server
const server = createServer(app);

// Register the initial routes
app.use('/api', routes);

// Register a service in the gateway
export function registerService(name: string, host: string, port: number) {
  const url = `http://${host}:${port}`;
  serviceLocations[name] = url;
  logger.info(`Registered service ${name} at ${url}`);
  
  // Update proxy routes whenever a new service is registered
  registerServiceProxies(serviceLocations);
}

// Global error handler
app.use(errorHandler);

// Setup Vite middleware for development or serve static files in production
if (process.env.NODE_ENV === "development") {
  setupVite(app, server)
    .then(() => {
      logger.info("Vite middleware setup complete");
    })
    .catch(err => {
      logger.error("Vite middleware setup failed", { error: err.message });
      process.exit(1);
    });
} else {
  serveStatic(app);
  logger.info("Static file serving enabled for production");
}

// Start the gateway service
export function startGateway() {
  server.listen({
    port: config.port,
    host: config.host,
    reusePort: config.reusePort,
  }, () => {
    logger.info(`Gateway service listening on ${config.host}:${config.port}`);
  });
  
  return server;
}

export default {
  app,
  server,
  startGateway,
  registerService
};