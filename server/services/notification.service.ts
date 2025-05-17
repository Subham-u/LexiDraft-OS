/**
 * Notification service
 */
import { db } from '../db';
import { eq, and, desc } from 'drizzle-orm';
import { notifications } from '../../shared/schema';
import { createLogger } from '../utils/logger';
import * as websocketService from './websocket.service';

const logger = createLogger('notification-service');

/**
 * Get user notifications
 */
export async function getUserNotifications(
  userId: number, 
  limit: number = 10, 
  offset: number = 0,
  unreadOnly: boolean = false
) {
  try {
    let query = db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
    
    if (unreadOnly) {
      query = db
        .select()
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        ))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset);
    }
    
    return await query;
  } catch (error) {
    logger.error(`Error getting user notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId: number) {
  try {
    const result = await db
      .select({ count: notifications })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.read, false)
      ));
    
    return result?.[0]?.count || 0;
  } catch (error) {
    logger.error(`Error getting unread notification count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return 0;
  }
}

/**
 * Create notification
 */
export async function createNotification(notification: any) {
  try {
    const [result] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    
    // Send real-time notification if user is connected
    if (result) {
      websocketService.sendUserNotification(result.userId, result);
    }
    
    return result;
  } catch (error) {
    logger.error(`Error creating notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: number) {
  try {
    const [result] = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, notificationId))
      .returning();
    
    return result;
  } catch (error) {
    logger.error(`Error marking notification as read: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(userId: number) {
  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
    
    return true;
  } catch (error) {
    logger.error(`Error marking all notifications as read: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}