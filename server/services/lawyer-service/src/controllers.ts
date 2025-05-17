/**
 * Lawyer service controllers
 */
import { createLogger } from '../../../shared/utils/logger';
import { ApiError } from '../../../shared/middleware/error';
import { config } from './config';
import { storage } from '../../../storage';
import type { Lawyer, LawyerReview } from '../../../shared/schema';

const logger = createLogger('lawyer-service-controllers');

// Helper function to generate lawyer availability
function generateAvailability() {
  const availability = [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  // Generate random availability slots for each day
  for (const day of days) {
    if (Math.random() > 0.2) { // 80% chance to have slots on a given day
      const slots = [];
      const startHour = 9 + Math.floor(Math.random() * 2); // Start between 9-10
      const endHour = 16 + Math.floor(Math.random() * 3); // End between 16-18
      
      for (let hour = startHour; hour <= endHour; hour++) {
        if (Math.random() > 0.3) { // 70% chance to have a specific slot available
          slots.push(`${hour}:00-${hour}:30`);
        }
        if (Math.random() > 0.3) {
          slots.push(`${hour}:30-${hour+1}:00`);
        }
      }
      
      if (slots.length > 0) {
        availability.push({
          day,
          slots
        });
      }
    }
  }
  
  return availability;
}

export const lawyerControllers = {
  // Get all lawyers with optional filters
  getAllLawyers: async (filters: Record<string, any> = {}, limit: number = 20, page: number = 1) => {
    try {
      // Get all lawyers from storage
      let lawyers = await storage.getAllLawyers();
      
      // Apply filters if provided
      if (filters.practiceArea) {
        lawyers = lawyers.filter(lawyer => 
          lawyer.practiceAreas.includes(filters.practiceArea)
        );
      }
      
      if (filters.experience) {
        const minExperience = parseInt(filters.experience);
        lawyers = lawyers.filter(lawyer => lawyer.yearsOfExperience >= minExperience);
      }
      
      if (filters.location) {
        lawyers = lawyers.filter(lawyer => 
          lawyer.location.city === filters.location || 
          lawyer.location.state === filters.location
        );
      }
      
      if (filters.rating) {
        const minRating = parseFloat(filters.rating);
        lawyers = lawyers.filter(lawyer => lawyer.rating >= minRating);
      }
      
      // Calculate total before pagination
      const total = lawyers.length;
      
      // Implement pagination
      const skip = (page - 1) * limit;
      lawyers = lawyers.slice(skip, skip + limit);
      
      return {
        success: true,
        data: lawyers,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching lawyers', { error });
      throw error;
    }
  },
  
  // Get a specific lawyer by ID
  getLawyerById: async (lawyerId: number) => {
    try {
      const lawyer = await storage.getLawyer(lawyerId);
      
      if (!lawyer) {
        throw ApiError.notFound('Lawyer not found');
      }
      
      // Generate availability for the lawyer
      const availability = generateAvailability();
      
      // Get reviews for the lawyer
      const reviews = await storage.getLawyerReviews(lawyerId);
      
      return {
        success: true,
        data: {
          ...lawyer,
          availability,
          reviews
        }
      };
    } catch (error) {
      logger.error(`Error fetching lawyer ${lawyerId}`, { error });
      throw error;
    }
  },
  
  // Get featured lawyers
  getFeaturedLawyers: async (limit: number = 5) => {
    try {
      // Get all lawyers
      const lawyers = await storage.getAllLawyers();
      
      // Sort by rating and get the top ones
      const featuredLawyers = lawyers
        .sort((a, b) => b.rating - a.rating)
        .slice(0, limit);
      
      return {
        success: true,
        data: featuredLawyers
      };
    } catch (error) {
      logger.error('Error fetching featured lawyers', { error });
      throw error;
    }
  },
  
  // Get lawyer availability
  getLawyerAvailability: async (lawyerId: number, date?: string) => {
    try {
      const lawyer = await storage.getLawyer(lawyerId);
      
      if (!lawyer) {
        throw ApiError.notFound('Lawyer not found');
      }
      
      // Generate availability for the lawyer
      // In a real implementation, this would come from the database
      const availability = generateAvailability();
      
      return {
        success: true,
        data: {
          lawyerId,
          availability
        }
      };
    } catch (error) {
      logger.error(`Error fetching availability for lawyer ${lawyerId}`, { error });
      throw error;
    }
  },
  
  // Get reviews for a lawyer
  getLawyerReviews: async (lawyerId: number, limit: number = 10, page: number = 1) => {
    try {
      const lawyer = await storage.getLawyer(lawyerId);
      
      if (!lawyer) {
        throw ApiError.notFound('Lawyer not found');
      }
      
      // Get reviews from storage
      const reviews = await storage.getLawyerReviews(lawyerId);
      
      // Calculate total before pagination
      const total = reviews.length;
      
      // Implement pagination
      const skip = (page - 1) * limit;
      const paginatedReviews = reviews.slice(skip, skip + limit);
      
      return {
        success: true,
        data: paginatedReviews,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error(`Error fetching reviews for lawyer ${lawyerId}`, { error });
      throw error;
    }
  },
  
  // Add a review for a lawyer
  addLawyerReview: async (lawyerId: number, userId: number, reviewData: { rating: number; comment: string }) => {
    try {
      const lawyer = await storage.getLawyer(lawyerId);
      
      if (!lawyer) {
        throw ApiError.notFound('Lawyer not found');
      }
      
      // Create the review
      const review = await storage.createLawyerReview({
        lawyerId,
        userId,
        rating: reviewData.rating,
        comment: reviewData.comment,
        createdAt: new Date().toISOString()
      });
      
      // Update lawyer's average rating
      const reviews = await storage.getLawyerReviews(lawyerId);
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      
      // Update the lawyer with the new rating
      await storage.updateLawyer(lawyerId, {
        rating: Math.round(avgRating * 10) / 10 // Round to 1 decimal place
      });
      
      return {
        success: true,
        data: review
      };
    } catch (error) {
      logger.error(`Error adding review for lawyer ${lawyerId}`, { error });
      throw error;
    }
  },
  
  // Search for lawyers by keyword
  searchLawyers: async (query: string, limit: number = 20, page: number = 1) => {
    try {
      // Get all lawyers
      const lawyers = await storage.getAllLawyers();
      
      // Filter lawyers by the search query
      const searchResults = lawyers.filter(lawyer => 
        lawyer.name.toLowerCase().includes(query.toLowerCase()) ||
        lawyer.bio.toLowerCase().includes(query.toLowerCase()) ||
        lawyer.practiceAreas.some(area => area.toLowerCase().includes(query.toLowerCase())) ||
        (lawyer.location.city + lawyer.location.state).toLowerCase().includes(query.toLowerCase())
      );
      
      // Calculate total before pagination
      const total = searchResults.length;
      
      // Implement pagination
      const skip = (page - 1) * limit;
      const paginatedResults = searchResults.slice(skip, skip + limit);
      
      return {
        success: true,
        data: paginatedResults,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          query
        }
      };
    } catch (error) {
      logger.error(`Error searching lawyers with query: ${query}`, { error });
      throw error;
    }
  },
  
  // Get practice areas
  getPracticeAreas: async () => {
    try {
      // This would typically come from a database
      // For now, we'll use a hardcoded list of common legal practice areas in India
      const practiceAreas = [
        'Corporate Law',
        'Commercial Law',
        'Intellectual Property',
        'Tax Law',
        'Real Estate',
        'Property Disputes',
        'Family Law',
        'Divorce',
        'Criminal Law',
        'Civil Litigation',
        'Labor and Employment',
        'Immigration',
        'Consumer Protection',
        'Banking and Finance',
        'Mergers and Acquisitions',
        'Contract Law',
        'Constitutional Law',
        'Environment Law',
        'International Law',
        'Alternative Dispute Resolution',
        'Maritime Law',
        'Insurance Law',
        'Information Technology'
      ];
      
      return {
        success: true,
        data: practiceAreas
      };
    } catch (error) {
      logger.error('Error fetching practice areas', { error });
      throw error;
    }
  },
  
  // Get service status
  getStatus: () => {
    return {
      success: true,
      service: 'lawyer-service',
      version: config.version,
      features: config.features,
      status: 'operational',
      timestamp: new Date().toISOString()
    };
  }
};