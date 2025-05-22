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
import adapterRoutes from "./routes/adapter.routes";
import analysisRoutes from "./routes/analysis.routes";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";

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
app.use('/api', adapterRoutes);
app.use('/api', analysisRoutes);
app.use('/api',authRoutes);
app.use('/api',userRoutes);
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
// import directApiRoutes from './api.routes';

// Mount API routes
// app.use(directApiRoutes);
app.use('/api', apiRoutes);

// Development middleware
if (process.env.NODE_ENV === 'development') {
  // Serve a simple HTML page with basic LexiDraft frontend for development
  app.use('*', (req, res, next) => {
    // Skip API and WebSocket routes
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/ws')) {
      return next();
    }
    
    logger.info(`Serving development frontend for path: ${req.originalUrl}`);
    
    // Send a basic HTML page that links to our frontend components
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
              background-color: #f8f9fa;
              color: #333;
            }
            
            .container {
              max-width: 1200px;
              margin: 0 auto;
              padding: 2rem;
            }
            
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 1rem 0;
              border-bottom: 1px solid #e2e8f0;
              margin-bottom: 2rem;
            }
            
            .logo {
              font-size: 1.5rem;
              font-weight: bold;
              color: #4a5568;
            }
            
            .logo span {
              color: #3182ce;
            }
            
            .features {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
              gap: 2rem;
              margin-top: 2rem;
            }
            
            .feature-card {
              background-color: white;
              border-radius: 8px;
              padding: 1.5rem;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              transition: transform 0.2s;
            }
            
            .feature-card:hover {
              transform: translateY(-5px);
            }
            
            .feature-title {
              font-size: 1.25rem;
              margin-bottom: 1rem;
              color: #2d3748;
            }
            
            .feature-desc {
              color: #718096;
              line-height: 1.6;
            }
            
            .api-section {
              margin-top: 3rem;
              background-color: white;
              border-radius: 8px;
              padding: 1.5rem;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            
            .api-title {
              font-size: 1.5rem;
              margin-bottom: 1rem;
              color: #2d3748;
            }
            
            .endpoint {
              background-color: #f7fafc;
              padding: 1rem;
              border-radius: 4px;
              margin-bottom: 1rem;
              border-left: 4px solid #3182ce;
            }
            
            .endpoint-url {
              font-family: monospace;
              font-weight: bold;
              margin-bottom: 0.5rem;
              color: #4a5568;
            }
            
            .endpoint-desc {
              color: #718096;
            }
            
            .footer {
              margin-top: 3rem;
              text-align: center;
              padding: 1rem 0;
              color: #718096;
              font-size: 0.875rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Lexi<span>Draft</span></div>
            </div>
            
            <div>
              <h1>LexiDraft Development Server</h1>
              <p>This is the development environment for LexiDraft, an AI-powered legal contract platform.</p>
            </div>
            
            <div class="features">
              <div class="feature-card">
                <h2 class="feature-title">AI Contract Analysis</h2>
                <p class="feature-desc">
                  Use OpenAI-powered analysis to review contracts for issues, missing clauses, and compliance problems.
                </p>
              </div>
              
              <div class="feature-card">
                <h2 class="feature-title">Real-time Notifications</h2>
                <p class="feature-desc">
                  WebSocket-based notification system for instant updates on contract changes, comments, and reviews.
                </p>
              </div>
              
              <div class="feature-card">
                <h2 class="feature-title">Secure Chat</h2>
                <p class="feature-desc">
                  Real-time chat functionality for client-lawyer communication and team collaboration.
                </p>
              </div>
            </div>
            
            <div class="api-section">
              <h2 class="api-title">Available API Endpoints</h2>
              
              <div class="endpoint">
                <div class="endpoint-url">POST /api/contracts/analysis</div>
                <div class="endpoint-desc">Analyze a contract for issues, risks, and improvements</div>
              </div>
              
              <div class="endpoint">
                <div class="endpoint-url">GET /api/contracts/analysis/:id</div>
                <div class="endpoint-desc">Retrieve analysis results by ID</div>
              </div>
              
              <div class="endpoint">
                <div class="endpoint-url">WebSocket /ws</div>
                <div class="endpoint-desc">Real-time notifications and chat functionality</div>
              </div>
            </div>
            
            <div class="footer">
              &copy; ${new Date().getFullYear()} LexiDraft. All rights reserved.
            </div>
          </div>
        </body>
      </html>
    `);
  });
  
  logger.info('Development frontend serving middleware active');
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