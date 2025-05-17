/**
 * Template service configuration
 */
import { ENV, IS_PRODUCTION } from '../../../shared/config/service';

export const config = {
  port: process.env.TEMPLATE_SERVICE_PORT 
    ? parseInt(process.env.TEMPLATE_SERVICE_PORT) 
    : 0, // Will be assigned dynamically
  serviceName: 'template-service',
  version: '1.0.0',
  
  // Template service features
  features: {
    customTemplates: true,
    premiumTemplates: true,
    purchase: true,
    categories: true,
    ratings: true,
    versionHistory: true
  },
  
  // Template categories
  categories: [
    'Employment',
    'Business',
    'Real Estate',
    'NDA',
    'Intellectual Property',
    'Services',
    'Partnerships',
    'Family Law',
    'Sales and Distribution',
    'General'
  ]
};