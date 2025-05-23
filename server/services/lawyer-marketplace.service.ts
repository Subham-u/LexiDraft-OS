import { db } from '../db';
import { lawyers, consultations } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { createLogger } from '../utils/logger';

const logger = createLogger('lawyer-marketplace-service');

export class LawyerMarketplaceService {
  async registerLawyer(data: {
    userId: string;
    name: string;
    profilePhoto?: string;
    about?: string;
    barCouncilId?: string;
    practiceAreas: string[];
    specializations?: string[];
    experience: number;
    languages: string[];
    location: { country: string; state: string; city: string };
    hourlyRate: number;
    consultationModes?: string[];
  }) {
    try {
      const lawyer = await db.insert(lawyers).values({
        ...data,
        verified: false,
        verifications: {
          barCouncil: false,
          aadhaar: false,
          email: false,
          phone: false,
          lexiScreened: false
        }
      }).returning();

      return lawyer[0];
    } catch (error) {
      logger.error('Error registering lawyer:', error);
      throw error;
    }
  }

  async getLawyerProfile(userId: string) {
    try {
      const profile = await db.query.lawyers.findFirst({
        where: eq(lawyers.userId, userId)
      });
      return profile;
    } catch (error) {
      logger.error('Error getting lawyer profile:', error);
      throw error;
    }
  }

  async updateLawyerProfile(userId: string, data: Partial<typeof lawyers.$inferInsert>) {
    try {
      const updated = await db.update(lawyers)
        .set(data)
        .where(eq(lawyers.userId, userId))
        .returning();
      return updated[0];
    } catch (error) {
      logger.error('Error updating lawyer profile:', error);
      throw error;
    }
  }

  async getAllLawyers(filters?: {
    practiceArea?: string;
    location?: string;
    minExperience?: number;
    maxHourlyRate?: number;
  }) {
    try {
      let query = db.query.lawyers.findMany();

      if (filters) {
        if (filters.practiceArea) {
          query = query.where(lawyers.practiceAreas.contains([filters.practiceArea]));
        }
        if (filters.location) {
          query = query.where(lawyers.location.contains({ city: filters.location }));
        }
        if (filters.minExperience) {
          query = query.where(lawyers.experience.gte(filters.minExperience));
        }
        if (filters.maxHourlyRate) {
          query = query.where(lawyers.hourlyRate.lte(filters.maxHourlyRate));
        }
      }

      return await query;
    } catch (error) {
      logger.error('Error getting all lawyers:', error);
      throw error;
    }
  }

  async getLawyerById(id: number) {
    try {
      const lawyer = await db.query.lawyers.findFirst({
        where: eq(lawyers.id, id)
      });
      return lawyer;
    } catch (error) {
      logger.error('Error getting lawyer by ID:', error);
      throw error;
    }
  }

  async setAvailability(userId: string, availability: {
    day: string;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }[]) {
    try {
      const lawyer = await this.getLawyerProfile(userId);
      if (!lawyer) {
        throw new Error('Lawyer profile not found');
      }

      const updated = await db.update(lawyers)
        .set({
          availabilityCalendar: availability
        })
        .where(eq(lawyers.userId, userId))
        .returning();

      return updated[0];
    } catch (error) {
      logger.error('Error setting availability:', error);
      throw error;
    }
  }

  async getAvailability(userId: string) {
    try {
      const lawyer = await this.getLawyerProfile(userId);
      return lawyer?.availabilityCalendar || [];
    } catch (error) {
      logger.error('Error getting availability:', error);
      throw error;
    }
  }

  async getLawyerAvailability(lawyerId: number) {
    try {
      const lawyer = await this.getLawyerById(lawyerId);
      return lawyer?.availabilityCalendar || [];
    } catch (error) {
      logger.error('Error getting lawyer availability:', error);
      throw error;
    }
  }

  async updateAvailabilitySlot(userId: string, slotId: string, data: {
    startTime?: string;
    endTime?: string;
    isAvailable?: boolean;
  }) {
    try {
      const lawyer = await this.getLawyerProfile(userId);
      if (!lawyer) {
        throw new Error('Lawyer profile not found');
      }

      const availability = lawyer.availabilityCalendar || [];
      const updatedAvailability = availability.map(slot => 
        slot.id === slotId ? { ...slot, ...data } : slot
      );

      const updated = await db.update(lawyers)
        .set({
          availabilityCalendar: updatedAvailability
        })
        .where(eq(lawyers.userId, userId))
        .returning();

      return updated[0];
    } catch (error) {
      logger.error('Error updating availability slot:', error);
      throw error;
    }
  }

  async deleteAvailabilitySlot(userId: string, slotId: string) {
    try {
      const lawyer = await this.getLawyerProfile(userId);
      if (!lawyer) {
        throw new Error('Lawyer profile not found');
      }

      const availability = lawyer.availabilityCalendar || [];
      const updatedAvailability = availability.filter(slot => slot.id !== slotId);

      const updated = await db.update(lawyers)
        .set({
          availabilityCalendar: updatedAvailability
        })
        .where(eq(lawyers.userId, userId))
        .returning();

      return updated[0];
    } catch (error) {
      logger.error('Error deleting availability slot:', error);
      throw error;
    }
  }
}

export const lawyerMarketplaceService = new LawyerMarketplaceService(); 