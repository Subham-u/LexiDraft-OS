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

// Mount API routes
app.use('/api', apiRoutes);

// Global error handler
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server is running on port ${PORT}`);
    logger.info(`WebSocket server ready for real-time notifications and chat`);
  });
}

export { app, server };