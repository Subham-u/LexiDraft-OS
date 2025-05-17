/**
 * Consultation service controllers
 */
import { createLogger } from '../../../shared/utils/logger';
import { ApiError } from '../../../shared/middleware/error';
import { config } from './config';
import { storage } from '../../../storage';
import type { Consultation } from '../../../shared/schema';

const logger = createLogger('consultation-service-controllers');

// Generate a unique meeting ID
function generateMeetingId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const consultationControllers = {
  // Get consultation by ID
  getConsultationById: async (consultationId: number, userId: number) => {
    try {
      const consultation = await storage.getConsultation(consultationId);
      
      if (!consultation) {
        throw ApiError.notFound('Consultation not found');
      }
      
      // Check if user has access to this consultation (either as client or lawyer)
      if (consultation.userId !== userId && consultation.lawyerId !== userId) {
        throw ApiError.forbidden('You do not have permission to access this consultation');
      }
      
      return {
        success: true,
        data: consultation
      };
    } catch (error) {
      logger.error(`Error fetching consultation ${consultationId}`, { error });
      throw error;
    }
  },
  
  // Get all consultations for a user
  getUserConsultations: async (userId: number) => {
    try {
      const consultations = await storage.getUserConsultations(userId);
      
      return {
        success: true,
        data: consultations
      };
    } catch (error) {
      logger.error(`Error fetching consultations for user ${userId}`, { error });
      throw error;
    }
  },
  
  // Create a new consultation
  createConsultation: async (userId: number, consultationData: any) => {
    try {
      const { lawyerId, scheduledTime, duration, mode, subject, description, price } = consultationData;
      
      // Verify the lawyer exists
      const lawyer = await storage.getLawyer(lawyerId);
      
      if (!lawyer) {
        throw ApiError.badRequest('Invalid lawyer ID');
      }
      
      // Validate duration
      if (!config.durations.includes(duration)) {
        throw ApiError.badRequest(`Invalid duration. Must be one of: ${config.durations.join(', ')}`);
      }
      
      // Validate price
      if (price < config.priceRanges.min || price > config.priceRanges.max) {
        throw ApiError.badRequest(`Price must be between ${config.priceRanges.min} and ${config.priceRanges.max} INR`);
      }
      
      // Generate meeting ID
      const meetingId = generateMeetingId();
      
      // Create consultation
      const consultation = await storage.createConsultation({
        userId,
        lawyerId,
        scheduledTime,
        duration,
        mode,
        subject,
        description,
        price,
        status: 'pending',
        meetingId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      return {
        success: true,
        data: consultation
      };
    } catch (error) {
      logger.error('Error creating consultation', { error });
      throw error;
    }
  },
  
  // Update consultation status
  updateConsultationStatus: async (consultationId: number, userId: number, newStatus: string) => {
    try {
      const consultation = await storage.getConsultation(consultationId);
      
      if (!consultation) {
        throw ApiError.notFound('Consultation not found');
      }
      
      // Check if user has access to this consultation (either as client or lawyer)
      if (consultation.userId !== userId && consultation.lawyerId !== userId) {
        throw ApiError.forbidden('You do not have permission to update this consultation');
      }
      
      // Validate status transitions
      const validTransitions: Record<string, string[]> = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['completed', 'cancelled', 'no-show'],
        'completed': [],
        'cancelled': [],
        'no-show': []
      };
      
      if (!validTransitions[consultation.status].includes(newStatus)) {
        throw ApiError.badRequest(`Cannot transition from ${consultation.status} to ${newStatus}`);
      }
      
      // Update consultation
      const updatedConsultation = await storage.updateConsultation(consultationId, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      return {
        success: true,
        data: updatedConsultation
      };
    } catch (error) {
      logger.error(`Error updating consultation ${consultationId}`, { error });
      throw error;
    }
  },
  
  // Add a note to a consultation
  addConsultationNote: async (consultationId: number, userId: number, note: string) => {
    try {
      const consultation = await storage.getConsultation(consultationId);
      
      if (!consultation) {
        throw ApiError.notFound('Consultation not found');
      }
      
      // Check if user has access to this consultation (either as client or lawyer)
      if (consultation.userId !== userId && consultation.lawyerId !== userId) {
        throw ApiError.forbidden('You do not have permission to update this consultation');
      }
      
      // Add note
      const notes = consultation.notes || [];
      notes.push({
        userId,
        content: note,
        timestamp: new Date().toISOString()
      });
      
      // Update consultation
      const updatedConsultation = await storage.updateConsultation(consultationId, {
        notes,
        updatedAt: new Date().toISOString()
      });
      
      return {
        success: true,
        data: updatedConsultation
      };
    } catch (error) {
      logger.error(`Error adding note to consultation ${consultationId}`, { error });
      throw error;
    }
  },
  
  // Share a document in a consultation
  shareDocument: async (consultationId: number, userId: number, documentData: any) => {
    try {
      const { title, url, type } = documentData;
      
      const consultation = await storage.getConsultation(consultationId);
      
      if (!consultation) {
        throw ApiError.notFound('Consultation not found');
      }
      
      // Check if user has access to this consultation (either as client or lawyer)
      if (consultation.userId !== userId && consultation.lawyerId !== userId) {
        throw ApiError.forbidden('You do not have permission to update this consultation');
      }
      
      // Create shared document
      const sharedDocument = await storage.createSharedDocument({
        consultationId,
        userId,
        title,
        url,
        type,
        sharedAt: new Date().toISOString()
      });
      
      return {
        success: true,
        data: sharedDocument
      };
    } catch (error) {
      logger.error(`Error sharing document in consultation ${consultationId}`, { error });
      throw error;
    }
  },
  
  // Get shared documents for a consultation
  getSharedDocuments: async (consultationId: number, userId: number) => {
    try {
      const consultation = await storage.getConsultation(consultationId);
      
      if (!consultation) {
        throw ApiError.notFound('Consultation not found');
      }
      
      // Check if user has access to this consultation (either as client or lawyer)
      if (consultation.userId !== userId && consultation.lawyerId !== userId) {
        throw ApiError.forbidden('You do not have permission to access this consultation');
      }
      
      // Get shared documents
      const documents = await storage.getConsultationDocuments(consultationId);
      
      return {
        success: true,
        data: documents
      };
    } catch (error) {
      logger.error(`Error fetching documents for consultation ${consultationId}`, { error });
      throw error;
    }
  },
  
  // Get upcoming consultations
  getUpcomingConsultations: async (userId: number, limit: number = 5) => {
    try {
      const now = new Date().toISOString();
      
      // Get all consultations for the user
      const consultations = await storage.getUserConsultations(userId);
      
      // Filter upcoming consultations
      const upcomingConsultations = consultations
        .filter(c => c.scheduledTime > now && ['pending', 'confirmed'].includes(c.status))
        .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
        .slice(0, limit);
      
      return {
        success: true,
        data: upcomingConsultations
      };
    } catch (error) {
      logger.error(`Error fetching upcoming consultations for user ${userId}`, { error });
      throw error;
    }
  },
  
  // Get service status
  getStatus: () => {
    return {
      success: true,
      service: 'consultation-service',
      version: config.version,
      features: config.features,
      status: 'operational',
      timestamp: new Date().toISOString()
    };
  }
};