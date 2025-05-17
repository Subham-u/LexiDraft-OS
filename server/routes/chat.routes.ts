/**
 * Chat routes for real-time messaging
 */
import express, { Router, Request, Response } from 'express';
import { asyncHandler, ApiError } from '../middleware/error';
import { authenticate } from '../middleware/auth';
import { createLogger } from '../utils/logger';
import * as chatService from '../services/chat.service';

const router: Router = express.Router();
const logger = createLogger('chat-routes');

/**
 * Get all chat rooms for authenticated user
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
 * Create a new chat room
 * @route POST /api/chat/rooms
 */
router.post("/rooms", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const { type, participants, name } = req.body;
  
  if (!type || !participants || !participants.length) {
    throw ApiError.badRequest('Type and participants are required');
  }
  
  // Ensure current user is included in participants
  if (!participants.includes(req.user.id)) {
    participants.push(req.user.id);
  }
  
  logger.info(`Creating ${type} chat room for user: ${req.user.id}`);
  
  const roomData = {
    type,
    participants,
    name,
    lastMessageAt: new Date()
  };
  
  const room = await chatService.createChatRoom(roomData);
  
  return res.status(201).json({
    success: true,
    data: room
  });
}));

/**
 * Get chat room by ID
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
  
  // Check if user is a participant
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
  
  const { limit = 50, before } = req.query;
  
  logger.info(`Getting messages for chat room: ${roomId}`);
  
  // Verify room exists and user is a participant
  const room = await chatService.getChatRoomById(roomId);
  
  if (!room) {
    throw ApiError.notFound('Chat room not found');
  }
  
  if (!room.participants.includes(req.user.id)) {
    throw ApiError.forbidden('You do not have access to this chat room');
  }
  
  const messages = await chatService.getChatRoomMessages(
    roomId,
    Number(limit),
    before ? new Date(before as string) : undefined
  );
  
  // Mark messages as read for this user
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
  
  const { content, attachments } = req.body;
  
  if (!content && (!attachments || !attachments.length)) {
    throw ApiError.badRequest('Message content or attachments are required');
  }
  
  logger.info(`Sending message to chat room: ${roomId}`);
  
  // Verify room exists and user is a participant
  const room = await chatService.getChatRoomById(roomId);
  
  if (!room) {
    throw ApiError.notFound('Chat room not found');
  }
  
  if (!room.participants.includes(req.user.id)) {
    throw ApiError.forbidden('You do not have access to this chat room');
  }
  
  const messageData = {
    roomId,
    senderId: req.user.id,
    content: content || '',
    attachments: attachments || [],
    read: false
  };
  
  const message = await chatService.sendChatMessage(messageData);
  
  return res.status(201).json({
    success: true,
    data: message
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
  
  logger.info(`Marking messages as read in room: ${roomId}`);
  
  // Verify room exists and user is a participant
  const room = await chatService.getChatRoomById(roomId);
  
  if (!room) {
    throw ApiError.notFound('Chat room not found');
  }
  
  if (!room.participants.includes(req.user.id)) {
    throw ApiError.forbidden('You do not have access to this chat room');
  }
  
  await chatService.markMessagesAsRead(roomId, req.user.id);
  
  return res.json({
    success: true,
    message: 'Messages marked as read'
  });
}));

/**
 * Get unread message count
 * @route GET /api/chat/unread/count
 */
router.get("/unread/count", authenticate(), asyncHandler(async (req: Request, res: Response) => {
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

/**
 * Create or get a direct message room with another user
 * @route POST /api/chat/direct/:userId
 */
router.post("/direct/:userId", authenticate(), asyncHandler(async (req: Request, res: Response) => {
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
  
  logger.info(`Creating/getting direct message room between users ${req.user.id} and ${otherUserId}`);
  
  const room = await chatService.getOrCreateDirectMessageRoom(req.user.id, otherUserId);
  
  return res.json({
    success: true,
    data: room
  });
}));

export default router;