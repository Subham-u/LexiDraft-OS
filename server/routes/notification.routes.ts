/**
 * Notification routes for managing user notifications
 */
import express, { Router, Request, Response } from 'express';
import { asyncHandler, ApiError } from '../middleware/error';
import { authenticate } from '../middleware/auth';
import { createLogger } from '../utils/logger';
import * as notificationService from '../services/notification.service';
import { z } from 'zod';

const router: Router = express.Router();
const logger = createLogger('notification-routes');

/**
 * Get all notifications for authenticated user
 * @route GET /api/notifications
 */
router.get("/", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  // Parse query parameters
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
  const unreadOnly = req.query.unreadOnly === 'true';
  
  logger.info(`Getting notifications for user: ${req.user.id}`);
  
  const notifications = await notificationService.getUserNotifications(
    req.user.id,
    limit,
    offset,
    unreadOnly
  );
  
  return res.json({
    success: true,
    data: notifications
  });
}));

/**
 * Get unread notification count for authenticated user
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
 * Mark a notification as read
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
  
  // First check if the notification belongs to the user
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
 * Mark all notifications as read for authenticated user
 * @route PATCH /api/notifications/read-all
 */
router.patch("/read-all", authenticate(), asyncHandler(async (req: Request, res: Response) => {
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
 * Delete a notification
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
  
  // First check if the notification belongs to the user
  const notification = await notificationService.getNotificationById(notificationId);
  
  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }
  
  if (notification.userId !== req.user.id) {
    throw ApiError.forbidden('You do not have permission to delete this notification');
  }
  
  await notificationService.deleteNotification(notificationId);
  
  return res.json({
    success: true,
    message: 'Notification deleted successfully'
  });
}));

/**
 * Delete all notifications for authenticated user
 * @route DELETE /api/notifications/all
 */
router.delete("/all", authenticate(), asyncHandler(async (req: Request, res: Response) => {
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