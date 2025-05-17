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

// Serve static files from the client/dist folder in development
if (process.env.NODE_ENV === 'development') {
  // Set up a fallback route to handle client-side routing
  app.use('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/ws')) {
      return next();
    }
    
    // Fallback to index.html for client routes
    logger.info(`Serving frontend for path: ${req.originalUrl}`);
    
    // For development, return a minimal HTML that points to the Vite dev server
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>LexiDraft</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module">
            import RefreshRuntime from 'http://localhost:5173/@react-refresh'
            RefreshRuntime.injectIntoGlobalHook(window)
            window.$RefreshReg$ = () => {}
            window.$RefreshSig$ = () => (type) => type
            window.__vite_plugin_react_preamble_installed__ = true
          </script>
          <script type="module" src="http://localhost:5173/@vite/client"></script>
          <script type="module" src="http://localhost:5173/src/main.tsx"></script>
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