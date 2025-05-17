/**
 * WebSocket service for real-time features
 */
import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import jsonwebtoken from 'jsonwebtoken';
const { verify } = jsonwebtoken;
import { createLogger } from '../utils/logger';

const logger = createLogger('websocket-service');

// Store active connections
const connections: Map<number, WebSocket[]> = new Map();
const JWT_SECRET = process.env.JWT_SECRET || 'lexidraft-secret-key';

/**
 * Initialize WebSocket server
 */
export function initializeWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  
  wss.on('connection', (ws) => {
    let userId: number | null = null;
    
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        
        // Handle authentication
        if (data.type === 'auth') {
          try {
            const decoded = verify(data.token, JWT_SECRET) as { id: number };
            userId = decoded.id;
            
            // Store connection by user ID
            if (!connections.has(userId)) {
              connections.set(userId, []);
            }
            connections.get(userId)?.push(ws);
            
            // Send confirmation
            ws.send(JSON.stringify({
              type: 'auth_success',
              message: 'Authentication successful'
            }));
            
            logger.info(`User ${userId} connected to WebSocket`);
          } catch (error) {
            ws.send(JSON.stringify({
              type: 'auth_error',
              message: 'Authentication failed'
            }));
            
            logger.warn('WebSocket authentication failed', error);
          }
        }
      } catch (error) {
        logger.error('Error processing WebSocket message', error);
      }
    });
    
    ws.on('close', () => {
      if (userId) {
        // Remove connection from user's connections
        const userConnections = connections.get(userId);
        if (userConnections) {
          const index = userConnections.indexOf(ws);
          if (index !== -1) {
            userConnections.splice(index, 1);
          }
          
          // If no more connections for user, remove from map
          if (userConnections.length === 0) {
            connections.delete(userId);
          }
        }
        
        logger.info(`User ${userId} disconnected from WebSocket`);
      }
    });
    
    // Send initial connection confirmation
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to LexiDraft WebSocket server'
    }));
  });
  
  logger.info('WebSocket server initialized');
  
  return wss;
}

/**
 * Send notification to specific user
 */
export function sendUserNotification(userId: number, data: any) {
  const userConnections = connections.get(userId);
  
  if (userConnections && userConnections.length > 0) {
    const message = JSON.stringify({
      type: 'notification',
      data
    });
    
    userConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
    
    logger.info(`Notification sent to user ${userId}`);
    return true;
  }
  
  logger.info(`User ${userId} not connected to WebSocket`);
  return false;
}

/**
 * Send chat message to specific user
 */
export function sendChatMessage(userId: number, data: any) {
  const userConnections = connections.get(userId);
  
  if (userConnections && userConnections.length > 0) {
    const message = JSON.stringify({
      type: 'chat_message',
      data
    });
    
    userConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
    
    logger.info(`Chat message sent to user ${userId}`);
    return true;
  }
  
  logger.info(`User ${userId} not connected to WebSocket`);
  return false;
}

/**
 * Send typing indicator to specific user
 */
export function sendTypingIndicator(userId: number, data: { roomId: number, userId: number, isTyping: boolean }) {
  const userConnections = connections.get(userId);
  
  if (userConnections && userConnections.length > 0) {
    const message = JSON.stringify({
      type: 'typing_indicator',
      data
    });
    
    userConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
    
    return true;
  }
  
  return false;
}

/**
 * Broadcast message to all connected clients
 */
export function broadcastMessage(data: any) {
  const message = JSON.stringify({
    type: 'broadcast',
    data
  });
  
  connections.forEach((userConnections) => {
    userConnections.forEach((ws: WebSocket) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  });
  
  logger.info('Broadcast message sent to all users');
}

/**
 * Get connection status for a user
 */
export function isUserConnected(userId: number): boolean {
  const userConnections = connections.get(userId);
  return !!(userConnections && userConnections.length > 0);
}

/**
 * Get total number of connected clients
 */
export function getConnectionCount(): number {
  let count = 0;
  connections.forEach((userConnections) => {
    count += userConnections.length;
  });
  return count;
}

/**
 * Get number of unique connected users
 */
export function getUniqueUserCount(): number {
  return connections.size;
}