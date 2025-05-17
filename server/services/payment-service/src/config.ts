/**
 * Payment service configuration
 */
import { ENV, IS_PRODUCTION } from '../../../shared/config/service';

export const config = {
  port: process.env.PAYMENT_SERVICE_PORT 
    ? parseInt(process.env.PAYMENT_SERVICE_PORT) 
    : 0, // Will be assigned dynamically
  serviceName: 'payment-service',
  version: '1.0.0',
  
  // Payment gateway configuration
  paymentGateway: {
    cashfree: {
      appId: process.env.CASHFREE_APP_ID || '',
      secretKey: process.env.CASHFREE_SECRET_KEY || '',
      baseUrl: IS_PRODUCTION 
        ? 'https://api.cashfree.com/pg' 
        : 'https://sandbox.cashfree.com/pg',
      apiVersion: '2022-09-01'
    }
  },
  
  // Subscription plans configuration
  subscriptionPlans: {
    basic: {
      id: 'basic-monthly',
      name: 'Basic Plan',
      price: 499,
      currency: 'INR',
      interval: 'month',
      features: [
        'Access to basic templates',
        'AI contract analysis',
        'Contract storage',
        'Email notifications'
      ]
    },
    pro: {
      id: 'pro-monthly',
      name: 'Professional Plan',
      price: 999,
      currency: 'INR',
      interval: 'month',
      features: [
        'All basic features',
        'Premium templates',
        'Advanced contract analysis',
        'Priority support',
        'Clause library access'
      ]
    },
    enterprise: {
      id: 'enterprise-monthly',
      name: 'Enterprise Plan',
      price: 4999,
      currency: 'INR',
      interval: 'month',
      features: [
        'All professional features',
        'Custom templates',
        'Dedicated account manager',
        'API access',
        'Team collaboration',
        'Advanced reporting'
      ]
    }
  }
};