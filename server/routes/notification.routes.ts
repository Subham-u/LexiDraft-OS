/**
 * Notification routes for managing user notifications
 */
import express, { Router, Request, Response } from 'express';
import { asyncHandler, ApiError } from '../middleware/error';
import { authenticate } from '../middleware/auth';
import { createLogger } from '../utils/logger';
import * as notificationService from '../services/notification.service';

const router: Router = express.Router();
const logger = createLogger('notification-routes');

/**
 * Get all notifications for the authenticated user
 * @route GET /api/notifications
 */
router.get("/", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const { limit = 20, offset = 0, unreadOnly = false } = req.query;
  
  logger.info(`Getting notifications for user: ${req.user.id}`);
  
  const notifications = await notificationService.getUserNotifications(
    req.user.id,
    Number(limit),
    Number(offset),
    unreadOnly === 'true'
  );
  
  return res.json({
    success: true,
    data: notifications
  });
}));

/**
 * Get unread notification count
 * @route GET /api/notifications/unread/count
 */
router.get("/unread/count", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  logger.info(`Getting unread notification count for user: ${req.user.id}`);
  
  const count = await notificationService.getUnreadNotificationCount(req.user.id);
  
  return res.json({
    success: true,
    data: { count }
  });
}));

/**
 * Mark notification as read
 * @route PATCH /api/notifications/:id/read
 */
router.patch("/:id/read", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const notificationId = parseInt(req.params.id);
  
  if (isNaN(notificationId)) {
    throw ApiError.badRequest('Invalid notification ID');
  }
  
  logger.info(`Marking notification ${notificationId} as read`);
  
  // Check if notification belongs to user
  const notification = await notificationService.getNotificationById(notificationId);
  
  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }
  
  if (notification.userId !== req.user.id) {
    throw ApiError.forbidden('You do not have permission to modify this notification');
  }
  
  const updatedNotification = await notificationService.markNotificationAsRead(notificationId);
  
  return res.json({
    success: true,
    data: updatedNotification
  });
}));

/**
 * Mark all notifications as read
 * @route POST /api/notifications/read-all
 */
router.post("/read-all", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  logger.info(`Marking all notifications as read for user: ${req.user.id}`);
  
  await notificationService.markAllNotificationsAsRead(req.user.id);
  
  return res.json({
    success: true,
    message: 'All notifications marked as read'
  });
}));

/**
 * Delete notification
 * @route DELETE /api/notifications/:id
 */
router.delete("/:id", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const notificationId = parseInt(req.params.id);
  
  if (isNaN(notificationId)) {
    throw ApiError.badRequest('Invalid notification ID');
  }
  
  logger.info(`Deleting notification: ${notificationId}`);
  
  // Check if notification belongs to user
  const notification = await notificationService.getNotificationById(notificationId);
  
  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }
  
  if (notification.userId !== req.user.id && req.user.role !== 'admin') {
    throw ApiError.forbidden('You do not have permission to delete this notification');
  }
  
  await notificationService.deleteNotification(notificationId);
  
  return res.json({
    success: true,
    message: 'Notification deleted successfully'
  });
}));

/**
 * Delete all notifications
 * @route DELETE /api/notifications
 */
router.delete("/", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  logger.info(`Deleting all notifications for user: ${req.user.id}`);
  
  await notificationService.deleteAllNotifications(req.user.id);
  
  return res.json({
    success: true,
    message: 'All notifications deleted successfully'
  });
}));

export default router;