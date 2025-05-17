/**
 * Notification service for managing user notifications
 */
import { db } from '../db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { 
  notifications, 
  type Notification, 
  type InsertNotification 
} from '../../shared/schema';
import { createLogger } from '../utils/logger';
import { ApiError } from '../middleware/error';

const logger = createLogger('notification-service');

/**
 * Create a new notification
 */
export async function createNotification(
  notificationData: Omit<InsertNotification, 'createdAt'>
): Promise<Notification> {
  try {
    logger.info(`Creating notification for user: ${notificationData.userId}`);
    
    const [newNotification] = await db
      .insert(notifications)
      .values(notificationData)
      .returning();
    
    return newNotification;
  } catch (error) {
    logger.error('Error creating notification', error);
    throw error;
  }
}

/**
 * Get notification by ID
 */
export async function getNotificationById(id: number): Promise<Notification | null> {
  try {
    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));
    
    return notification || null;
  } catch (error) {
    logger.error(`Error getting notification with ID: ${id}`, error);
    throw error;
  }
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
  userId: number, 
  limit: number = 20, 
  offset: number = 0,
  unreadOnly: boolean = false
): Promise<Notification[]> {
  try {
    let query = db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId));
    
    if (unreadOnly) {
      query = query.where(eq(notifications.read, false));
    }
    
    return await query
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
  } catch (error) {
    logger.error(`Error getting notifications for user: ${userId}`, error);
    throw error;
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(id: number): Promise<Notification> {
  try {
    const notification = await getNotificationById(id);
    
    if (!notification) {
      throw ApiError.notFound('Notification not found');
    }
    
    if (notification.read) {
      return notification; // Already read
    }
    
    const [updatedNotification] = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    
    return updatedNotification;
  } catch (error) {
    logger.error(`Error marking notification as read: ${id}`, error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: number): Promise<void> {
  try {
    await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        )
      );
    
    logger.info(`Marked all notifications as read for user: ${userId}`);
  } catch (error) {
    logger.error(`Error marking all notifications as read for user: ${userId}`, error);
    throw error;
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(id: number): Promise<void> {
  try {
    const notification = await getNotificationById(id);
    
    if (!notification) {
      throw ApiError.notFound('Notification not found');
    }
    
    await db
      .delete(notifications)
      .where(eq(notifications.id, id));
    
    logger.info(`Deleted notification: ${id}`);
  } catch (error) {
    logger.error(`Error deleting notification: ${id}`, error);
    throw error;
  }
}

/**
 * Delete all notifications for a user
 */
export async function deleteAllNotifications(userId: number): Promise<void> {
  try {
    await db
      .delete(notifications)
      .where(eq(notifications.userId, userId));
    
    logger.info(`Deleted all notifications for user: ${userId}`);
  } catch (error) {
    logger.error(`Error deleting all notifications for user: ${userId}`, error);
    throw error;
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: number): Promise<number> {
  try {
    const result = await db
      .select({ count: sql`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        )
      );
    
    return parseInt(result[0].count.toString());
  } catch (error) {
    logger.error(`Error getting unread notification count for user: ${userId}`, error);
    throw error;
  }
}