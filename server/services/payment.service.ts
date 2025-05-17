/**
 * Payment service for handling payment operations
 */
import { db } from '../db';
import { eq, and } from 'drizzle-orm';
import { payments, type Payment, type InsertPayment, paymentStatusEnum } from '../../shared/schema';
import { createLogger } from '../utils/logger';
import { ApiError } from '../middleware/error';

const logger = createLogger('payment-service');

/**
 * Create a new payment record
 */
export async function createPayment(paymentData: Omit<InsertPayment, 'createdAt' | 'updatedAt'>): Promise<Payment> {
  try {
    logger.info(`Creating payment for user: ${paymentData.userId}`);
    
    const [newPayment] = await db
      .insert(payments)
      .values(paymentData)
      .returning();
    
    return newPayment;
  } catch (error) {
    logger.error('Error creating payment', error);
    throw error;
  }
}

/**
 * Get payment by ID
 */
export async function getPaymentById(id: number): Promise<Payment | null> {
  try {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id));
    
    return payment || null;
  } catch (error) {
    logger.error(`Error getting payment with ID: ${id}`, error);
    throw error;
  }
}

/**
 * Get payments for a user
 */
export async function getUserPayments(userId: number): Promise<Payment[]> {
  try {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(payments.createdAt);
  } catch (error) {
    logger.error(`Error getting payments for user: ${userId}`, error);
    throw error;
  }
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  id: number, 
  status: typeof paymentStatusEnum.enumValues[number],
  metadata?: any
): Promise<Payment> {
  try {
    const payment = await getPaymentById(id);
    
    if (!payment) {
      throw ApiError.notFound('Payment not found');
    }
    
    const [updatedPayment] = await db
      .update(payments)
      .set({ 
        status,
        metadata: metadata ? { ...payment.metadata, ...metadata } : payment.metadata,
        updatedAt: new Date()
      })
      .where(eq(payments.id, id))
      .returning();
    
    logger.info(`Updated payment ${id} status to: ${status}`);
    
    return updatedPayment;
  } catch (error) {
    logger.error(`Error updating payment status: ${id}`, error);
    throw error;
  }
}

/**
 * Get payment by provider reference
 */
export async function getPaymentByProviderReference(
  paymentProviderId: string
): Promise<Payment | null> {
  try {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.paymentProviderId, paymentProviderId));
    
    return payment || null;
  } catch (error) {
    logger.error(`Error getting payment with provider ID: ${paymentProviderId}`, error);
    throw error;
  }
}

/**
 * Get payments related to an entity (contract, consultation, etc.)
 */
export async function getPaymentsForEntity(
  relatedEntityType: string,
  relatedEntityId: number
): Promise<Payment[]> {
  try {
    return await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.relatedEntityType, relatedEntityType),
          eq(payments.relatedEntityId, relatedEntityId)
        )
      )
      .orderBy(payments.createdAt);
  } catch (error) {
    logger.error(`Error getting payments for ${relatedEntityType} ID: ${relatedEntityId}`, error);
    throw error;
  }
}

/**
 * Get payments with a specific status
 */
export async function getPaymentsByStatus(
  status: typeof paymentStatusEnum.enumValues[number]
): Promise<Payment[]> {
  try {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.status, status))
      .orderBy(payments.createdAt);
  } catch (error) {
    logger.error(`Error getting payments with status: ${status}`, error);
    throw error;
  }
}