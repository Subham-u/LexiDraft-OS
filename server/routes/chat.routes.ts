/**
 * Chat routes for real-time messaging
 */
import express, { Router, Request, Response } from 'express';
import { asyncHandler, ApiError } from '../middleware/error';
import { authenticate } from '../middleware/auth';
import { createLogger } from '../utils/logger';
import * as chatService from '../services/enhanced-chat.service';
import { z } from 'zod';

const router: Router = express.Router();
const logger = createLogger('chat-routes');

// Schema for creating a new chat room
const createRoomSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  participants: z.array(z.number()).min(1),
  metadata: z.record(z.any()).optional()
});

// Schema for sending a message
const sendMessageSchema = z.object({
  content: z.string().min(1),
  attachments: z.array(z.any()).optional()
});

// Schema for adding users to a room
const addUsersSchema = z.object({
  userIds: z.array(z.number()).min(1)
});

/**
 * Create a new chat room
 * @route POST /api/chat/rooms
 */
router.post("/rooms", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const validatedData = createRoomSchema.parse(req.body);
  
  // Ensure the creator is included in participants
  if (!validatedData.participants.includes(req.user.id)) {
    validatedData.participants.push(req.user.id);
  }
  
  logger.info(`Creating chat room of type: ${validatedData.type}`);
  
  const room = await chatService.createChatRoom({
    ...validatedData,
    lastMessageAt: new Date()
  });
  
  return res.status(201).json({
    success: true,
    data: room
  });
}));

/**
 * Create a direct message room between the current user and another user
 * @route POST /api/chat/rooms/direct/:userId
 */
router.post("/rooms/direct/:userId", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const otherUserId = parseInt(req.params.userId);
  
  if (isNaN(otherUserId)) {
    throw ApiError.badRequest('Invalid user ID');
  }
  
  if (otherUserId === req.user.id) {
    throw ApiError.badRequest('Cannot create a direct message room with yourself');
  }
  
  logger.info(`Creating or getting direct message room between users ${req.user.id} and ${otherUserId}`);
  
  const room = await chatService.getOrCreateDirectMessageRoom(req.user.id, otherUserId);
  
  return res.json({
    success: true,
    data: room
  });
}));

/**
 * Create a group chat room
 * @route POST /api/chat/rooms/group
 */
router.post("/rooms/group", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const { name, participantIds, type = 'group' } = req.body;
  
  if (!name || typeof name !== 'string') {
    throw ApiError.badRequest('Room name is required');
  }
  
  if (!Array.isArray(participantIds) || participantIds.length === 0) {
    throw ApiError.badRequest('At least one participant is required');
  }
  
  logger.info(`Creating group chat room: ${name}`);
  
  const room = await chatService.createGroupChatRoom(
    name, 
    req.user.id, 
    participantIds,
    type
  );
  
  return res.status(201).json({
    success: true,
    data: room
  });
}));

/**
 * Get all chat rooms for the authenticated user
 * @route GET /api/chat/rooms
 */
router.get("/rooms", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  logger.info(`Getting chat rooms for user: ${req.user.id}`);
  
  const rooms = await chatService.getUserChatRooms(req.user.id);
  
  return res.json({
    success: true,
    data: rooms
  });
}));

/**
 * Get a specific chat room by ID
 * @route GET /api/chat/rooms/:id
 */
router.get("/rooms/:id", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const roomId = parseInt(req.params.id);
  
  if (isNaN(roomId)) {
    throw ApiError.badRequest('Invalid room ID');
  }
  
  logger.info(`Getting chat room: ${roomId}`);
  
  const room = await chatService.getChatRoomById(roomId);
  
  if (!room) {
    throw ApiError.notFound('Chat room not found');
  }
  
  // Check if user has access to this room
  if (!room.participants.includes(req.user.id)) {
    throw ApiError.forbidden('You do not have access to this chat room');
  }
  
  return res.json({
    success: true,
    data: room
  });
}));

/**
 * Get messages for a chat room
 * @route GET /api/chat/rooms/:id/messages
 */
router.get("/rooms/:id/messages", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const roomId = parseInt(req.params.id);
  
  if (isNaN(roomId)) {
    throw ApiError.badRequest('Invalid room ID');
  }
  
  // Parse query parameters
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const before = req.query.before ? new Date(req.query.before as string) : undefined;
  
  logger.info(`Getting messages for chat room: ${roomId}`);
  
  // Check if user has access to this room
  const room = await chatService.getChatRoomById(roomId);
  
  if (!room) {
    throw ApiError.notFound('Chat room not found');
  }
  
  if (!room.participants.includes(req.user.id)) {
    throw ApiError.forbidden('You do not have access to this chat room');
  }
  
  const messages = await chatService.getChatRoomMessages(roomId, limit, before);
  
  // Mark messages as read
  await chatService.markMessagesAsRead(roomId, req.user.id);
  
  return res.json({
    success: true,
    data: messages
  });
}));

/**
 * Get new messages since a specific date
 * @route GET /api/chat/rooms/:id/messages/new
 */
router.get("/rooms/:id/messages/new", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const roomId = parseInt(req.params.id);
  
  if (isNaN(roomId)) {
    throw ApiError.badRequest('Invalid room ID');
  }
  
  if (!req.query.since || typeof req.query.since !== 'string') {
    throw ApiError.badRequest('Since parameter is required (ISO date string)');
  }
  
  const since = new Date(req.query.since);
  
  if (isNaN(since.getTime())) {
    throw ApiError.badRequest('Invalid date format for since parameter');
  }
  
  logger.info(`Getting new messages for chat room: ${roomId} since ${since.toISOString()}`);
  
  // Check if user has access to this room
  const room = await chatService.getChatRoomById(roomId);
  
  if (!room) {
    throw ApiError.notFound('Chat room not found');
  }
  
  if (!room.participants.includes(req.user.id)) {
    throw ApiError.forbidden('You do not have access to this chat room');
  }
  
  const messages = await chatService.getNewMessages(roomId, since);
  
  // Mark messages as read
  await chatService.markMessagesAsRead(roomId, req.user.id);
  
  return res.json({
    success: true,
    data: messages
  });
}));

/**
 * Send a message to a chat room
 * @route POST /api/chat/rooms/:id/messages
 */
router.post("/rooms/:id/messages", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const roomId = parseInt(req.params.id);
  
  if (isNaN(roomId)) {
    throw ApiError.badRequest('Invalid room ID');
  }
  
  const validatedData = sendMessageSchema.parse(req.body);
  
  logger.info(`Sending message to chat room: ${roomId}`);
  
  const message = await chatService.sendChatMessage({
    roomId,
    senderId: req.user.id,
    content: validatedData.content,
    attachments: validatedData.attachments || [],
    read: false
  }, true); // Include sender info
  
  return res.status(201).json({
    success: true,
    data: message
  });
}));

/**
 * Add users to a chat room
 * @route POST /api/chat/rooms/:id/participants
 */
router.post("/rooms/:id/participants", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const roomId = parseInt(req.params.id);
  
  if (isNaN(roomId)) {
    throw ApiError.badRequest('Invalid room ID');
  }
  
  const validatedData = addUsersSchema.parse(req.body);
  
  logger.info(`Adding users to chat room: ${roomId}`);
  
  const room = await chatService.addUsersToRoom(
    roomId,
    validatedData.userIds,
    req.user.id
  );
  
  return res.json({
    success: true,
    data: room
  });
}));

/**
 * Leave a chat room
 * @route DELETE /api/chat/rooms/:id/participants/me
 */
router.delete("/rooms/:id/participants/me", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const roomId = parseInt(req.params.id);
  
  if (isNaN(roomId)) {
    throw ApiError.badRequest('Invalid room ID');
  }
  
  logger.info(`User ${req.user.id} leaving chat room: ${roomId}`);
  
  await chatService.leaveRoom(roomId, req.user.id);
  
  return res.json({
    success: true,
    message: 'Left chat room successfully'
  });
}));

/**
 * Mark messages as read
 * @route POST /api/chat/rooms/:id/read
 */
router.post("/rooms/:id/read", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const roomId = parseInt(req.params.id);
  
  if (isNaN(roomId)) {
    throw ApiError.badRequest('Invalid room ID');
  }
  
  logger.info(`Marking messages as read in room ${roomId} for user ${req.user.id}`);
  
  await chatService.markMessagesAsRead(roomId, req.user.id);
  
  return res.json({
    success: true,
    message: 'Messages marked as read'
  });
}));

/**
 * Get unread message count
 * @route GET /api/chat/unread
 */
router.get("/unread", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  logger.info(`Getting unread message count for user: ${req.user.id}`);
  
  const count = await chatService.getUnreadMessageCount(req.user.id);
  
  return res.json({
    success: true,
    data: { count }
  });
}));

export default router;