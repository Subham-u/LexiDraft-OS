/**
 * WebSocket routes and handlers for real-time communication
 */
import { Server as HttpServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import WebSocket, { WebSocketServer } from 'ws';
import { createLogger } from '../shared/utils/logger';

const logger = createLogger('websocket-routes');

// Map to store active client connections
const clients = new Map();

/**
 * Initialize WebSocket server
 * @param server HTTP server instance
 */
export function setupWebSocketServer(server: HttpServer) {
  logger.info('Setting up WebSocket server');
  
  // Create WebSocket server
  const wss = new WebSocketServer({ 
    server, 
    path: '/ws' 
  });
  
  // Handle new connections
  wss.on('connection', (ws) => {
    // Generate a unique client ID
    const clientId = uuidv4();
    logger.info(`New WebSocket connection established: ${clientId}`);
    
    // Initial connection setup
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle joining a consultation room
        if (data.type === 'join') {
          const roomId = data.consultationId;
          clients.set(clientId, { ws, roomId, userId: data.userId });
          
          logger.info(`Client ${clientId} joined consultation room ${roomId}`);
          
          // Notify client they've joined successfully
          ws.send(JSON.stringify({
            type: 'joined',
            roomId,
            success: true
          }));
        }
        
        // Handle chat messages
        else if (data.type === 'message') {
          const roomId = data.consultationId;
          const message = {
            id: uuidv4(),
            senderId: data.userId,
            content: data.content,
            timestamp: new Date().toISOString(),
            type: data.messageType || 'text',
            fileUrl: data.fileUrl,
            fileName: data.fileName
          };
          
          logger.info(`Message received in room ${roomId} from user ${data.userId}`);
          
          // Broadcast to all clients in the same room
          clients.forEach((client, id) => {
            if (client.roomId === roomId && client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(JSON.stringify({
                type: 'newMessage',
                message
              }));
            }
          });
        }
        
        // Handle WebRTC signaling for video calls
        else if (data.type === 'videoSignal') {
          const { to, from, signal } = data;
          
          logger.info(`Video signal from ${from} to ${to}`);
          
          // Find the recipient client and send the signal
          clients.forEach((client, id) => {
            if (client.userId === to && client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(JSON.stringify({
                type: 'videoSignal',
                from,
                signal
              }));
            }
          });
        }
      } catch (err) {
        logger.error('WebSocket message error:', err);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      logger.info(`Client ${clientId} disconnected`);
      clients.delete(clientId);
    });
  });
  
  logger.info('WebSocket server setup complete');
  
  return wss;
}