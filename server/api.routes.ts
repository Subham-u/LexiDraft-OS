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
} from './routes/mock-responses';

const router: Router = express.Router();

// Contract analysis
router.get('/api/contracts/analysis/:id', (req: Request, res: Response) => {
  return res.json(mockContractAnalysis);
});

// Notifications
router.get('/api/notifications', (req: Request, res: Response) => {
  return res.json(mockNotifications);
});

// Unread notification count
router.get('/api/notifications/unread', (req: Request, res: Response) => {
  return res.json(mockUnreadCount);
});

// Mark notification as read
router.patch('/api/notifications/:id/read', (req: Request, res: Response) => {
  return res.json({ success: true });
});

// Mark all notifications as read
router.patch('/api/notifications/read-all', (req: Request, res: Response) => {
  return res.json({ success: true });
});

// Chat rooms
router.get('/api/chat/rooms', (req: Request, res: Response) => {
  return res.json(mockChatRooms);
});

// Chat messages
router.get('/api/chat/rooms/:id/messages', (req: Request, res: Response) => {
  return res.json(mockChatMessages);
});

export default router;