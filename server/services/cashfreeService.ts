import { Cashfree } from 'cashfree-pg';
import crypto from 'crypto';
import fetch from 'node-fetch';

/**
 * Cashfree payment service for LexiDraft
 * 
 * Required API Credentials:
 * 1. CASHFREE_APP_ID: Your Cashfree App ID / Client ID
 * 2. CASHFREE_SECRET_KEY: Your Cashfree Secret Key / Client Secret
 */

if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
  console.warn('Cashfree API credentials missing: CASHFREE_APP_ID or CASHFREE_SECRET_KEY');
}

// Get the Cashfree API environment
const CF_API_ENV = process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'TEST';

// API URLs for TEST and PRODUCTION environments
const CF_API_URLS = {
  TEST: 'https://sandbox.cashfree.com/pg',
  PRODUCTION: 'https://api.cashfree.com/pg',
};

// Initialize Cashfree SDK - we'll use our own REST implementation as fallback
let cashfree: any;
try {
  cashfree = new Cashfree({
    clientId: process.env.CASHFREE_APP_ID || '',
    clientSecret: process.env.CASHFREE_SECRET_KEY || '',
    env: CF_API_ENV,
  });
} catch (error) {
  console.warn('Error initializing Cashfree SDK:', error);
  cashfree = null;
}

/**
 * Payment types in LexiDraft
 */
export enum PaymentType {
  SUBSCRIPTION = 'subscription',
  LAWYER_CONSULTATION = 'lawyer_consultation',
  CONTRACT_TEMPLATE = 'contract_template',
  VERIFICATION_SERVICE = 'verification_service',
}

/**
 * Interface for payment data
 */
export interface PaymentData {
  orderId: string;
  orderAmount: number;
  orderCurrency: string;
  customerEmail: string;
  customerPhone: string;
  customerName: string;
  returnUrl: string;
  notifyUrl?: string;
  paymentType: PaymentType;
  productInfo: string;
  metaData?: Record<string, any>;
}

/**
 * Create a new payment order
 * @param paymentData Payment data
 * @returns Payment order details
 */
export async function createPaymentOrder(paymentData: PaymentData) {
  try {
    const {
      orderId,
      orderAmount,
      orderCurrency,
      customerEmail,
      customerPhone,
      customerName,
      returnUrl,
      productInfo,
    } = paymentData;

    // Create a payment order
    const orderRequest = {
      orderId,
      orderAmount: orderAmount.toString(),
      orderCurrency,
      customerDetails: {
        customerId: orderId,
        customerEmail,
        customerPhone,
        customerName,
      },
      orderMeta: {
        returnUrl,
        notifyUrl: paymentData.notifyUrl,
        paymentMethods: null, // Allow all payment methods
      },
      orderNote: productInfo,
    };

    // Try using SDK first, if available
    if (cashfree && cashfree.orders && typeof cashfree.orders.createOrders === 'function') {
      try {
        const order = await cashfree.orders.createOrders(orderRequest);
        return order;
      } catch (sdkError) {
        console.warn('SDK method failed, falling back to direct API call:', sdkError);
      }
    }

    // Fall back to direct API call, but use mock for development if needed
    console.log('Using direct API call for order creation');
    let order;
    
    try {
      const apiUrl = `${CF_API_URLS[CF_API_ENV]}/orders`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': process.env.CASHFREE_APP_ID || '',
          'x-client-secret': process.env.CASHFREE_SECRET_KEY || '',
          'x-api-version': '2022-09-01'
        },
        body: JSON.stringify(orderRequest)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      order = await response.json();
    } catch (apiError) {
      console.error('Cashfree API Error:', apiError);
      throw new Error('Failed to create payment order with Cashfree. Please try again later.');
    }
    
    // For consistent response format
    return {
      cfOrderId: order.cf_order_id,
      orderId: order.order_id,
      orderAmount: order.order_amount,
      orderCurrency: order.order_currency,
      orderStatus: order.order_status,
      orderToken: order.order_token,
      orderExpiryTime: order.order_expiry_time,
      paymentSessionId: order.payment_session_id,
      paymentLink: `${CF_API_URLS[CF_API_ENV]}/orders/pay/${order.payment_session_id}`,
    };
  } catch (error) {
    console.error('Cashfree payment order creation error:', error);
    throw error;
  }
}

/**
 * Get payment order details
 * @param orderId Order ID
 * @returns Order details
 */
export async function getOrderDetails(orderId: string) {
  try {
    // Try using SDK first, if available
    if (cashfree && cashfree.orders && typeof cashfree.orders.getOrder === 'function') {
      try {
        const order = await cashfree.orders.getOrder({
          orderId,
        });
        return order;
      } catch (sdkError) {
        console.warn('SDK get order failed, falling back to direct API call:', sdkError);
      }
    }

    // Fall back to direct API call
    console.log('Using direct API call for order details');
    let orderData;
    
    try {
      const apiUrl = `${CF_API_URLS[CF_API_ENV]}/orders/${orderId}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': process.env.CASHFREE_APP_ID || '',
          'x-client-secret': process.env.CASHFREE_SECRET_KEY || '',
          'x-api-version': '2022-09-01'
        }
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      orderData = await response.json();
    } catch (apiError) {
      console.error('Cashfree API Error:', apiError);
      throw new Error('Failed to get order details from Cashfree. Please try again later.');
    }
    
    // Convert to SDK-like format for consistency
    return {
      cfOrderId: orderData.cf_order_id,
      orderId: orderData.order_id,
      orderAmount: orderData.order_amount,
      orderCurrency: orderData.order_currency,
      orderStatus: orderData.order_status,
      orderToken: orderData.order_token,
      orderExpiryTime: orderData.order_expiry_time,
      paymentSessionId: orderData.payment_session_id,
      paymentLink: `${CF_API_URLS[CF_API_ENV]}/orders/pay/${orderData.payment_session_id}`,
    };
  } catch (error) {
    console.error('Cashfree get order error:', error);
    throw error;
  }
}

/**
 * Create a payment link
 * @param paymentData Payment data
 * @returns Payment link details
 */
export async function createPaymentLink(paymentData: PaymentData) {
  try {
    const {
      orderId,
      orderAmount,
      orderCurrency,
      customerEmail,
      customerPhone,
      customerName,
      returnUrl,
      productInfo,
      metaData
    } = paymentData;

    // Create a payment link request
    const paymentLinkRequest = {
      linkId: orderId,
      linkAmount: orderAmount.toString(),
      linkCurrency: orderCurrency,
      linkPurpose: productInfo,
      customerDetails: {
        customerId: orderId,
        customerEmail,
        customerPhone,
        customerName,
      },
      linkMeta: {
        returnUrl,
        notifyUrl: paymentData.notifyUrl,
      },
      linkExpiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      metaData: metaData || {}
    };

    // Try using SDK first, if available
    if (cashfree && cashfree.paymentLinks && typeof cashfree.paymentLinks.createPaymentLink === 'function') {
      try {
        const paymentLink = await cashfree.paymentLinks.createPaymentLink(paymentLinkRequest);
        return paymentLink;
      } catch (sdkError) {
        console.warn('SDK payment link creation failed, falling back to direct API call:', sdkError);
      }
    }

    // Fall back to direct API call, but use mock for development if needed
    console.log('Using direct API call for payment link creation');
    let linkData;
    
    try {
      const apiUrl = `${CF_API_URLS[CF_API_ENV]}/links`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': process.env.CASHFREE_APP_ID || '',
          'x-client-secret': process.env.CASHFREE_SECRET_KEY || '',
          'x-api-version': '2022-09-01'
        },
        body: JSON.stringify(paymentLinkRequest)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      linkData = await response.json();
    } catch (apiError) {
      console.error('Cashfree API Error:', apiError);
      throw new Error('Failed to create payment link with Cashfree. Please try again later.');
    }
    
    // For consistent response format
    return {
      cfLinkId: linkData.cf_link_id,
      linkId: linkData.link_id,
      linkUrl: linkData.link_url,
      linkAmount: linkData.link_amount,
      linkCurrency: linkData.link_currency,
      linkStatus: linkData.link_status,
      linkExpiryTime: linkData.link_expiry_time,
      linkCreatedAt: linkData.link_created_at,
      paymentLink: linkData.link_url,
      metaData: linkData.meta_data || metaData || {}
    };
  } catch (error) {
    console.error('Cashfree payment link creation error:', error);
    throw error;
  }
}

/**
 * Get payment link details
 * @param linkId Link ID
 * @returns Payment link details
 */
export async function getPaymentLinkDetails(linkId: string) {
  try {
    // Try using SDK first, if available
    if (cashfree && cashfree.paymentLinks && typeof cashfree.paymentLinks.getPaymentLinkDetails === 'function') {
      try {
        const paymentLink = await cashfree.paymentLinks.getPaymentLinkDetails({
          linkId,
        });
        return paymentLink;
      } catch (sdkError) {
        console.warn('SDK get payment link failed, falling back to direct API call:', sdkError);
      }
    }

    // Fall back to direct API call
    console.log('Using direct API call for payment link details');
    let linkData;
    
    try {
      const apiUrl = `${CF_API_URLS[CF_API_ENV]}/links/${linkId}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': process.env.CASHFREE_APP_ID || '',
          'x-client-secret': process.env.CASHFREE_SECRET_KEY || '',
          'x-api-version': '2022-09-01'
        }
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      linkData = await response.json();
    } catch (apiError) {
      console.error('Cashfree API Error:', apiError);
      throw new Error('Failed to get payment link details from Cashfree. Please try again later.');
    }
    
    // Convert to SDK-like format for consistency
    return {
      cfLinkId: linkData.cf_link_id,
      linkId: linkData.link_id,
      linkUrl: linkData.link_url,
      linkAmount: linkData.link_amount,
      linkCurrency: linkData.link_currency,
      linkStatus: linkData.link_status,
      linkExpiryTime: linkData.link_expiry_time,
      linkCreatedAt: linkData.link_created_at,
      paymentLink: linkData.link_url
    };
  } catch (error) {
    console.error('Cashfree get payment link error:', error);
    throw error;
  }
}

/**
 * Create a subscription plan
 * @param planId Plan ID
 * @param planName Plan name
 * @param amount Amount
 * @param interval Interval (monthly, yearly)
 * @param description Plan description
 * @returns Plan details
 */
export async function createSubscriptionPlan(
  planId: string,
  planName: string,
  amount: number,
  interval: 'monthly' | 'yearly',
  description: string
) {
  try {
    const intervalType = interval === 'monthly' ? '1m' : '1y';
    
    const planRequest = {
      planId,
      planName,
      planAmount: amount.toString(),
      planDescription: description,
      planInterval: intervalType,
      planMaxCycles: 0, // Infinite
    };

    // Try using SDK first
    if (cashfree && cashfree.plans && typeof cashfree.plans.createPlan === 'function') {
      try {
        const plan = await cashfree.plans.createPlan(planRequest);
        return plan;
      } catch (sdkError) {
        console.error('Cashfree SDK Error:', sdkError);
        throw new Error('Failed to create subscription plan with Cashfree. Please try again later.');
      }
    }
    
    // Fall back to direct API call
    console.log('Using direct API call for subscription plan creation');
    try {
      const apiUrl = `${CF_API_URLS[CF_API_ENV]}/plans`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': process.env.CASHFREE_APP_ID || '',
          'x-client-secret': process.env.CASHFREE_SECRET_KEY || '',
          'x-api-version': '2022-09-01'
        },
        body: JSON.stringify(planRequest)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const planData = await response.json();
      return {
        planId: planData.plan_id,
        planName: planData.plan_name,
        planAmount: planData.plan_amount,
        planType: planData.plan_type || 'PERIODIC',
        planInterval: planData.plan_interval,
        planDescription: planData.plan_description,
        planStatus: planData.plan_status,
        planCreatedAt: planData.plan_created_at
      };
    } catch (apiError) {
      console.error('Cashfree API Error:', apiError);
      throw new Error('Failed to create subscription plan with Cashfree. Please try again later.');
    }
  } catch (error) {
    console.error('Cashfree subscription plan creation error:', error);
    throw error;
  }
}

/**
 * Create a subscription
 * @param subscriptionId Subscription ID
 * @param planId Plan ID
 * @param customerEmail Customer email
 * @param customerPhone Customer phone
 * @param customerName Customer name
 * @param returnUrl Return URL
 * @param firstChargeDate First charge date
 * @returns Subscription details
 */
export async function createSubscription(
  subscriptionId: string,
  planId: string,
  customerEmail: string,
  customerPhone: string,
  customerName: string,
  returnUrl: string,
  firstChargeDate?: string
) {
  try {
    // If first charge date is not provided, use current date
    if (!firstChargeDate) {
      const date = new Date();
      date.setDate(date.getDate() + 1); // Start tomorrow
      firstChargeDate = date.toISOString().split('T')[0];
    }

    const subscriptionRequest = {
      subscriptionId,
      planId,
      customerDetails: {
        customerId: subscriptionId,
        customerEmail,
        customerPhone,
        customerName,
      },
      firstCharge: {
        date: firstChargeDate,
      },
      returnUrl,
    };

    // Try using SDK first
    if (cashfree && cashfree.subscriptions && typeof cashfree.subscriptions.createSubscription === 'function') {
      try {
        const subscription = await cashfree.subscriptions.createSubscription(subscriptionRequest);
        return subscription;
      } catch (sdkError) {
        console.error('Cashfree SDK Error:', sdkError);
        throw new Error('Failed to create subscription with Cashfree. Please try again later.');
      }
    }
    
    // Fall back to direct API call
    console.log('Using direct API call for subscription creation');
    try {
      const apiUrl = `${CF_API_URLS[CF_API_ENV]}/subscriptions`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': process.env.CASHFREE_APP_ID || '',
          'x-client-secret': process.env.CASHFREE_SECRET_KEY || '',
          'x-api-version': '2022-09-01'
        },
        body: JSON.stringify(subscriptionRequest)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const subscriptionData = await response.json();
      return {
        subscriptionId: subscriptionData.subscription_id,
        planId: subscriptionData.plan_id,
        planAmount: subscriptionData.plan_amount,
        planCurrency: subscriptionData.plan_currency || 'INR',
        planInterval: subscriptionData.plan_interval,
        subscriptionStatus: subscriptionData.subscription_status,
        subscriptionNote: subscriptionData.subscription_note,
        subscriptionCreatedAt: subscriptionData.subscription_created_at,
        customerDetails: subscriptionData.customer_details,
        authorizeUrl: subscriptionData.authorize_url,
        referenceId: subscriptionData.reference_id,
        paymentSessionId: subscriptionData.payment_session_id,
      };
    } catch (apiError) {
      console.error('Cashfree API Error:', apiError);
      throw new Error('Failed to create subscription with Cashfree. Please try again later.');
    };
  } catch (error) {
    console.error('Cashfree subscription creation error:', error);
    throw error;
  }
}

/**
 * Get subscription details
 * @param subscriptionId Subscription ID
 * @returns Subscription details
 */
export async function getSubscriptionDetails(subscriptionId: string) {
  try {
    // Try using SDK first
    if (cashfree && cashfree.subscriptions && typeof cashfree.subscriptions.getSubscription === 'function') {
      try {
        const subscription = await cashfree.subscriptions.getSubscription({
          subscriptionId,
        });
        return subscription;
      } catch (sdkError) {
        console.error('Cashfree SDK Error:', sdkError);
        throw new Error('Failed to get subscription details from Cashfree. Please try again later.');
      }
    }
    
    // Fall back to direct API call
    console.log('Using direct API call for subscription details');
    try {
      const apiUrl = `${CF_API_URLS[CF_API_ENV]}/subscriptions/${subscriptionId}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': process.env.CASHFREE_APP_ID || '',
          'x-client-secret': process.env.CASHFREE_SECRET_KEY || '',
          'x-api-version': '2022-09-01'
        }
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const subscriptionData = await response.json();
      return {
        subscriptionId: subscriptionData.subscription_id,
        planId: subscriptionData.plan_id,
        planAmount: subscriptionData.plan_amount,
        planCurrency: subscriptionData.plan_currency || 'INR',
        planInterval: subscriptionData.plan_interval,
        subscriptionStatus: subscriptionData.subscription_status,
        subscriptionNote: subscriptionData.subscription_note,
        subscriptionCreatedAt: subscriptionData.subscription_created_at,
        customerDetails: subscriptionData.customer_details,
        referenceId: subscriptionData.reference_id,
        paymentSessionId: subscriptionData.payment_session_id,
      };
    } catch (apiError) {
      console.error('Cashfree API Error:', apiError);
      throw new Error('Failed to get subscription details from Cashfree. Please try again later.');
    };
  } catch (error) {
    console.error('Cashfree get subscription error:', error);
    throw error;
  }
}

/**
 * Cancel a subscription
 * @param subscriptionId Subscription ID
 * @returns Cancellation status
 */
export async function cancelSubscription(subscriptionId: string) {
  try {
    // Try using SDK first
    if (cashfree && cashfree.subscriptions && typeof cashfree.subscriptions.cancelSubscription === 'function') {
      try {
        const result = await cashfree.subscriptions.cancelSubscription({
          subscriptionId,
        });
        return result;
      } catch (sdkError) {
        console.error('Cashfree SDK Error:', sdkError);
        throw new Error('Failed to cancel subscription with Cashfree. Please try again later.');
      }
    }
    
    // Fall back to direct API call
    console.log('Using direct API call for subscription cancellation');
    try {
      const apiUrl = `${CF_API_URLS[CF_API_ENV]}/subscriptions/${subscriptionId}`;
      
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': process.env.CASHFREE_APP_ID || '',
          'x-client-secret': process.env.CASHFREE_SECRET_KEY || '',
          'x-api-version': '2022-09-01'
        },
        body: JSON.stringify({
          subscriptionStatus: 'CANCELLED'
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const cancelData = await response.json();
      return {
        subscriptionId: cancelData.subscription_id,
        subscriptionStatus: cancelData.subscription_status,
        cancelledAt: new Date().toISOString()
      };
    } catch (apiError) {
      console.error('Cashfree API Error:', apiError);
      throw new Error('Failed to cancel subscription with Cashfree. Please try again later.');
    };
  } catch (error) {
    console.error('Cashfree subscription cancellation error:', error);
    throw error;
  }
}

/**
 * Verify payment signature
 * @param data Signature data
 * @param signature Signature
 * @returns Verification result
 */
export function verifyPaymentSignature(data: Record<string, string>, signature: string) {
  try {
    // Extract required fields from data
    const { orderId, orderAmount, referenceId, txStatus, paymentMode, txMsg, txTime } = data;
    
    // Create the data string based on Cashfree's documentation
    const signatureData = orderId + orderAmount + referenceId + txStatus + paymentMode + txMsg + txTime;
    
    // Generate HMAC SHA256 signature
    const computedSignature = crypto
      .createHmac('sha256', process.env.CASHFREE_SECRET_KEY || '')
      .update(signatureData)
      .digest('hex');
    
    return {
      verified: computedSignature === signature,
      orderId,
      referenceId,
      txStatus
    };
  } catch (error) {
    console.error('Cashfree payment verification error:', error);
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}