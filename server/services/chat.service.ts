/**
 * Chat service for real-time messaging
 */
import { db } from '../db';
import { eq, and, or, desc, sql, asc } from 'drizzle-orm';
import { 
  chatMessages, 
  chatRooms,
  type ChatMessage, 
  type ChatRoom,
  type InsertChatMessage,
  type InsertChatRoom
} from '../../shared/schema';
import { createLogger } from '../utils/logger';
import { ApiError } from '../middleware/error';

const logger = createLogger('chat-service');

/**
 * Create a new chat room
 */
export async function createChatRoom(
  roomData: Omit<InsertChatRoom, 'createdAt'>
): Promise<ChatRoom> {
  try {
    logger.info(`Creating chat room of type: ${roomData.type}`);
    
    // Ensure participants array is valid
    if (!roomData.participants || !roomData.participants.length) {
      throw ApiError.badRequest('Chat room must have at least one participant');
    }
    
    const [newRoom] = await db
      .insert(chatRooms)
      .values(roomData)
      .returning();
    
    logger.info(`Created chat room: ${newRoom.id}`);
    return newRoom;
  } catch (error) {
    logger.error('Error creating chat room', error);
    throw error;
  }
}

/**
 * Get chat room by ID
 */
export async function getChatRoomById(id: number): Promise<ChatRoom | null> {
  try {
    const [room] = await db
      .select()
      .from(chatRooms)
      .where(eq(chatRooms.id, id));
    
    return room || null;
  } catch (error) {
    logger.error(`Error getting chat room with ID: ${id}`, error);
    throw error;
  }
}

/**
 * Get chat rooms for a user
 */
export async function getUserChatRooms(userId: number): Promise<ChatRoom[]> {
  try {
    return await db
      .select()
      .from(chatRooms)
      .where(sql`${userId} = ANY(${chatRooms.participants})`)
      .orderBy(desc(chatRooms.lastMessageAt));
  } catch (error) {
    logger.error(`Error getting chat rooms for user: ${userId}`, error);
    throw error;
  }
}

/**
 * Send a message to a chat room
 */
export async function sendChatMessage(
  messageData: Omit<InsertChatMessage, 'createdAt'>
): Promise<ChatMessage> {
  try {
    // Verify the chat room exists
    const room = await getChatRoomById(messageData.roomId);
    if (!room) {
      throw ApiError.notFound('Chat room not found');
    }
    
    // Verify the sender is a participant in the room
    if (!room.participants.includes(messageData.senderId)) {
      throw ApiError.forbidden('User is not a participant in this chat room');
    }
    
    logger.info(`Sending message to chat room: ${messageData.roomId}`);
    
    const [newMessage] = await db
      .insert(chatMessages)
      .values(messageData)
      .returning();
    
    // Update the last message timestamp in the room
    await db
      .update(chatRooms)
      .set({ lastMessageAt: new Date() })
      .where(eq(chatRooms.id, messageData.roomId));
    
    return newMessage;
  } catch (error) {
    logger.error('Error sending chat message', error);
    throw error;
  }
}

/**
 * Get messages for a chat room
 */
export async function getChatRoomMessages(
  roomId: number,
  limit: number = 50,
  before?: Date
): Promise<ChatMessage[]> {
  try {
    let query = db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.roomId, roomId));
    
    if (before) {
      query = query.where(sql`${chatMessages.createdAt} < ${before}`);
    }
    
    return await query
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
  } catch (error) {
    logger.error(`Error getting messages for chat room: ${roomId}`, error);
    throw error;
  }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
  roomId: number,
  userId: number
): Promise<void> {
  try {
    await db
      .update(chatMessages)
      .set({ read: true })
      .where(
        and(
          eq(chatMessages.roomId, roomId),
          eq(chatMessages.read, false),
          sql`${chatMessages.senderId} != ${userId}`
        )
      );
    
    logger.info(`Marked messages as read in room ${roomId} for user ${userId}`);
  } catch (error) {
    logger.error(`Error marking messages as read in room ${roomId}`, error);
    throw error;
  }
}

/**
 * Get unread message count for a user
 */
export async function getUnreadMessageCount(userId: number): Promise<number> {
  try {
    // Get all rooms where the user is a participant
    const rooms = await getUserChatRooms(userId);
    
    if (rooms.length === 0) {
      return 0;
    }
    
    const roomIds = rooms.map(room => room.id);
    
    const result = await db
      .select({ count: sql`count(*)` })
      .from(chatMessages)
      .where(
        and(
          sql`${chatMessages.roomId} IN (${roomIds.join(',')})`,
          eq(chatMessages.read, false),
          sql`${chatMessages.senderId} != ${userId}`
        )
      );
    
    return parseInt(result[0].count.toString());
  } catch (error) {
    logger.error(`Error getting unread message count for user: ${userId}`, error);
    throw error;
  }
}

/**
 * Create or get direct message room between two users
 */
export async function getOrCreateDirectMessageRoom(
  user1Id: number,
  user2Id: number
): Promise<ChatRoom> {
  try {
    // Check if a direct message room already exists between these users
    const rooms = await db
      .select()
      .from(chatRooms)
      .where(
        and(
          eq(chatRooms.type, 'direct'),
          sql`${user1Id} = ANY(${chatRooms.participants})`,
          sql`${user2Id} = ANY(${chatRooms.participants})`,
          sql`array_length(${chatRooms.participants}, 1) = 2`
        )
      );
    
    if (rooms.length > 0) {
      return rooms[0];
    }
    
    // Create a new direct message room
    return createChatRoom({
      type: 'direct',
      participants: [user1Id, user2Id],
      lastMessageAt: new Date()
    });
  } catch (error) {
    logger.error(`Error getting/creating DM room for users ${user1Id} and ${user2Id}`, error);
    throw error;
  }
}