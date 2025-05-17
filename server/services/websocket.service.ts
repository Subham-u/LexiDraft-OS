import WebSocket, { WebSocketServer } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { notifications } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'lexidraft-secret-key';

// Connected clients map
interface ConnectedClient {
  ws: WebSocket;
  userId: number;
  authenticated: boolean;
}

const clients: Map<WebSocket, ConnectedClient> = new Map();

export function setupWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');
    
    // Add to clients map as unauthenticated initially
    clients.set(ws, { ws, userId: 0, authenticated: false });

    // Handle messages from clients
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'authenticate') {
          // Authenticate the connection
          handleAuthentication(ws, data.token);
        } else if (data.type === 'ping') {
          // Simple ping/pong for connection health checks
          ws.send(JSON.stringify({ type: 'pong' }));
        }
        // Add other message types as needed
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      console.log('WebSocket connection closed');
      clients.delete(ws);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'info',
      message: 'Connected to LexiDraft WebSocket server. Please authenticate.'
    }));
  });

  return wss;
}

// Authenticate a WebSocket connection
function handleAuthentication(ws: WebSocket, token: string) {
  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    
    // Update client record with authenticated status
    const client = clients.get(ws);
    if (client) {
      client.authenticated = true;
      client.userId = decoded.userId;
      clients.set(ws, client);
      
      // Send success message
      ws.send(JSON.stringify({
        type: 'auth_success',
        userId: decoded.userId
      }));
      
      console.log(`User ${decoded.userId} authenticated via WebSocket`);
    }
  } catch (error) {
    console.error('Authentication error:', error);
    
    // Send auth failure message
    ws.send(JSON.stringify({
      type: 'auth_error',
      message: 'Authentication failed'
    }));
  }
}

// Send notification to a specific user
export async function sendNotificationToUser(userId: number, notification: any) {
  // Store notification in database
  try {
    await db.insert(notifications).values({
      userId,
      title: notification.title,
      message: notification.message,
      type: notification.type || 'info',
      read: false,
      actionUrl: notification.actionUrl,
    });
    
    // Find all connections for this user and send notification
    for (const [_, client] of clients.entries()) {
      if (client.authenticated && client.userId === userId) {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify({
            type: 'notification',
            notification
          }));
        }
      }
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

// Send notification to all authenticated users
export async function broadcastNotification(notification: any) {
  for (const [_, client] of clients.entries()) {
    if (client.authenticated && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({
        type: 'notification',
        notification
      }));
    }
  }
}

// Send a message to a specific user
export function sendMessageToUser(userId: number, message: any) {
  for (const [_, client] of clients.entries()) {
    if (client.authenticated && client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }
}

// Get connected user count
export function getConnectedUserCount(): number {
  let count = 0;
  for (const [_, client] of clients.entries()) {
    if (client.authenticated) {
      count++;
    }
  }
  return count;
}

// Check if a user is connected
export function isUserConnected(userId: number): boolean {
  for (const [_, client] of clients.entries()) {
    if (client.authenticated && client.userId === userId) {
      return true;
    }
  }
  return false;
}