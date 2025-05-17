/**
 * Consultation service configuration
 */
import { ENV, IS_PRODUCTION } from '../../../shared/config/service';

export const config = {
  port: process.env.CONSULTATION_SERVICE_PORT 
    ? parseInt(process.env.CONSULTATION_SERVICE_PORT) 
    : 0, // Will be assigned dynamically
  serviceName: 'consultation-service',
  version: '1.0.0',
  
  // Consultation features
  features: {
    videoConsultation: true,
    chatConsultation: true,
    documentSharing: true,
    scheduling: true,
    payment: true,
    ratings: true,
    followUps: true
  },
  
  // Consultation price ranges (in INR)
  priceRanges: {
    min: 500,
    max: 10000,
    default: 2000
  },
  
  // Consultation durations (in minutes)
  durations: [15, 30, 45, 60, 90, 120]
};