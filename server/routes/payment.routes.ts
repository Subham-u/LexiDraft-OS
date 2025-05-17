/**
 * Payment routes for handling payment operations
 */
import express, { Router, Request, Response } from 'express';
import { asyncHandler, ApiError } from '../middleware/error';
import { authenticate, requireRole } from '../middleware/auth';
import { createLogger } from '../utils/logger';
import * as paymentService from '../services/payment.service';

const router: Router = express.Router();
const logger = createLogger('payment-routes');

/**
 * Get all payments for the authenticated user
 * @route GET /api/payments
 */
router.get("/", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  logger.info(`Getting payments for user: ${req.user.id}`);
  
  const payments = await paymentService.getUserPayments(req.user.id);
  
  return res.json({
    success: true,
    data: payments
  });
}));

/**
 * Get payment by ID
 * @route GET /api/payments/:id
 */
router.get("/:id", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const paymentId = parseInt(req.params.id);
  
  if (isNaN(paymentId)) {
    throw ApiError.badRequest('Invalid payment ID');
  }
  
  logger.info(`Getting payment: ${paymentId}`);
  
  const payment = await paymentService.getPaymentById(paymentId);
  
  if (!payment) {
    throw ApiError.notFound('Payment not found');
  }
  
  // Check if payment belongs to user or user is admin
  if (payment.userId !== req.user.id && req.user.role !== 'admin') {
    throw ApiError.forbidden('You do not have permission to view this payment');
  }
  
  return res.json({
    success: true,
    data: payment
  });
}));

/**
 * Create a new payment
 * @route POST /api/payments
 */
router.post("/", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  logger.info(`Creating payment for user: ${req.user.id}`);
  
  // Add user ID to payment data
  const paymentData = {
    ...req.body,
    userId: req.user.id
  };
  
  const newPayment = await paymentService.createPayment(paymentData);
  
  return res.status(201).json({
    success: true,
    data: newPayment
  });
}));

/**
 * Update payment status
 * @route PATCH /api/payments/:id/status
 */
router.patch("/:id/status", authenticate(), requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const paymentId = parseInt(req.params.id);
  
  if (isNaN(paymentId)) {
    throw ApiError.badRequest('Invalid payment ID');
  }
  
  const { status, metadata } = req.body;
  
  if (!status) {
    throw ApiError.badRequest('Status is required');
  }
  
  logger.info(`Updating payment ${paymentId} status to: ${status}`);
  
  const updatedPayment = await paymentService.updatePaymentStatus(paymentId, status, metadata);
  
  return res.json({
    success: true,
    data: updatedPayment
  });
}));

/**
 * Get payments by entity
 * @route GET /api/payments/entity/:type/:id
 */
router.get("/entity/:type/:id", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const entityType = req.params.type;
  const entityId = parseInt(req.params.id);
  
  if (isNaN(entityId)) {
    throw ApiError.badRequest('Invalid entity ID');
  }
  
  logger.info(`Getting payments for ${entityType} ID: ${entityId}`);
  
  const payments = await paymentService.getPaymentsForEntity(entityType, entityId);
  
  // Filter payments to only show those belonging to the user (unless admin)
  const filteredPayments = req.user.role === 'admin' 
    ? payments 
    : payments.filter(p => p.userId === req.user?.id);
  
  return res.json({
    success: true,
    data: filteredPayments
  });
}));

/**
 * Webhook for payment provider callbacks
 * @route POST /api/payments/webhook
 */
router.post("/webhook", asyncHandler(async (req: Request, res: Response) => {
  logger.info('Payment webhook received');
  
  // Extract relevant data from webhook payload
  const { paymentId, status, reference, meta } = req.body;
  
  // Update payment status in our system
  if (paymentId) {
    const payment = await paymentService.getPaymentByProviderReference(paymentId);
    
    if (payment) {
      await paymentService.updatePaymentStatus(payment.id, status, meta);
    } else {
      logger.warn(`Payment with provider ID ${paymentId} not found`);
    }
  }
  
  // Always return success to webhook calls
  return res.status(200).json({
    success: true,
    message: 'Webhook processed'
  });
}));

export default router;