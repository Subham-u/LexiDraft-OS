/**
 * LexiDraft Server - Main entry point
 */
import express, { Express, Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { initializeFirebaseAdmin } from './services/firebase';
import { createLogger } from './utils/logger';
import { errorHandler } from './middleware/error';
import apiRoutes from './routes';
import * as websocketService from './services/websocket.service';

// Initialize logger
const logger = createLogger('server');

// Import migrations and schema versioning
import { initializeMigrations } from './db/migrations';
import { initSchemaVersioning } from './db/schema-audit';

// Initialize Firebase Admin
try {
  initializeFirebaseAdmin();
  logger.info('Firebase Admin SDK initialized successfully');
} catch (error) {
  logger.error('Failed to initialize Firebase Admin SDK', error);
}

// Initialize database and run migrations
async function initializeDatabase() {
  try {
    // Initialize schema version tracking
    await initSchemaVersioning();
    logger.info('Schema versioning initialized successfully');
    
    // Run migrations
    await initializeMigrations();
    logger.info('Database migrations completed successfully');
  } catch (err) {
    logger.error('Database initialization error', err);
  }
}

// Start database initialization
initializeDatabase();

// Create Express application
const app: Express = express();
const server = http.createServer(app);

// Initialize WebSocket server
const wss = websocketService.initializeWebSocketServer(server);
logger.info('WebSocket server initialized on path: /ws');

// Apply middleware
app.use(cors());
app.use(express.json({ limit: '5mb' })); // Increased limit for contract content
app.use(express.urlencoded({ extended: true }));

// Security headers middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  // Set basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    websocket: {
      connections: websocketService.getConnectionCount()
    }
  });
});

// WebSocket connection status endpoint
app.get('/api/ws/status', (req: Request, res: Response) => {
  const connections = websocketService.getConnectionCount();
  res.json({
    success: true,
    status: 'active',
    connections
  });
});

// Import our direct API routes
import directApiRoutes from './api.routes';

// Mount API routes
app.use(directApiRoutes);
app.use('/api', apiRoutes);

// Development middleware
if (process.env.NODE_ENV === 'development') {
  // API Routes should go first
  
  // For all non-API routes, we'll generate a minimal HTML page that
  // acts as an entry point for the frontend app with properly configured paths
  app.use('*', (req, res, next) => {
    // Skip API and WebSocket routes
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/ws')) {
      return next();
    }
    
    logger.info(`Serving frontend for path: ${req.originalUrl}`);
    
    // For development, create a minimal HTML that bootstraps the React application
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>LexiDraft</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            .loading-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              background-color: #f8f9fa;
            }
            
            .loading-spinner {
              border: 5px solid #f3f3f3;
              border-top: 5px solid #3498db;
              border-radius: 50%;
              width: 50px;
              height: 50px;
              animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            
            .loading-text {
              margin-top: 20px;
              font-size: 18px;
              color: #333;
            }
          </style>
        </head>
        <body>
          <div id="root">
            <div class="loading-container">
              <div class="loading-spinner"></div>
              <div class="loading-text">Loading LexiDraft...</div>
            </div>
          </div>
        </body>
      </html>
    `);
  });
  
  logger.info('Frontend serving middleware active');
}

// Global error handler
app.use(errorHandler);

// Start the server
const PORT = parseInt(process.env.PORT || '3000', 10);

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server is running on port ${PORT}`);
    logger.info(`WebSocket server ready for real-time notifications and chat`);
  });
}

export { app, server };