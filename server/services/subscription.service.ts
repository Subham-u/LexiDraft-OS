/**
 * Subscription service for managing user subscriptions
 */
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { 
  subscriptions, 
  type Subscription, 
  type InsertSubscription, 
  subscriptionStatusEnum,
  subscriptionPlanEnum
} from '../../shared/schema';
import { createLogger } from '../utils/logger';
import { ApiError } from '../middleware/error';

const logger = createLogger('subscription-service');

/**
 * Create a new subscription
 */
export async function createSubscription(
  subscriptionData: Omit<InsertSubscription, 'createdAt' | 'updatedAt'>
): Promise<Subscription> {
  try {
    logger.info(`Creating subscription for user: ${subscriptionData.userId}`);
    
    // Check if user already has an active subscription
    const existingSubscription = await getUserActiveSubscription(subscriptionData.userId);
    
    if (existingSubscription) {
      logger.warn(`User ${subscriptionData.userId} already has an active subscription: ${existingSubscription.id}`);
      throw ApiError.conflict('User already has an active subscription');
    }
    
    const [newSubscription] = await db
      .insert(subscriptions)
      .values(subscriptionData)
      .returning();
    
    logger.info(`Created subscription: ${newSubscription.id}`);
    return newSubscription;
  } catch (error) {
    logger.error('Error creating subscription', error);
    throw error;
  }
}

/**
 * Get subscription by ID
 */
export async function getSubscriptionById(id: number): Promise<Subscription | null> {
  try {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id));
    
    return subscription || null;
  } catch (error) {
    logger.error(`Error getting subscription with ID: ${id}`, error);
    throw error;
  }
}

/**
 * Get all subscriptions for a user
 */
export async function getUserSubscriptions(userId: number): Promise<Subscription[]> {
  try {
    return await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(subscriptions.createdAt);
  } catch (error) {
    logger.error(`Error getting subscriptions for user: ${userId}`, error);
    throw error;
  }
}

/**
 * Get active subscription for a user
 */
export async function getUserActiveSubscription(userId: number): Promise<Subscription | null> {
  try {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .where(eq(subscriptions.status, 'active'));
    
    return subscription || null;
  } catch (error) {
    logger.error(`Error getting active subscription for user: ${userId}`, error);
    throw error;
  }
}

/**
 * Update subscription status
 */
export async function updateSubscriptionStatus(
  id: number,
  status: typeof subscriptionStatusEnum.enumValues[number],
  metadata?: any
): Promise<Subscription> {
  try {
    const subscription = await getSubscriptionById(id);
    
    if (!subscription) {
      throw ApiError.notFound('Subscription not found');
    }
    
    const [updatedSubscription] = await db
      .update(subscriptions)
      .set({ 
        status,
        metadata: metadata ? { ...subscription.metadata, ...metadata } : subscription.metadata,
        updatedAt: new Date()
      })
      .where(eq(subscriptions.id, id))
      .returning();
    
    logger.info(`Updated subscription ${id} status to: ${status}`);
    
    return updatedSubscription;
  } catch (error) {
    logger.error(`Error updating subscription status: ${id}`, error);
    throw error;
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  id: number,
  cancelAtPeriodEnd: boolean = true
): Promise<Subscription> {
  try {
    const subscription = await getSubscriptionById(id);
    
    if (!subscription) {
      throw ApiError.notFound('Subscription not found');
    }
    
    if (subscription.status === 'cancelled') {
      return subscription;
    }
    
    const updates: Partial<Subscription> = {
      cancelAtPeriodEnd,
      updatedAt: new Date()
    };
    
    // If not cancelling at period end, update status to cancelled immediately
    if (!cancelAtPeriodEnd) {
      updates.status = 'cancelled';
    }
    
    const [updatedSubscription] = await db
      .update(subscriptions)
      .set(updates)
      .where(eq(subscriptions.id, id))
      .returning();
    
    logger.info(`Cancelled subscription: ${id}, cancelAtPeriodEnd: ${cancelAtPeriodEnd}`);
    
    return updatedSubscription;
  } catch (error) {
    logger.error(`Error cancelling subscription: ${id}`, error);
    throw error;
  }
}

/**
 * Check if user has access to a specific plan feature
 */
export async function hasSubscriptionAccess(
  userId: number,
  requiredPlan: typeof subscriptionPlanEnum.enumValues[number]
): Promise<boolean> {
  try {
    const subscription = await getUserActiveSubscription(userId);
    
    if (!subscription) {
      return false;
    }
    
    // Plan hierarchy (from lowest to highest)
    const planHierarchy = ['free', 'basic', 'professional', 'enterprise'];
    
    const requiredPlanIndex = planHierarchy.indexOf(requiredPlan);
    const userPlanIndex = planHierarchy.indexOf(subscription.plan);
    
    // User has access if their plan is at or above the required plan level
    return userPlanIndex >= requiredPlanIndex;
  } catch (error) {
    logger.error(`Error checking subscription access for user: ${userId}`, error);
    return false;
  }
}