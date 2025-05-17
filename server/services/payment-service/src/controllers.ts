/**
 * Payment service controllers
 */
import { createLogger } from '../../../shared/utils/logger';
import { ApiError } from '../../../shared/middleware/error';
import { config } from './config';
import { 
  createPaymentOrder, 
  getOrderDetails, 
  verifyPaymentSignature,
  createSubscription,
  getSubscriptionDetails,
  cancelSubscription,
  PaymentType
} from '../../../services/cashfreeService';

const logger = createLogger('payment-service-controllers');

export const paymentControllers = {
  // Get available subscription plans
  getSubscriptionPlans: async () => {
    try {
      // Return the subscription plans from config
      return {
        success: true,
        data: Object.values(config.subscriptionPlans)
      };
    } catch (error) {
      logger.error('Error fetching subscription plans', { error });
      throw error;
    }
  },
  
  // Create a new payment order for consultation
  createConsultationPayment: async (userId: number, consultationId: number, amount: number, userData: any) => {
    try {
      const orderId = `CONSULT-${consultationId}-${Date.now()}`;
      
      const paymentData = {
        orderId,
        orderAmount: amount,
        orderCurrency: 'INR',
        customerEmail: userData.email,
        customerPhone: userData.phone || '9999999999', // Fallback
        customerName: userData.name,
        returnUrl: `${process.env.FRONTEND_URL || 'https://lexidraft.app'}/payment-result`,
        notifyUrl: `${process.env.API_URL || 'https://api.lexidraft.app'}/payment/webhook`,
        paymentType: PaymentType.LAWYER_CONSULTATION,
        productInfo: 'Lawyer Consultation',
        metaData: {
          userId,
          consultationId
        }
      };
      
      const orderResponse = await createPaymentOrder(paymentData);
      
      // Save order information to database here (when implemented)
      
      return {
        success: true,
        data: orderResponse
      };
    } catch (error) {
      logger.error('Error creating consultation payment', { error });
      throw error;
    }
  },
  
  // Create a new payment order for template purchase
  createTemplatePayment: async (userId: number, templateId: number, amount: number, userData: any) => {
    try {
      const orderId = `TEMPLATE-${templateId}-${Date.now()}`;
      
      const paymentData = {
        orderId,
        orderAmount: amount,
        orderCurrency: 'INR',
        customerEmail: userData.email,
        customerPhone: userData.phone || '9999999999', // Fallback
        customerName: userData.name,
        returnUrl: `${process.env.FRONTEND_URL || 'https://lexidraft.app'}/payment-result`,
        notifyUrl: `${process.env.API_URL || 'https://api.lexidraft.app'}/payment/webhook`,
        paymentType: PaymentType.CONTRACT_TEMPLATE,
        productInfo: 'Contract Template',
        metaData: {
          userId,
          templateId
        }
      };
      
      const orderResponse = await createPaymentOrder(paymentData);
      
      // Save order information to database here (when implemented)
      
      return {
        success: true,
        data: orderResponse
      };
    } catch (error) {
      logger.error('Error creating template payment', { error });
      throw error;
    }
  },
  
  // Create a new subscription
  createUserSubscription: async (userId: number, planId: string, userData: any) => {
    try {
      // Get the subscription plan details
      const plan = Object.values(config.subscriptionPlans).find(p => p.id === planId);
      
      if (!plan) {
        throw ApiError.badRequest('Invalid subscription plan');
      }
      
      const subscriptionId = `SUB-${userId}-${Date.now()}`;
      
      // Set the first charge date to now
      const firstChargeDate = new Date().toISOString().split('T')[0];
      
      const subscriptionResponse = await createSubscription(
        subscriptionId,
        planId,
        userData.email,
        userData.phone || '9999999999', // Fallback
        userData.name,
        `${process.env.FRONTEND_URL || 'https://lexidraft.app'}/subscription-result`,
        firstChargeDate
      );
      
      // Save subscription information to database here (when implemented)
      
      return {
        success: true,
        data: subscriptionResponse
      };
    } catch (error) {
      logger.error('Error creating subscription', { error });
      throw error;
    }
  },
  
  // Get user subscription details
  getUserSubscription: async (userId: number) => {
    try {
      // This would typically fetch the subscription from the database
      // And then get the latest details from Cashfree
      
      // For now, we'll return a placeholder response
      // This would be replaced with actual database and API calls
      
      return {
        success: true,
        data: {
          subscriptionId: `SUB-${userId}-123456789`,
          planId: 'pro-monthly',
          status: 'active',
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 999,
          currency: 'INR'
        }
      };
    } catch (error) {
      logger.error(`Error fetching subscription for user ${userId}`, { error });
      throw error;
    }
  },
  
  // Cancel user subscription
  cancelUserSubscription: async (userId: number, subscriptionId: string) => {
    try {
      // Verify that the subscription belongs to the user
      // This would typically check the database
      
      const cancellationResponse = await cancelSubscription(subscriptionId);
      
      // Update subscription status in database (when implemented)
      
      return {
        success: true,
        data: cancellationResponse
      };
    } catch (error) {
      logger.error(`Error cancelling subscription ${subscriptionId}`, { error });
      throw error;
    }
  },
  
  // Verify payment webhook
  verifyPaymentWebhook: async (data: any, signature: string) => {
    try {
      // Verify the signature from Cashfree
      const isValid = verifyPaymentSignature(data, signature);
      
      if (!isValid) {
        throw ApiError.unauthorized('Invalid signature');
      }
      
      // Process the webhook based on event type
      const eventType = data.event;
      const orderId = data.orderId;
      
      logger.info(`Payment webhook received: ${eventType} for order ${orderId}`);
      
      // Handle different event types
      switch (eventType) {
        case 'ORDER_PAID':
          // Process successful payment
          // Update order status in database
          // Trigger any post-payment actions
          break;
          
        case 'PAYMENT_FAILED':
          // Handle failed payment
          // Update order status in database
          break;
          
        case 'SUBSCRIPTION_ACTIVATED':
          // Handle subscription activation
          // Update subscription status in database
          break;
          
        case 'SUBSCRIPTION_CANCELLED':
          // Handle subscription cancellation
          // Update subscription status in database
          break;
          
        default:
          logger.warn(`Unhandled webhook event type: ${eventType}`);
      }
      
      return {
        success: true,
        data: { processed: true, eventType }
      };
    } catch (error) {
      logger.error('Error processing payment webhook', { error });
      throw error;
    }
  },
  
  // Get service status
  getStatus: () => {
    return {
      success: true,
      service: 'payment-service',
      version: config.version,
      status: 'operational',
      timestamp: new Date().toISOString()
    };
  }
};