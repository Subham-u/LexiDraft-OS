/**
 * Chat Service
 * Provides messaging functionality using the LexiDraft API
 */
import wsClient from '../lib/websocket';

// Chat room interface
export interface ChatRoom {
  id: number
  name: string
  type: string
  participants: number[]
  lastMessageAt: string | null
  metadata: {
    unreadCount: number
    [key: string]: any
  }
  createdAt: string
  updatedAt: string
}

// Chat message interface
export interface ChatMessage {
  id: number
  roomId: number
  senderId: number
  content: string
  type: string
  read: boolean
  attachments?: any[]
  createdAt: string
}

/**
 * Get all chat rooms for the user
 */
export async function getChatRooms(): Promise<ChatRoom[]> {
  try {
    const response = await fetch('/api/chat/rooms');
    
    if (!response.ok) {
      throw new Error(`Error fetching chat rooms: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to get chat rooms:', error);
    throw error;
  }
}

/**
 * Get messages for a specific chat room
 * @param roomId - ID of the chat room
 * @param limit - Maximum number of messages to retrieve
 * @param before - Get messages before this date
 */
export async function getChatMessages(
  roomId: number, 
  limit: number = 50,
  before?: Date
): Promise<ChatMessage[]> {
  try {
    let url = `/api/chat/rooms/${roomId}/messages?limit=${limit}`;
    
    if (before) {
      url += `&before=${before.toISOString()}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error fetching chat messages: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to get chat messages:', error);
    throw error;
  }
}

/**
 * Send a chat message
 * @param roomId - ID of the chat room
 * @param content - Message content
 * @param type - Message type (default: 'text')
 */
export function sendChatMessage(
  roomId: number,
  content: string,
  type: string = 'text'
): void {
  wsClient.sendChatMessage(roomId, content, type);
}

/**
 * Send typing indicator
 * @param roomId - ID of the chat room
 * @param isTyping - Whether the user is typing
 */
export function sendTypingIndicator(
  roomId: number,
  isTyping: boolean
): void {
  wsClient.sendTypingIndicator(roomId, isTyping);
}

/**
 * Mark messages as read
 * @param roomId - ID of the chat room
 * @param messageId - ID of the last read message
 */
export function markMessageAsRead(
  roomId: number,
  messageId: number
): void {
  wsClient.sendReadReceipt(roomId, messageId);
}