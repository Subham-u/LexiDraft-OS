/**
 * Subscription routes for managing user subscriptions
 */
import express, { Router, Request, Response } from 'express';
import { asyncHandler, ApiError } from '../middleware/error';
import { authenticate, requireRole } from '../middleware/auth';
import { createLogger } from '../utils/logger';
import * as subscriptionService from '../services/subscription.service';

const router: Router = express.Router();
const logger = createLogger('subscription-routes');

/**
 * Get authenticated user's subscriptions
 * @route GET /api/subscriptions
 */
router.get("/", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  logger.info(`Getting subscriptions for user: ${req.user.id}`);
  
  const subscriptions = await subscriptionService.getUserSubscriptions(req.user.id);
  
  return res.json({
    success: true,
    data: subscriptions
  });
}));

/**
 * Get active subscription
 * @route GET /api/subscriptions/active
 */
router.get("/active", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  logger.info(`Getting active subscription for user: ${req.user.id}`);
  
  const subscription = await subscriptionService.getUserActiveSubscription(req.user.id);
  
  return res.json({
    success: true,
    data: subscription
  });
}));

/**
 * Get subscription by ID
 * @route GET /api/subscriptions/:id
 */
router.get("/:id", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const subscriptionId = parseInt(req.params.id);
  
  if (isNaN(subscriptionId)) {
    throw ApiError.badRequest('Invalid subscription ID');
  }
  
  logger.info(`Getting subscription: ${subscriptionId}`);
  
  const subscription = await subscriptionService.getSubscriptionById(subscriptionId);
  
  if (!subscription) {
    throw ApiError.notFound('Subscription not found');
  }
  
  // Check if subscription belongs to user or user is admin
  if (subscription.userId !== req.user.id && req.user.role !== 'admin') {
    throw ApiError.forbidden('You do not have permission to view this subscription');
  }
  
  return res.json({
    success: true,
    data: subscription
  });
}));

/**
 * Create a new subscription
 * @route POST /api/subscriptions
 */
router.post("/", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  logger.info(`Creating subscription for user: ${req.user.id}`);
  
  // Add user ID to subscription data
  const subscriptionData = {
    ...req.body,
    userId: req.user.id
  };
  
  const newSubscription = await subscriptionService.createSubscription(subscriptionData);
  
  return res.status(201).json({
    success: true,
    data: newSubscription
  });
}));

/**
 * Update subscription status (admin only)
 * @route PATCH /api/subscriptions/:id/status
 */
router.patch("/:id/status", authenticate(), requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const subscriptionId = parseInt(req.params.id);
  
  if (isNaN(subscriptionId)) {
    throw ApiError.badRequest('Invalid subscription ID');
  }
  
  const { status, metadata } = req.body;
  
  if (!status) {
    throw ApiError.badRequest('Status is required');
  }
  
  logger.info(`Updating subscription ${subscriptionId} status to: ${status}`);
  
  const updatedSubscription = await subscriptionService.updateSubscriptionStatus(subscriptionId, status, metadata);
  
  return res.json({
    success: true,
    data: updatedSubscription
  });
}));

/**
 * Cancel subscription
 * @route POST /api/subscriptions/:id/cancel
 */
router.post("/:id/cancel", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const subscriptionId = parseInt(req.params.id);
  
  if (isNaN(subscriptionId)) {
    throw ApiError.badRequest('Invalid subscription ID');
  }
  
  const { cancelAtPeriodEnd = true } = req.body;
  
  logger.info(`Cancelling subscription ${subscriptionId} for user: ${req.user.id}`);
  
  // Get subscription to check permissions
  const subscription = await subscriptionService.getSubscriptionById(subscriptionId);
  
  if (!subscription) {
    throw ApiError.notFound('Subscription not found');
  }
  
  // Check if subscription belongs to user or user is admin
  if (subscription.userId !== req.user.id && req.user.role !== 'admin') {
    throw ApiError.forbidden('You do not have permission to cancel this subscription');
  }
  
  const cancelledSubscription = await subscriptionService.cancelSubscription(subscriptionId, cancelAtPeriodEnd);
  
  return res.json({
    success: true,
    data: cancelledSubscription
  });
}));

/**
 * Check access to feature (based on subscription plan)
 * @route GET /api/subscriptions/access/:plan
 */
router.get("/access/:plan", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const plan = req.params.plan;
  
  if (!plan) {
    throw ApiError.badRequest('Plan is required');
  }
  
  logger.info(`Checking access to ${plan} for user: ${req.user.id}`);
  
  const hasAccess = await subscriptionService.hasSubscriptionAccess(req.user.id, plan);
  
  return res.json({
    success: true,
    data: {
      hasAccess
    }
  });
}));

export default router;