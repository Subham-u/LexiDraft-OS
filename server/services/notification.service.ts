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
import * as websocketService from './websocket.service';

const logger = createLogger('notification-service');

// Notification types
export const NOTIFICATION_TYPES = {
  CONTRACT_CREATED: 'contract_created',
  CONTRACT_UPDATED: 'contract_updated',
  CONTRACT_SIGNED: 'contract_signed',
  CONTRACT_EXPIRED: 'contract_expired',
  CONTRACT_ANALYSIS_COMPLETE: 'contract_analysis_complete',
  SUBSCRIPTION_CREATED: 'subscription_created',
  SUBSCRIPTION_EXPIRED: 'subscription_expired',
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_FAILED: 'payment_failed',
  NEW_MESSAGE: 'new_message',
  CONSULTATION_SCHEDULED: 'consultation_scheduled',
  CONSULTATION_REMINDER: 'consultation_reminder',
  SYSTEM_ALERT: 'system_alert'
};

/**
 * Create a new notification and send it in real time if user is connected
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
    
    // Send real-time notification if connected
    websocketService.sendUserNotification(notificationData.userId, {
      ...newNotification,
      isRealtime: true
    });
    
    return newNotification;
  } catch (error) {
    logger.error('Error creating notification', error);
    throw error;
  }
}

/**
 * Send a contract created notification
 */
export async function sendContractCreatedNotification(
  userId: number,
  contractId: number,
  contractTitle: string
): Promise<Notification> {
  return createNotification({
    userId,
    type: NOTIFICATION_TYPES.CONTRACT_CREATED,
    title: 'Contract Created',
    message: `Your contract "${contractTitle}" has been created successfully.`,
    read: false,
    metadata: {
      contractId
    },
    relatedEntityId: contractId,
    relatedEntityType: 'contract'
  });
}

/**
 * Send a contract analysis complete notification
 */
export async function sendContractAnalysisCompleteNotification(
  userId: number,
  contractId: number,
  contractTitle: string,
  analysisId: number,
  riskScore: number
): Promise<Notification> {
  const riskLevel = riskScore <= 30 ? 'low' : riskScore <= 70 ? 'moderate' : 'high';
  
  return createNotification({
    userId,
    type: NOTIFICATION_TYPES.CONTRACT_ANALYSIS_COMPLETE,
    title: 'Contract Analysis Complete',
    message: `Analysis of "${contractTitle}" is complete. Risk level: ${riskLevel}.`,
    read: false,
    metadata: {
      contractId,
      analysisId,
      riskScore,
      riskLevel
    },
    relatedEntityId: analysisId,
    relatedEntityType: 'analysis'
  });
}

/**
 * Send a payment notification
 */
export async function sendPaymentNotification(
  userId: number,
  paymentId: number,
  status: 'completed' | 'failed',
  amount: number,
  currency: string,
  paymentType: string
): Promise<Notification> {
  const isSuccess = status === 'completed';
  const title = isSuccess ? 'Payment Successful' : 'Payment Failed';
  const message = isSuccess 
    ? `Your payment of ${currency} ${amount/100} for ${paymentType} was successful.`
    : `Your payment of ${currency} ${amount/100} for ${paymentType} failed. Please try again.`;
  
  return createNotification({
    userId,
    type: isSuccess ? NOTIFICATION_TYPES.PAYMENT_RECEIVED : NOTIFICATION_TYPES.PAYMENT_FAILED,
    title,
    message,
    read: false,
    metadata: {
      paymentId,
      amount,
      currency,
      paymentType
    },
    relatedEntityId: paymentId,
    relatedEntityType: 'payment'
  });
}

/**
 * Send subscription notification
 */
export async function sendSubscriptionNotification(
  userId: number,
  subscriptionId: number,
  status: 'created' | 'expired',
  plan: string
): Promise<Notification> {
  const isCreated = status === 'created';
  const title = isCreated ? 'Subscription Activated' : 'Subscription Expired';
  const message = isCreated 
    ? `Your ${plan} subscription has been activated.`
    : `Your ${plan} subscription has expired. Please renew to continue accessing premium features.`;
  
  return createNotification({
    userId,
    type: isCreated ? NOTIFICATION_TYPES.SUBSCRIPTION_CREATED : NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRED,
    title,
    message,
    read: false,
    metadata: {
      subscriptionId,
      plan
    },
    relatedEntityId: subscriptionId,
    relatedEntityType: 'subscription'
  });
}

/**
 * Send a consultation notification
 */
export async function sendConsultationNotification(
  userId: number,
  consultationId: number,
  lawyerName: string,
  consultationDate: Date,
  isReminder: boolean = false
): Promise<Notification> {
  const type = isReminder ? NOTIFICATION_TYPES.CONSULTATION_REMINDER : NOTIFICATION_TYPES.CONSULTATION_SCHEDULED;
  const title = isReminder ? 'Consultation Reminder' : 'Consultation Scheduled';
  
  const formattedDate = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(consultationDate);
  
  const message = isReminder
    ? `Reminder: Your consultation with ${lawyerName} is scheduled for ${formattedDate}.`
    : `Your consultation with ${lawyerName} has been scheduled for ${formattedDate}.`;
  
  return createNotification({
    userId,
    type,
    title,
    message,
    read: false,
    metadata: {
      consultationId,
      lawyerName,
      consultationDate: consultationDate.toISOString()
    },
    relatedEntityId: consultationId,
    relatedEntityType: 'consultation'
  });
}

/**
 * Send a new message notification
 */
export async function sendNewMessageNotification(
  userId: number,
  messageId: number,
  senderName: string,
  roomId: number,
  messageContent: string,
  roomType: string
): Promise<Notification> {
  // Truncate message content for the notification
  const truncatedContent = messageContent.length > 50 
    ? `${messageContent.substring(0, 50)}...` 
    : messageContent;
  
  // Format notification title based on room type
  let title = 'New Message';
  if (roomType === 'consultation') {
    title = 'New Consultation Message';
  } else if (roomType === 'contract') {
    title = 'New Contract Discussion Message';
  }
  
  return createNotification({
    userId,
    type: NOTIFICATION_TYPES.NEW_MESSAGE,
    title,
    message: `${senderName}: ${truncatedContent}`,
    read: false,
    metadata: {
      messageId,
      roomId,
      senderName,
      roomType
    },
    relatedEntityId: roomId,
    relatedEntityType: 'chat_room'
  });
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