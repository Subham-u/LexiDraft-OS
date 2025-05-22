/**
 * API Routes for Frontend Integration
 */
import express, { Router, Request, Response } from 'express';
import { 
  mockContractAnalysis, 
  mockNotifications, 
  mockUnreadCount,
  mockChatRooms,
  mockChatMessages
} from './mock-responses';
import userRoutes from './user.routes';

const router: Router = express.Router();

// User management routes
router.use(userRoutes);

// Contract analysis
router.get('/contracts/analysis/:id', (req: Request, res: Response) => {
  return res.json(mockContractAnalysis);
});

// Notifications
router.get('/notifications', (req: Request, res: Response) => {
  return res.json(mockNotifications);
});

// Unread notification count
router.get('/notifications/unread', (req: Request, res: Response) => {
  return res.json(mockUnreadCount);
});

// Mark notification as read
router.patch('/notifications/:id/read', (req: Request, res: Response) => {
  return res.json({ success: true });
});

// Mark all notifications as read
router.patch('/notifications/read-all', (req: Request, res: Response) => {
  return res.json({ success: true });
});

// Chat rooms
router.get('/chat/rooms', (req: Request, res: Response) => {
  return res.json(mockChatRooms);
});

// Chat messages
router.get('/chat/rooms/:id/messages', (req: Request, res: Response) => {
  return res.json(mockChatMessages);
});

export default router;