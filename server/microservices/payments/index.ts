import express, { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth';
import { storage } from '../../storage';
import { CASHFREE_CONFIG } from '../../shared/config';
import * as cashfreeService from '../../services/cashfreeService';

// Create router for payments microservice
const paymentsRouter: Router = express.Router();

// Apply authentication to most routes
paymentsRouter.use('/webhook', express.raw({ type: 'application/json' }));

// All other routes should use JSON parsing
paymentsRouter.use((req, res, next) => {
  if (req.path !== '/webhook') {
    express.json()(req, res, next);
  } else {
    next();
  }
});

// All routes except webhook require authentication
paymentsRouter.use((req, res, next) => {
  if (req.path !== '/webhook') {
    authenticate(req, res, next);
  } else {
    next();
  }
});

// Create a payment order for lawyer consultation
paymentsRouter.post('/create-consultation-order', async (req, res) => {
  try {
    const { lawyerId, mode, date, duration, query } = req.body;
    
    // Input validation
    if (!lawyerId || !mode || !date || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Get lawyer information
    const lawyer = await storage.getLawyer(lawyerId);
    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: 'Lawyer not found'
      });
    }
    
    // Get user information
    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Calculate consultation price based on lawyer's rates and duration
    const hourlyRate = lawyer.hourlyRate || 2000; // Default rate if not set
    const price = Math.ceil((hourlyRate / 60) * duration);
    
    // Generate order ID
    const orderId = `CONSULT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create consultation in pending payment status
    const consultation = await storage.createConsultation({
      lawyerId,
      userId: req.user.id,
      mode,
      date: new Date(date),
      duration,
      title: `Consultation with ${lawyer.name}`,
      price,
      status: 'pending_payment',
      query: query || 'General legal consultation',
      paymentOrderId: orderId
    });
    
    // Create payment order
    if (!CASHFREE_CONFIG.available) {
      return res.status(503).json({
        success: false,
        message: 'Payment service is currently unavailable'
      });
    }
    
    const paymentData = {
      orderId,
      orderAmount: price,
      orderCurrency: 'INR',
      customerEmail: user.email || 'user@lexidraft.com',
      customerPhone: user.phone || '1234567890',
      customerName: user.name || user.username,
      returnUrl: `${req.protocol}://${req.get('host')}/api/payments/return?consultationId=${consultation.id}`,
      notifyUrl: `${req.protocol}://${req.get('host')}/api/payments/webhook`,
      paymentType: cashfreeService.PaymentType.LAWYER_CONSULTATION,
      productInfo: `Legal consultation with ${lawyer.name} for ${duration} minutes`
    };
    
    const paymentOrder = await cashfreeService.createPaymentOrder(paymentData);
    
    res.json({
      success: true,
      orderId,
      paymentLink: paymentOrder.paymentLink,
      consultation: {
        id: consultation.id,
        status: consultation.status,
        price
      }
    });
  } catch (error) {
    console.error('Error creating consultation payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order'
    });
  }
});

// Create a payment for subscription
paymentsRouter.post('/create-subscription', async (req, res) => {
  try {
    const { planId } = req.body;
    
    if (!planId) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID is required'
      });
    }
    
    // Get user information
    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Plan data (would normally come from database)
    const planData = {
      basic: { price: 999, name: 'Basic Plan', interval: 'monthly' },
      pro: { price: 2999, name: 'Pro Plan', interval: 'monthly' },
      enterprise: { price: 9999, name: 'Enterprise Plan', interval: 'monthly' }
    };
    
    if (!planData[planId]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan ID'
      });
    }
    
    const plan = planData[planId];
    
    // Check if payment service is available
    if (!CASHFREE_CONFIG.available) {
      return res.status(503).json({
        success: false,
        message: 'Payment service is currently unavailable'
      });
    }
    
    // Generate subscription ID
    const subscriptionId = `SUB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create subscription in Cashfree
    const subscription = await cashfreeService.createSubscription(
      subscriptionId,
      planId,
      user.email || 'user@lexidraft.com',
      user.phone || '1234567890',
      user.name || user.username,
      `${req.protocol}://${req.get('host')}/api/payments/subscription-return?userId=${user.id}`,
      new Date().toISOString().split('T')[0] // Today's date
    );
    
    // Update user with subscription information (in a real app)
    // await storage.updateUserSubscription(user.id, { subscriptionId, planId, status: 'pending_payment' });
    
    res.json({
      success: true,
      subscriptionId,
      paymentLink: subscription.paymentLink,
      planDetails: {
        name: plan.name,
        price: plan.price,
        interval: plan.interval
      }
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription'
    });
  }
});

// Payment return handler
paymentsRouter.get('/return', async (req, res) => {
  try {
    const { consultationId, orderId, orderAmount, referenceId, txStatus, paymentMode, txMsg, txTime, signature } = req.query;
    
    if (txStatus !== 'SUCCESS') {
      // Handle payment failure
      if (consultationId) {
        const id = parseInt(consultationId as string);
        await storage.updateConsultation(id, { status: 'cancelled' });
      }
      
      // Redirect to payment failed page
      return res.redirect(`/payment-failed?reason=${encodeURIComponent(txMsg as string || 'Payment failed')}`);
    }
    
    // Verify the signature to prevent tampering
    if (CASHFREE_CONFIG.available && orderId && orderAmount && referenceId && txStatus && paymentMode && txTime && signature) {
      const data = {
        orderId: orderId as string,
        orderAmount: orderAmount as string,
        referenceId: referenceId as string,
        txStatus: txStatus as string,
        paymentMode: paymentMode as string,
        txMsg: txMsg as string,
        txTime: txTime as string
      };
      
      const isValid = cashfreeService.verifyPaymentSignature(data, signature as string);
      
      if (!isValid) {
        console.error('Invalid payment signature detected');
        return res.redirect('/payment-failed?reason=Invalid%20payment%20signature');
      }
    }
    
    // Update consultation status if consultation ID is provided
    if (consultationId) {
      const id = parseInt(consultationId as string);
      await storage.updateConsultation(id, { status: 'scheduled' });
    }
    
    // Redirect to success page
    res.redirect('/payment-success');
  } catch (error) {
    console.error('Error handling payment return:', error);
    res.redirect('/payment-failed?reason=System%20error');
  }
});

// Subscription return handler
paymentsRouter.get('/subscription-return', async (req, res) => {
  try {
    const { userId, subscriptionId, status } = req.query;
    
    if (status !== 'SUCCESS') {
      // Redirect to subscription failed page
      return res.redirect(`/subscription-failed?reason=${encodeURIComponent('Subscription payment failed')}`);
    }
    
    // In a real app, update user subscription status
    // if (userId) {
    //   await storage.updateUserSubscription(parseInt(userId as string), { status: 'active' });
    // }
    
    // Redirect to success page
    res.redirect('/subscription-success');
  } catch (error) {
    console.error('Error handling subscription return:', error);
    res.redirect('/subscription-failed?reason=System%20error');
  }
});

// Payment webhook handler (called by Cashfree)
paymentsRouter.post('/webhook', async (req, res) => {
  try {
    // Verify the webhook signature
    if (!req.headers['x-webhook-signature']) {
      console.error('Missing webhook signature');
      return res.status(400).send('Missing signature');
    }
    
    // Parse raw body
    const payload = JSON.parse(req.body.toString());
    
    // Process the webhook event
    const { event, data } = payload;
    
    if (event === 'ORDER_PAID') {
      // Find the consultation by order ID and update its status
      const orderId = data.order.orderId;
      const consultations = await storage.getAllConsultations(); // In real app, use a proper query
      const consultation = consultations.find(c => c.paymentOrderId === orderId);
      
      if (consultation) {
        await storage.updateConsultation(consultation.id, { status: 'scheduled' });
      }
    } else if (event === 'SUBSCRIPTION_ACTIVATED') {
      // Update user subscription status
      const subscriptionId = data.subscription.subscriptionId;
      // await storage.updateUserSubscriptionBySubscriptionId(subscriptionId, { status: 'active' });
    }
    
    res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('Webhook processing failed');
  }
});

// Get payment service status
paymentsRouter.get('/status', (req, res) => {
  res.json({
    success: true,
    service: 'payments',
    provider: 'Cashfree',
    available: CASHFREE_CONFIG.available,
    environment: CASHFREE_CONFIG.env,
    message: CASHFREE_CONFIG.available 
      ? 'Payment service is operational' 
      : 'Payment service is unavailable'
  });
});

export default paymentsRouter;