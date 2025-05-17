/**
 * Payment service routes
 */
import express, { Request, Response, Router } from 'express';
import { paymentControllers } from './controllers';
import { asyncHandler } from '../../../shared/middleware/error';
import { authenticate } from '../../../shared/middleware/auth';
import { createLogger } from '../../../shared/utils/logger';

// Create router for the payment service
const router: Router = express.Router();
const logger = createLogger('payment-service-routes');

// Get all subscription plans
router.get('/plans', asyncHandler(async (req: Request, res: Response) => {
  const result = await paymentControllers.getSubscriptionPlans();
  res.json(result);
}));

// Create a new consultation payment
router.post('/consultation/:consultationId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const consultationId = parseInt(req.params.consultationId);
  const userId = req.user!.id;
  const { amount } = req.body;
  
  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      error: 'invalid_amount',
      message: 'Amount must be greater than 0'
    });
  }
  
  const result = await paymentControllers.createConsultationPayment(
    userId, 
    consultationId, 
    amount, 
    req.user
  );
  
  res.status(201).json(result);
}));

// Create a new template payment
router.post('/template/:templateId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const templateId = parseInt(req.params.templateId);
  const userId = req.user!.id;
  const { amount } = req.body;
  
  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      error: 'invalid_amount',
      message: 'Amount must be greater than 0'
    });
  }
  
  const result = await paymentControllers.createTemplatePayment(
    userId, 
    templateId, 
    amount, 
    req.user
  );
  
  res.status(201).json(result);
}));

// Create a new subscription
router.post('/subscription', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { planId } = req.body;
  
  if (!planId) {
    return res.status(400).json({
      success: false,
      error: 'missing_plan_id',
      message: 'Plan ID is required'
    });
  }
  
  const result = await paymentControllers.createUserSubscription(
    userId, 
    planId, 
    req.user
  );
  
  res.status(201).json(result);
}));

// Get user subscription details
router.get('/subscription', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  const result = await paymentControllers.getUserSubscription(userId);
  res.json(result);
}));

// Cancel user subscription
router.delete('/subscription/:subscriptionId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { subscriptionId } = req.params;
  
  const result = await paymentControllers.cancelUserSubscription(userId, subscriptionId);
  res.json(result);
}));

// Payment webhook endpoint (no authentication required)
router.post('/webhook', asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['x-cashfree-signature'] as string;
  
  if (!signature) {
    return res.status(400).json({
      success: false,
      error: 'missing_signature',
      message: 'Cashfree signature is required'
    });
  }
  
  const result = await paymentControllers.verifyPaymentWebhook(req.body, signature);
  res.json(result);
}));

// Service status endpoint
router.get('/status', (req: Request, res: Response) => {
  const status = paymentControllers.getStatus();
  res.json(status);
});

export const routes = router;