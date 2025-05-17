/**
 * WebSocket client for real-time notifications and chat
 */

// Event types for WebSocket messages
export type WebSocketEventType = 'notification' | 'chat_message' | 'typing' | 'read_receipt' | 'connection_status' | 'authentication';

// WebSocket message structure
export interface WebSocketMessage {
  type: WebSocketEventType;
  data: any;
}

// WebSocket connection events
export interface ConnectionStatusEvent {
  status: 'connected' | 'disconnected' | 'reconnecting';
  timestamp: string;
}

// Notification event structure
export interface NotificationEvent {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

// Chat message event structure
export interface ChatMessageEvent {
  id: number;
  chatRoomId: number;
  senderId: number;
  content: string;
  type: string;
  read: boolean;
  createdAt: string;
}

// Typing indicator event
export interface TypingEvent {
  chatRoomId: number;
  userId: number;
  isTyping: boolean;
  timestamp: string;
}

// Read receipt event
export interface ReadReceiptEvent {
  chatRoomId: number;
  userId: number;
  messageId: number;
  timestamp: string;
}

// Event handler type
type EventHandler = (data: any) => void;

// WebSocket client class
class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000; // 3 seconds
  private eventHandlers: Map<WebSocketEventType, EventHandler[]> = new Map();
  private userId: number | null = null;
  private authToken: string | null = null;

  // Initialize WebSocket connection
  connect(userId: number, authToken: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    this.userId = userId;
    this.authToken = authToken;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      // Connection opened
      this.ws.addEventListener('open', () => {
        console.log('WebSocket connection established');
        this.reconnectAttempts = 0;
        
        // Send authentication message
        this.sendMessage({
          type: 'authentication',
          data: {
            userId,
            token: authToken
          }
        });

        // Notify handlers of connection
        this.notifyHandlers('connection_status', {
          status: 'connected',
          timestamp: new Date().toISOString()
        });
      });

      // Listen for messages
      this.ws.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          this.notifyHandlers(message.type, message.data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      // Connection closed
      this.ws.addEventListener('close', () => {
        console.log('WebSocket connection closed');
        this.notifyHandlers('connection_status', {
          status: 'disconnected',
          timestamp: new Date().toISOString()
        });
        this.attemptReconnect();
      });

      // Connection error
      this.ws.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
        this.notifyHandlers('connection_status', {
          status: 'disconnected',
          timestamp: new Date().toISOString()
        });
      });
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }

  // Close WebSocket connection
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.userId = null;
    this.authToken = null;
  }

  // Attempt to reconnect
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.notifyHandlers('connection_status', {
      status: 'reconnecting',
      timestamp: new Date().toISOString()
    });

    this.reconnectTimer = window.setTimeout(() => {
      if (this.userId && this.authToken) {
        this.connect(this.userId, this.authToken);
      }
    }, delay);
  }

  // Send message to server
  sendMessage(message: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('Cannot send message, WebSocket is not connected');
    }
  }

  // Register event handler
  on(eventType: WebSocketEventType, handler: EventHandler) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    
    this.eventHandlers.get(eventType)?.push(handler);
  }

  // Remove event handler
  off(eventType: WebSocketEventType, handler: EventHandler) {
    if (!this.eventHandlers.has(eventType)) {
      return;
    }
    
    const handlers = this.eventHandlers.get(eventType) || [];
    const index = handlers.indexOf(handler);
    
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  // Notify all handlers for an event type
  private notifyHandlers(eventType: WebSocketEventType, data: any) {
    const handlers = this.eventHandlers.get(eventType) || [];
    
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in ${eventType} handler:`, error);
      }
    });
  }

  // Send typing indicator
  sendTypingIndicator(chatRoomId: number, isTyping: boolean) {
    this.sendMessage({
      type: 'typing',
      data: {
        chatRoomId,
        userId: this.userId,
        isTyping,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Send read receipt
  sendReadReceipt(chatRoomId: number, messageId: number) {
    this.sendMessage({
      type: 'read_receipt',
      data: {
        chatRoomId,
        userId: this.userId,
        messageId,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Send chat message
  sendChatMessage(chatRoomId: number, content: string, type: string = 'text') {
    this.sendMessage({
      type: 'chat_message',
      data: {
        chatRoomId,
        senderId: this.userId,
        content,
        type,
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Create singleton instance
export const wsClient = new WebSocketClient();

export default wsClient;