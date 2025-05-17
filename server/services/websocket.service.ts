/**
 * WebSocket service for real-time communication
 */
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { createLogger } from '../utils/logger';
import jwt from 'jsonwebtoken';

// Define the JWT user interface
interface JwtUser {
  id: number;
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
}

const logger = createLogger('websocket-service');

// Connection store by user ID
const connections: Map<number, WebSocket[]> = new Map();

// Initialize WebSocket server
export function initializeWebSocketServer(server: http.Server): WebSocketServer {
  logger.info('Initializing WebSocket server');
  
  const wss = new WebSocketServer({ 
    server, 
    path: '/ws',
    clientTracking: true 
  });
  
  // Handle new connections
  wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
    handleConnection(ws, req);
  });
  
  return wss;
}

// Handle a new WebSocket connection
function handleConnection(ws: WebSocket, req: http.IncomingMessage) {
  try {
    // Parse the authentication token from query params
    if (!req.url) {
      logger.warn('WebSocket connection attempted without URL');
      ws.close(4000, 'Invalid request');
      return;
    }
    
    // Use a safe URL parsing approach
    let token: string | null = null;
    try {
      // Handle URL parsing safely
      const urlString = `http://${req.headers.host || 'localhost'}${req.url}`;
      const parsedUrl = new URL(urlString);
      token = parsedUrl.searchParams.get('token');
    } catch (error) {
      logger.warn('Error parsing WebSocket URL', error);
      ws.close(4000, 'Invalid request URL');
      return;
    }
    
    // No token provided
    if (!token) {
      logger.warn('WebSocket connection attempted without authentication token');
      ws.close(4001, 'Authentication required');
      return;
    }
    
    // Verify token and extract user
    const secret = process.env.JWT_SECRET || 'default-development-secret';
    const user = jwt.verify(token, secret) as JwtUser;
    
    if (!user || !user.id) {
      logger.warn('WebSocket connection attempted with invalid token');
      ws.close(4003, 'Invalid authentication token');
      return;
    }
    
    const userId = user.id;
    logger.info(`User ${userId} connected to WebSocket`);
    
    // Store connection by user ID
    if (!connections.has(userId)) {
      connections.set(userId, []);
    }
    const userConnections = connections.get(userId);
    if (userConnections) {
      userConnections.push(ws);
    }
    
    // Send a welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to LexiDraft realtime server',
      userId
    }));
    
    // Handle connection close
    ws.on('close', () => {
      logger.info(`User ${userId} disconnected from WebSocket`);
      
      // Remove connection from store
      const userConnections = connections.get(userId) || [];
      const index = userConnections.indexOf(ws);
      if (index !== -1) {
        userConnections.splice(index, 1);
      }
      
      if (userConnections.length === 0) {
        connections.delete(userId);
      }
    });
    
    // Handle incoming messages
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        logger.info(`Received message from user ${userId}: ${data.type}`);
        
        // Handle heartbeat messages to keep connection alive
        if (data.type === 'heartbeat') {
          ws.send(JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          }));
        }
      } catch (error) {
        logger.error('Error parsing WebSocket message', error);
      }
    });
    
    // Handle errors
    ws.on('error', (error) => {
      logger.error(`WebSocket error for user ${userId}:`, error);
    });
    
  } catch (error) {
    logger.error('Error handling WebSocket connection', error);
    ws.close(4000, 'Internal server error');
  }
}

/**
 * Send a notification to a specific user
 */
export function sendUserNotification(userId: number, notification: any) {
  try {
    const userConnections = connections.get(userId) || [];
    
    if (userConnections.length === 0) {
      logger.info(`User ${userId} is not connected, notification will be stored only`);
      return false;
    }
    
    logger.info(`Sending notification to user ${userId}, ${userConnections.length} active connections`);
    
    // Send notification to all user connections
    const message = JSON.stringify({
      type: 'notification',
      data: notification
    });
    
    userConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
    
    return true;
  } catch (error) {
    logger.error(`Error sending notification to user ${userId}:`, error);
    return false;
  }
}

/**
 * Send a chat message to specific users
 */
export function sendChatMessage(userIds: number[], message: any) {
  try {
    let deliveredToSomeone = false;
    
    // Send to each recipient
    userIds.forEach(userId => {
      const userConnections = connections.get(userId) || [];
      
      if (userConnections.length === 0) {
        logger.info(`User ${userId} is not connected, chat message will be stored only`);
        return;
      }
      
      logger.info(`Sending chat message to user ${userId}, ${userConnections.length} active connections`);
      
      const payload = JSON.stringify({
        type: 'chat',
        data: message
      });
      
      userConnections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(payload);
          deliveredToSomeone = true;
        }
      });
    });
    
    return deliveredToSomeone;
  } catch (error) {
    logger.error(`Error sending chat message:`, error);
    return false;
  }
}

/**
 * Broadcast a message to all connected users
 */
export function broadcastMessage(message: any) {
  try {
    let recipientCount = 0;
    
    const payload = JSON.stringify({
      type: 'broadcast',
      data: message
    });
    
    // Iterate through all connections
    connections.forEach((userConnections, userId) => {
      userConnections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(payload);
          recipientCount++;
        }
      });
    });
    
    logger.info(`Broadcast message sent to ${recipientCount} connections`);
    return recipientCount > 0;
  } catch (error) {
    logger.error('Error broadcasting message:', error);
    return false;
  }
}

/**
 * Get active connection count
 */
export function getActiveConnectionCount(): { total: number, users: number } {
  let totalConnections = 0;
  const uniqueUsers = connections.size;
  
  connections.forEach(userConnections => {
    totalConnections += userConnections.filter(ws => ws.readyState === WebSocket.OPEN).length;
  });
  
  return {
    total: totalConnections,
    users: uniqueUsers
  };
}