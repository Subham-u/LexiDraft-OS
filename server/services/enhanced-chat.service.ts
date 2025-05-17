/**
 * Enhanced chat service with real-time messaging capabilities
 */
import { db } from '../db';
import { eq, and, or, desc, sql, asc, gt, lt, inArray } from 'drizzle-orm';
import { 
  chatMessages, 
  chatRooms,
  users,
  type ChatMessage, 
  type ChatRoom,
  type InsertChatMessage,
  type InsertChatRoom
} from '../../shared/schema';
import { createLogger } from '../utils/logger';
import { ApiError } from '../middleware/error';
import * as websocketService from './websocket.service';
import * as notificationService from './notification.service';

const logger = createLogger('enhanced-chat-service');

/**
 * Create a new chat room
 */
export async function createChatRoom(
  roomData: Omit<InsertChatRoom, 'createdAt' | 'updatedAt'>
): Promise<ChatRoom> {
  try {
    logger.info(`Creating chat room of type: ${roomData.type}`);
    
    // Ensure participants array is valid
    if (!roomData.participants || !roomData.participants.length) {
      throw ApiError.badRequest('Chat room must have at least one participant');
    }
    
    const [newRoom] = await db
      .insert(chatRooms)
      .values({
        ...roomData,
        lastMessageAt: roomData.lastMessageAt || new Date()
      })
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
    // We need to use a raw SQL query to search in the participants array
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
  messageData: Omit<InsertChatMessage, 'createdAt'>,
  includeSenderInfo: boolean = false
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
    
    // Send real-time message to all participants via WebSocket
    if (includeSenderInfo) {
      // Get sender info to include in the WebSocket message
      const [sender] = await db
        .select({
          id: users.id,
          name: users.fullName,
          avatar: users.avatar
        })
        .from(users)
        .where(eq(users.id, messageData.senderId));
      
      if (sender) {
        const messageWithSender = {
          ...newMessage,
          sender
        };
        
        // Send to all participants except the sender
        const recipients = room.participants.filter(id => id !== messageData.senderId);
        websocketService.sendChatMessage(recipients, messageWithSender);
        
        // Send notifications to participants who are not currently connected
        recipients.forEach(async (recipientId) => {
          // Get recipient name for notification
          const [recipient] = await db
            .select({ fullName: users.fullName })
            .from(users)
            .where(eq(users.id, recipientId));
          
          if (recipient) {
            await notificationService.sendNewMessageNotification(
              recipientId,
              newMessage.id,
              sender.name,
              room.id,
              newMessage.content,
              room.type
            );
          }
        });
      }
    }
    
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
      query = query.where(lt(chatMessages.createdAt, before));
    }
    
    const messages = await query
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
    
    // Return messages in chronological order (oldest first)
    return messages.reverse();
  } catch (error) {
    logger.error(`Error getting messages for chat room: ${roomId}`, error);
    throw error;
  }
}

/**
 * Get new messages since a specific date
 */
export async function getNewMessages(
  roomId: number,
  since: Date
): Promise<ChatMessage[]> {
  try {
    const messages = await db
      .select()
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.roomId, roomId),
          gt(chatMessages.createdAt, since)
        )
      )
      .orderBy(asc(chatMessages.createdAt));
    
    return messages;
  } catch (error) {
    logger.error(`Error getting new messages for chat room: ${roomId}`, error);
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
          inArray(chatMessages.roomId, roomIds),
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
    
    // Get user names for room name
    const [user1] = await db
      .select({ fullName: users.fullName })
      .from(users)
      .where(eq(users.id, user1Id));
    
    const [user2] = await db
      .select({ fullName: users.fullName })
      .from(users)
      .where(eq(users.id, user2Id));
    
    // Create a new direct message room
    return createChatRoom({
      name: `${user1?.fullName} & ${user2?.fullName}`,
      type: 'direct',
      participants: [user1Id, user2Id],
      lastMessageAt: new Date()
    });
  } catch (error) {
    logger.error(`Error getting/creating DM room for users ${user1Id} and ${user2Id}`, error);
    throw error;
  }
}

/**
 * Create a group chat room
 */
export async function createGroupChatRoom(
  name: string,
  creatorId: number,
  participantIds: number[],
  type: string = 'group'
): Promise<ChatRoom> {
  try {
    // Ensure the creator is included in participants
    if (!participantIds.includes(creatorId)) {
      participantIds.push(creatorId);
    }
    
    // Create the room
    const room = await createChatRoom({
      name,
      type,
      participants: participantIds,
      lastMessageAt: new Date(),
      metadata: {
        createdBy: creatorId,
        createdAt: new Date().toISOString()
      }
    });
    
    // Send a system message
    const [creator] = await db
      .select({ fullName: users.fullName })
      .from(users)
      .where(eq(users.id, creatorId));
    
    await sendChatMessage({
      roomId: room.id,
      senderId: creatorId,
      content: `${creator?.fullName || 'A user'} created this group chat`,
      read: false,
      attachments: []
    });
    
    return room;
  } catch (error) {
    logger.error('Error creating group chat room', error);
    throw error;
  }
}

/**
 * Add users to a chat room
 */
export async function addUsersToRoom(
  roomId: number,
  userIds: number[],
  addedBy: number
): Promise<ChatRoom> {
  try {
    const room = await getChatRoomById(roomId);
    
    if (!room) {
      throw ApiError.notFound('Chat room not found');
    }
    
    // Check if the user adding others is a participant
    if (!room.participants.includes(addedBy)) {
      throw ApiError.forbidden('You must be a participant to add users to this room');
    }
    
    // Get current participants
    const currentParticipants = room.participants;
    
    // Filter out users who are already in the room
    const newUsers = userIds.filter(id => !currentParticipants.includes(id));
    
    if (newUsers.length === 0) {
      return room; // No new users to add
    }
    
    // Add new users to the room
    const updatedParticipants = [...currentParticipants, ...newUsers];
    
    // Update the room
    const [updatedRoom] = await db
      .update(chatRooms)
      .set({ 
        participants: updatedParticipants,
        updatedAt: new Date()
      })
      .where(eq(chatRooms.id, roomId))
      .returning();
    
    // Get the name of the user who added others
    const [adder] = await db
      .select({ fullName: users.fullName })
      .from(users)
      .where(eq(users.id, addedBy));
    
    // Get the names of added users
    const addedUsers = await db
      .select({ id: users.id, fullName: users.fullName })
      .from(users)
      .where(inArray(users.id, newUsers));
    
    const addedNames = addedUsers.map(u => u.fullName).join(', ');
    
    // Send a system message
    await sendChatMessage({
      roomId,
      senderId: addedBy,
      content: `${adder?.fullName || 'A user'} added ${addedNames} to the conversation`,
      read: false,
      attachments: []
    });
    
    return updatedRoom;
  } catch (error) {
    logger.error(`Error adding users to chat room: ${roomId}`, error);
    throw error;
  }
}

/**
 * Leave a chat room
 */
export async function leaveRoom(
  roomId: number,
  userId: number
): Promise<void> {
  try {
    const room = await getChatRoomById(roomId);
    
    if (!room) {
      throw ApiError.notFound('Chat room not found');
    }
    
    // Check if the user is a participant
    if (!room.participants.includes(userId)) {
      return; // User is not in the room, nothing to do
    }
    
    // Get user name
    const [user] = await db
      .select({ fullName: users.fullName })
      .from(users)
      .where(eq(users.id, userId));
    
    // Remove user from participants
    const updatedParticipants = room.participants.filter(id => id !== userId);
    
    if (updatedParticipants.length === 0) {
      // If no participants left, delete the room
      await db
        .delete(chatRooms)
        .where(eq(chatRooms.id, roomId));
      
      // Delete all messages in the room
      await db
        .delete(chatMessages)
        .where(eq(chatMessages.roomId, roomId));
      
      return;
    }
    
    // Update the room
    await db
      .update(chatRooms)
      .set({ 
        participants: updatedParticipants,
        updatedAt: new Date()
      })
      .where(eq(chatRooms.id, roomId));
    
    // Send a system message
    await sendChatMessage({
      roomId,
      senderId: updatedParticipants[0], // Use first remaining participant as the sender
      content: `${user?.fullName || 'A user'} left the conversation`,
      read: false,
      attachments: []
    });
  } catch (error) {
    logger.error(`Error leaving chat room: ${roomId}`, error);
    throw error;
  }
}