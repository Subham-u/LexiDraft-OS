/**
 * Payment routes
 */
import express, { Router, Request, Response } from 'express';
import { authenticate } from '../shared/middleware/auth';
import { asyncHandler, ApiError } from '../shared/middleware/error';
import { createLogger } from '../shared/utils/logger';
import { 
  createPaymentLink, 
  getPaymentLinkDetails, 
  createSubscriptionPlan, 
  createSubscription,
  getSubscriptionDetails,
  cancelSubscription,
  verifyPaymentSignature,
  createPaymentOrder,
  PaymentType 
} from "../services/cashfreeService";

const router: Router = express.Router();
const logger = createLogger('payment-routes');

/**
 * Verify payment
 */
router.post("/verify-payment", asyncHandler(async (req: Request, res: Response) => {
  const { orderId, referenceId, txStatus } = req.body;
  
  if (!orderId || !referenceId || !txStatus) {
    throw ApiError.badRequest("Missing required parameters");
  }

  logger.info(`Verifying payment for order: ${orderId}`);
  
  // In a production environment, you would verify this against Cashfree's API
  // For now, we're just checking the txStatus parameter
  if (txStatus === 'SUCCESS') {
    // Update payment status in your database
    // For example, you might update a consultation payment status
    
    return res.json({
      success: true,
      message: "Payment verified successfully",
      orderId,
      referenceId,
    });
  } else {
    return res.json({
      success: false,
      message: "Payment failed or cancelled",
      orderId,
      referenceId,
      error: "Transaction status indicates failure",
    });
  }
}));

/**
 * Verify subscription
 */
router.post("/verify-subscription", asyncHandler(async (req: Request, res: Response) => {
  const { subscriptionId, referenceId, txStatus } = req.body;
  
  if (!subscriptionId || !referenceId || !txStatus) {
    throw ApiError.badRequest("Missing required parameters");
  }

  logger.info(`Verifying subscription: ${subscriptionId}`);
  
  // In a production environment, you would verify this against Cashfree's API
  // For now, we're just checking the txStatus parameter
  if (txStatus === 'SUCCESS') {
    // Update subscription status in your database
    // For example:
    // await storage.updateUserSubscription(userId, {
    //   subscriptionId,
    //   status: 'active'
    // });
    
    return res.json({
      success: true,
      message: "Subscription verified successfully",
      subscriptionId,
      referenceId,
    });
  } else {
    return res.json({
      success: false,
      message: "Subscription payment failed or cancelled",
      subscriptionId,
      referenceId,
      error: "Transaction status indicates failure",
    });
  }
}));

/**
 * Create a payment order
 */
router.post("/create-order", authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const { 
    amount, 
    currency = 'INR', 
    paymentType, 
    productInfo, 
    returnUrl 
  } = req.body;
  
  if (!amount || !paymentType || !productInfo || !returnUrl) {
    throw ApiError.badRequest("Missing required parameters");
  }
  
  logger.info(`Creating payment order for user: ${req.user.id}`);
  
  const orderData = {
    orderId: `ORDER-${Date.now()}-${req.user.id}`,
    orderAmount: parseFloat(amount),
    orderCurrency: currency,
    customerEmail: req.user.email || 'customer@example.com',
    customerPhone: req.user.phone || '9999999999',
    customerName: req.user.fullName || 'Customer',
    returnUrl,
    paymentType: paymentType as PaymentType,
    productInfo
  };
  
  const orderResponse = await createPaymentOrder(orderData);
  
  return res.json({
    success: true,
    data: orderResponse
  });
}));

/**
 * Create a payment link
 */
router.post("/create-link", authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const { 
    amount, 
    currency = 'INR', 
    paymentType, 
    productInfo, 
    returnUrl 
  } = req.body;
  
  if (!amount || !paymentType || !productInfo) {
    throw ApiError.badRequest("Missing required parameters");
  }
  
  logger.info(`Creating payment link for user: ${req.user.id}`);
  
  const linkData = {
    orderId: `LINK-${Date.now()}-${req.user.id}`,
    orderAmount: parseFloat(amount),
    orderCurrency: currency,
    customerEmail: req.user.email || 'customer@example.com',
    customerPhone: req.user.phone || '9999999999',
    customerName: req.user.fullName || 'Customer',
    returnUrl: returnUrl || 'https://lexidraft.app/payment/success',
    paymentType: paymentType as PaymentType,
    productInfo,
    metaData: { userId: req.user.id }
  };
  
  const linkResponse = await createPaymentLink(linkData);
  
  return res.json({
    success: true,
    data: linkResponse
  });
}));

/**
 * Create a subscription
 */
router.post("/create-subscription", authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const { planId, returnUrl } = req.body;
  
  if (!planId) {
    throw ApiError.badRequest("Missing required parameters");
  }
  
  logger.info(`Creating subscription for user: ${req.user.id} to plan: ${planId}`);
  
  const subscriptionId = `SUB-${Date.now()}-${req.user.id}`;
  
  const subscriptionResponse = await createSubscription(
    subscriptionId,
    planId,
    req.user.email || 'customer@example.com',
    req.user.phone || '9999999999',
    req.user.fullName || 'Customer',
    returnUrl || 'https://lexidraft.app/subscription/success',
    new Date().toISOString()
  );
  
  return res.json({
    success: true,
    data: subscriptionResponse
  });
}));

/**
 * Cancel a subscription
 */
router.post("/cancel-subscription", authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const { subscriptionId } = req.body;
  
  if (!subscriptionId) {
    throw ApiError.badRequest("Missing subscription ID");
  }
  
  logger.info(`Canceling subscription: ${subscriptionId} for user: ${req.user.id}`);
  
  const cancellationResponse = await cancelSubscription(subscriptionId);
  
  return res.json({
    success: true,
    data: cancellationResponse
  });
}));

export default router;