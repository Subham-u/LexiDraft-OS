import express, { type Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupVite, serveStatic } from "./vite";
import { SERVER_CONFIG } from "./shared/config";
import { createLogger } from "./shared/utils/logger";
import apiRouter from "./microservices";
import { initializeDatabase } from "./shared/models/db";

// Create logger
const logger = createLogger('server');

// Initialize express app
const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

// Initialize the database
initializeDatabase();

// Create HTTP server
const server: Server = createServer(app);

// Setup API routes using microservices
app.use('/api', apiRouter);

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  logger.error(`Error: ${message}`, { status, stack: err.stack });
  
  res.status(status).json({ 
    success: false, 
    message, 
    status 
  });
});

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

// Start the server
server.listen({
  port: SERVER_CONFIG.port,
  host: SERVER_CONFIG.host,
  reusePort: SERVER_CONFIG.reusePort,
}, () => {
  logger.info(`Server listening on ${SERVER_CONFIG.host}:${SERVER_CONFIG.port}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  
  // Attempt graceful shutdown
  setTimeout(() => {
    process.exit(1);
  }, 1000).unref();
});