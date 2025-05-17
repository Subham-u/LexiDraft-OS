/**
 * WebSocket client for real-time features
 */

import { getAuthToken } from './auth';

// Event handlers for different message types
type NotificationHandler = (data: any) => void;
type ChatMessageHandler = (data: any) => void;
type TypingIndicatorHandler = (data: { roomId: number, userId: number, isTyping: boolean }) => void;
type ConnectionStatusHandler = (isConnected: boolean) => void;

// WebSocket client singleton
class WebSocketClient {
  private socket: WebSocket | null = null;
  private reconnectInterval: number = 3000; // 3 seconds
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private notificationHandlers: NotificationHandler[] = [];
  private chatMessageHandlers: ChatMessageHandler[] = [];
  private typingIndicatorHandlers: TypingIndicatorHandler[] = [];
  private connectionStatusHandlers: ConnectionStatusHandler[] = [];
  private authenticated: boolean = false;
  
  /**
   * Initialize WebSocket connection
   */
  public connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }
    
    try {
      // Use the appropriate WebSocket protocol based on the current connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;
      
      console.log(`Connecting to WebSocket at ${wsUrl}`);
      
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('Error establishing WebSocket connection:', error);
      this.scheduleReconnect();
    }
  }
  
  /**
   * Disconnect WebSocket
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.authenticated = false;
    this.notifyConnectionStatus(false);
  }
  
  /**
   * Send authentication message
   */
  private authenticate(): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    
    // Get JWT token from auth
    const token = getAuthToken();
    
    if (!token) {
      console.warn('No auth token available, WebSocket authentication skipped');
      return;
    }
    
    // Send authentication message
    this.socket.send(JSON.stringify({
      type: 'auth',
      token
    }));
  }
  
  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    console.log('WebSocket connection established');
    this.reconnectAttempts = 0;
    
    // Authenticate connection
    this.authenticate();
    
    // Notify listeners of connection
    this.notifyConnectionStatus(true);
  }
  
  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'auth_success':
          console.log('WebSocket authenticated successfully');
          this.authenticated = true;
          break;
          
        case 'auth_error':
          console.error('WebSocket authentication failed:', message.message);
          this.authenticated = false;
          break;
          
        case 'notification':
          this.notifyNotificationHandlers(message.data);
          break;
          
        case 'chat_message':
          this.notifyChatMessageHandlers(message.data);
          break;
          
        case 'typing_indicator':
          this.notifyTypingIndicatorHandlers(message.data);
          break;
          
        case 'broadcast':
          console.log('Broadcast message received:', message.data);
          break;
          
        default:
          console.log('Unknown WebSocket message type:', message.type);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }
  
  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    this.socket = null;
    this.authenticated = false;
    
    console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
    
    // Notify listeners of disconnection
    this.notifyConnectionStatus(false);
    
    // Attempt to reconnect
    this.scheduleReconnect();
  }
  
  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    
    // Close and reconnect on error
    if (this.socket) {
      this.socket.close();
    }
  }
  
  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectInterval * Math.min(this.reconnectAttempts, 5);
      
      console.log(`Scheduling WebSocket reconnection in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error(`Maximum WebSocket reconnection attempts (${this.maxReconnectAttempts}) reached`);
    }
  }
  
  /**
   * Send a message via WebSocket
   */
  public send(message: any): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('Cannot send message: WebSocket not connected');
      return false;
    }
    
    try {
      this.socket.send(typeof message === 'string' ? message : JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }
  
  /**
   * Send a typing indicator
   */
  public sendTypingIndicator(roomId: number, isTyping: boolean): boolean {
    return this.send({
      type: 'typing_indicator',
      data: {
        roomId,
        isTyping
      }
    });
  }
  
  // Event handler registration methods
  
  /**
   * Register notification handler
   */
  public onNotification(handler: NotificationHandler): () => void {
    this.notificationHandlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      this.notificationHandlers = this.notificationHandlers.filter(h => h !== handler);
    };
  }
  
  /**
   * Register chat message handler
   */
  public onChatMessage(handler: ChatMessageHandler): () => void {
    this.chatMessageHandlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      this.chatMessageHandlers = this.chatMessageHandlers.filter(h => h !== handler);
    };
  }
  
  /**
   * Register typing indicator handler
   */
  public onTypingIndicator(handler: TypingIndicatorHandler): () => void {
    this.typingIndicatorHandlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      this.typingIndicatorHandlers = this.typingIndicatorHandlers.filter(h => h !== handler);
    };
  }
  
  /**
   * Register connection status handler
   */
  public onConnectionStatus(handler: ConnectionStatusHandler): () => void {
    this.connectionStatusHandlers.push(handler);
    
    // Initial status notification
    handler(this.socket?.readyState === WebSocket.OPEN);
    
    // Return unsubscribe function
    return () => {
      this.connectionStatusHandlers = this.connectionStatusHandlers.filter(h => h !== handler);
    };
  }
  
  // Handler notification methods
  
  /**
   * Notify all notification handlers
   */
  private notifyNotificationHandlers(data: any): void {
    this.notificationHandlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('Error in notification handler:', error);
      }
    });
  }
  
  /**
   * Notify all chat message handlers
   */
  private notifyChatMessageHandlers(data: any): void {
    this.chatMessageHandlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('Error in chat message handler:', error);
      }
    });
  }
  
  /**
   * Notify all typing indicator handlers
   */
  private notifyTypingIndicatorHandlers(data: { roomId: number, userId: number, isTyping: boolean }): void {
    this.typingIndicatorHandlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('Error in typing indicator handler:', error);
      }
    });
  }
  
  /**
   * Notify all connection status handlers
   */
  private notifyConnectionStatus(isConnected: boolean): void {
    this.connectionStatusHandlers.forEach(handler => {
      try {
        handler(isConnected);
      } catch (error) {
        console.error('Error in connection status handler:', error);
      }
    });
  }
  
  /**
   * Check if WebSocket is connected
   */
  public isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
  
  /**
   * Check if WebSocket is authenticated
   */
  public isAuthenticated(): boolean {
    return this.authenticated && this.isConnected();
  }
}

// Create singleton instance
const wsClient = new WebSocketClient();

export default wsClient;