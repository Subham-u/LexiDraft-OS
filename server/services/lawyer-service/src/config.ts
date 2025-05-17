/**
 * Lawyer service configuration
 */
import { ENV, IS_PRODUCTION } from '../../../shared/config/service';

export const config = {
  port: process.env.LAWYER_SERVICE_PORT 
    ? parseInt(process.env.LAWYER_SERVICE_PORT) 
    : 0, // Will be assigned dynamically
  serviceName: 'lawyer-service',
  version: '1.0.0',
  
  // Lawyer marketplace features
  features: {
    videoConsultation: true,
    instantBooking: true,
    reviewSystem: true,
    availability: true,
    filters: {
      practiceArea: true,
      experience: true,
      location: true,
      language: true,
      rating: true,
      price: true
    }
  }
};