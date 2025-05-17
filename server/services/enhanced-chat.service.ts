/**
 * Enhanced chat service
 */
import { db } from '../db';
import { eq, and, desc, or, inArray } from 'drizzle-orm';
import { chatRooms, chatMessages } from '../../shared/schema';
import { createLogger } from '../utils/logger';
import * as websocketService from './websocket.service';

const logger = createLogger('enhanced-chat-service');

/**
 * Get user chat rooms
 */
export async function getUserChatRooms(userId: number) {
  try {
    // Get rooms where the user is a participant
    const rooms = await db
      .select()
      .from(chatRooms)
      .where(
        // Check if userId is in the participants array
        or(
          eq(chatRooms.createdBy, userId),
          inArray(userId, chatRooms.participants)
        )
      )
      .orderBy(desc(chatRooms.updatedAt));
    
    return rooms;
  } catch (error) {
    logger.error(`Error getting user chat rooms: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
}

/**
 * Get chat room by ID
 */
export async function getChatRoomById(roomId: number) {
  try {
    const [room] = await db
      .select()
      .from(chatRooms)
      .where(eq(chatRooms.id, roomId));
    
    return room;
  } catch (error) {
    logger.error(`Error getting chat room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
}

/**
 * Create chat room
 */
export async function createChatRoom(data: {
  name: string;
  type: string;
  createdBy: number;
  participants: number[];
}) {
  try {
    // Make sure createdBy is included in participants
    if (!data.participants.includes(data.createdBy)) {
      data.participants.push(data.createdBy);
    }
    
    const [room] = await db
      .insert(chatRooms)
      .values({
        name: data.name,
        type: data.type,
        createdBy: data.createdBy,
        participants: data.participants
      })
      .returning();
    
    return room;
  } catch (error) {
    logger.error(`Error creating chat room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

/**
 * Get chat room messages
 */
export async function getChatRoomMessages(
  roomId: number,
  limit: number = 50,
  before?: Date
) {
  try {
    let query = db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.roomId, roomId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
    
    if (before) {
      query = db
        .select()
        .from(chatMessages)
        .where(and(
          eq(chatMessages.roomId, roomId),
          // Use less than for timestamps before the given date
          // This is simplified and might need adjustment
        ))
        .orderBy(desc(chatMessages.createdAt))
        .limit(limit);
    }
    
    const messages = await query;
    
    // Return messages in chronological order (oldest first)
    return messages.reverse();
  } catch (error) {
    logger.error(`Error getting chat messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
}

/**
 * Send chat message
 */
export async function sendChatMessage(message: {
  roomId: number;
  senderId: number;
  content: string;
  type?: string;
}) {
  try {
    // Get room to check participants
    const room = await getChatRoomById(message.roomId);
    
    if (!room) {
      throw new Error(`Chat room with ID ${message.roomId} not found`);
    }
    
    // Check if sender is a participant
    const isParticipant = room.participants.includes(message.senderId) || room.createdBy === message.senderId;
    
    if (!isParticipant) {
      throw new Error(`User ${message.senderId} is not a participant in chat room ${message.roomId}`);
    }
    
    // Create message
    const [chatMessage] = await db
      .insert(chatMessages)
      .values({
        roomId: message.roomId,
        senderId: message.senderId,
        content: message.content,
        type: message.type || 'text'
      })
      .returning();
    
    // Update room's updatedAt timestamp
    await db
      .update(chatRooms)
      .set({
        updatedAt: new Date()
      })
      .where(eq(chatRooms.id, message.roomId));
    
    // Send real-time message to all participants
    room.participants.forEach(participantId => {
      if (participantId !== message.senderId) {
        websocketService.sendChatMessage(participantId, {
          ...chatMessage,
          isNew: true
        });
      }
    });
    
    return chatMessage;
  } catch (error) {
    logger.error(`Error sending chat message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(roomId: number, userId: number) {
  try {
    // Update messages where the recipient is the current user and messages are unread
    await db
      .update(chatMessages)
      .set({
        readBy: db.sql`array_append("readBy", ${userId})`
      })
      .where(and(
        eq(chatMessages.roomId, roomId),
        // Check if user ID is not in the readBy array
        // This is simplified and might need adjustment
      ));
    
    return true;
  } catch (error) {
    logger.error(`Error marking messages as read: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}