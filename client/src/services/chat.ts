/**
 * Chat Service
 * Provides methods to interact with the chat API endpoints and WebSocket for real-time messaging
 */

// Types for chat functionality
export interface ChatRoom {
  id: number;
  name: string;
  type: 'direct' | 'group' | 'support';
  participants: number[];
  lastMessageAt: string | null;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: number;
  roomId: number;
  senderId: number;
  content: string;
  read: boolean;
  attachments?: any[];
  createdAt: string;
}

export interface ChatParticipant {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

export interface CreateRoomRequest {
  name?: string;
  type: 'direct' | 'group' | 'support';
  participants: number[];
  metadata?: any;
}

export interface SendMessageRequest {
  roomId: number;
  content: string;
  attachments?: any[];
}

// API endpoint paths
const API_ENDPOINTS = {
  GET_ROOMS: '/api/chat/rooms',
  CREATE_ROOM: '/api/chat/rooms',
  GET_ROOM: (id: number) => `/api/chat/rooms/${id}`,
  GET_MESSAGES: (roomId: number) => `/api/chat/rooms/${roomId}/messages`,
  SEND_MESSAGE: (roomId: number) => `/api/chat/rooms/${roomId}/messages`,
  MARK_READ: (roomId: number) => `/api/chat/rooms/${roomId}/read`,
};

// WebSocket connection
let socket: WebSocket | null = null;
let messageCallbacks: ((message: ChatMessage) => void)[] = [];
let statusChangeCallbacks: ((status: 'connected' | 'disconnected') => void)[] = [];

/**
 * Initialize WebSocket connection for real-time chat
 */
export function initializeChatWebSocket(userId: number, token: string): void {
  if (socket) {
    return; // Already initialized
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  socket = new WebSocket(`${protocol}//${window.location.host}/ws`);

  socket.onopen = () => {
    console.log('Chat WebSocket connection established');
    
    // Authenticate the WebSocket connection
    const authMessage = {
      type: 'authenticate',
      data: {
        userId,
        token,
      }
    };
    
    socket.send(JSON.stringify(authMessage));
    
    // Notify listeners of connection status change
    statusChangeCallbacks.forEach(callback => callback('connected'));
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'chat_message') {
        // Notify message listeners
        messageCallbacks.forEach(callback => callback(data.message));
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  };

  socket.onclose = () => {
    console.log('Chat WebSocket connection closed');
    socket = null;
    
    // Notify listeners of connection status change
    statusChangeCallbacks.forEach(callback => callback('disconnected'));
    
    // Attempt to reconnect after a delay
    setTimeout(() => {
      initializeChatWebSocket(userId, token);
    }, 5000);
  };

  socket.onerror = (error) => {
    console.error('Chat WebSocket error:', error);
  };
}

/**
 * Close WebSocket connection
 */
export function closeChatWebSocket(): void {
  if (socket) {
    socket.close();
    socket = null;
  }
}

/**
 * Add a listener for incoming chat messages
 */
export function onChatMessage(callback: (message: ChatMessage) => void): () => void {
  messageCallbacks.push(callback);
  
  // Return a function to remove the listener
  return () => {
    messageCallbacks = messageCallbacks.filter(cb => cb !== callback);
  };
}

/**
 * Add a listener for WebSocket connection status changes
 */
export function onStatusChange(callback: (status: 'connected' | 'disconnected') => void): () => void {
  statusChangeCallbacks.push(callback);
  
  // Return a function to remove the listener
  return () => {
    statusChangeCallbacks = statusChangeCallbacks.filter(cb => cb !== callback);
  };
}

/**
 * Get all chat rooms for the current user
 */
export async function getChatRooms(): Promise<ChatRoom[]> {
  try {
    const response = await fetch(API_ENDPOINTS.GET_ROOMS);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch chat rooms');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    
    // In development, return mock data if the API fails
    if (import.meta.env.DEV) {
      return getMockChatRooms();
    }
    
    throw error;
  }
}

/**
 * Create a new chat room
 */
export async function createChatRoom(request: CreateRoomRequest): Promise<ChatRoom> {
  try {
    const response = await fetch(API_ENDPOINTS.CREATE_ROOM, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create chat room');
    }

    return response.json();
  } catch (error) {
    console.error('Error creating chat room:', error);
    
    // In development, return mock data if the API fails
    if (import.meta.env.DEV) {
      return {
        id: Math.floor(Math.random() * 1000),
        name: request.name || 'New Chat',
        type: request.type,
        participants: request.participants,
        lastMessageAt: null,
        metadata: request.metadata || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    
    throw error;
  }
}

/**
 * Get messages for a specific chat room
 */
export async function getChatMessages(roomId: number): Promise<ChatMessage[]> {
  try {
    const response = await fetch(API_ENDPOINTS.GET_MESSAGES(roomId));

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch chat messages');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    
    // In development, return mock data if the API fails
    if (import.meta.env.DEV) {
      return getMockChatMessages(roomId);
    }
    
    throw error;
  }
}

/**
 * Send a message to a chat room
 */
export async function sendChatMessage(request: SendMessageRequest): Promise<ChatMessage> {
  try {
    const response = await fetch(API_ENDPOINTS.SEND_MESSAGE(request.roomId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send message');
    }

    return response.json();
  } catch (error) {
    console.error('Error sending message:', error);
    
    // In development, return mock data if the API fails
    if (import.meta.env.DEV) {
      const mockMessage: ChatMessage = {
        id: Math.floor(Math.random() * 10000),
        roomId: request.roomId,
        senderId: 1, // Current user ID (mock)
        content: request.content,
        read: false,
        attachments: request.attachments || [],
        createdAt: new Date().toISOString(),
      };
      
      // Send via WebSocket if available
      if (socket && socket.readyState === WebSocket.OPEN) {
        const wsMessage = {
          type: 'chat_message',
          message: mockMessage,
        };
        socket.send(JSON.stringify(wsMessage));
      }
      
      return mockMessage;
    }
    
    throw error;
  }
}

/**
 * Mark all messages in a room as read
 */
export async function markRoomAsRead(roomId: number): Promise<void> {
  try {
    const response = await fetch(API_ENDPOINTS.MARK_READ(roomId), {
      method: 'PATCH',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to mark messages as read');
    }
  } catch (error) {
    console.error('Error marking messages as read:', error);
    // In development, we can just log the error and continue
    if (!import.meta.env.DEV) {
      throw error;
    }
  }
}

/**
 * Generate mock chat rooms for development
 */
function getMockChatRooms(): ChatRoom[] {
  return [
    {
      id: 1,
      name: 'Advait Patel',
      type: 'direct',
      participants: [1, 2],
      lastMessageAt: new Date(Date.now() - 3600000).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 2,
      name: 'Legal Team',
      type: 'group',
      participants: [1, 3, 4, 5],
      lastMessageAt: new Date(Date.now() - 86400000).toISOString(),
      metadata: {
        description: 'Internal legal team discussions',
        icon: 'users',
      },
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 3,
      name: 'Support',
      type: 'support',
      participants: [1, 6],
      lastMessageAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ];
}

/**
 * Generate mock chat messages for development
 */
function getMockChatMessages(roomId: number): ChatMessage[] {
  const messages: ChatMessage[] = [];
  const count = 10 + Math.floor(Math.random() * 15); // 10-25 messages
  
  const currentDate = new Date();
  const userId = 1; // Current user ID (mock)
  
  for (let i = 0; i < count; i++) {
    const isFromCurrentUser = Math.random() > 0.5;
    const messageDate = new Date(currentDate.getTime() - (count - i) * 3600000);
    
    messages.push({
      id: (roomId * 1000) + i,
      roomId,
      senderId: isFromCurrentUser ? userId : (roomId === 1 ? 2 : (roomId === 2 ? 3 : 6)),
      content: getRandomMessageContent(),
      read: true,
      createdAt: messageDate.toISOString(),
    });
  }
  
  // Add one unread message if it's not from the current user
  if (Math.random() > 0.3) {
    messages.push({
      id: (roomId * 1000) + count,
      roomId,
      senderId: roomId === 1 ? 2 : (roomId === 2 ? 3 : 6),
      content: getRandomMessageContent(),
      read: false,
      createdAt: new Date(currentDate.getTime() - 60000).toISOString(), // 1 minute ago
    });
  }
  
  return messages;
}

/**
 * Generate random message content for mock data
 */
function getRandomMessageContent(): string {
  const messages = [
    "Hi there! How can I help you today?",
    "I've reviewed the contract and have some suggestions.",
    "Could you please clarify the terms in section 4.2?",
    "The latest draft looks good to me.",
    "We need to address the liability clause before signing.",
    "When do you need this completed by?",
    "I've shared a new version with the updated terms.",
    "Let's schedule a call to discuss this further.",
    "This agreement needs to comply with the new regulations.",
    "I recommend adding a force majeure clause.",
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
}