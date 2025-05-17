/**
 * Service configuration for LexiDraft
 * Defines service paths, names and environment configurations
 */

// Define environment
export const ENV = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = ENV === 'production';

// Define services
export const SERVICES = {
  user: {
    name: 'user-service',
    path: '/user'
  },
  contract: {
    name: 'contract-service',
    path: '/contract'
  },
  lawyer: {
    name: 'lawyer-service',
    path: '/lawyer'
  },
  client: {
    name: 'client-service',
    path: '/client'
  },
  consultation: {
    name: 'consultation-service',
    path: '/consultation'
  },
  payment: {
    name: 'payment-service',
    path: '/payment'
  },
  ai: {
    name: 'ai-service',
    path: '/ai'
  },
  notification: {
    name: 'notification-service',
    path: '/notification'
  },
  search: {
    name: 'search-service',
    path: '/search'
  },
  template: {
    name: 'template-service',
    path: '/template'
  }
};