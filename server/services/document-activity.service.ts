import { db } from '../db';
import { documentActivities } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { createLogger } from '../utils/logger';

const logger = createLogger('document-activity-service');

export class DocumentActivityService {
  async logActivity(data: {
    documentId: number;
    userId: string;
    activityType: string;
    metadata?: any;
  }) {
    try {
      const activity = await db.insert(documentActivities).values({
        documentId: data.documentId,
        userId: data.userId,
        activityType: data.activityType,
        metadata: data.metadata || {}
      }).returning();

      return activity[0];
    } catch (error) {
      logger.error('Error logging document activity:', error);
      throw error;
    }
  }

  async getDocumentActivities(documentId: number) {
    try {
      const activities = await db.query.documentActivities.findMany({
        where: eq(documentActivities.documentId, documentId),
        orderBy: (activities, { desc }) => [desc(activities.createdAt)]
      });
      return activities;
    } catch (error) {
      logger.error('Error getting document activities:', error);
      throw error;
    }
  }

  async getUserDocumentActivities(userId: string) {
    try {
      const activities = await db.query.documentActivities.findMany({
        where: eq(documentActivities.userId, userId),
        orderBy: (activities, { desc }) => [desc(activities.createdAt)]
      });
      return activities;
    } catch (error) {
      logger.error('Error getting user document activities:', error);
      throw error;
    }
  }
}

export const documentActivityService = new DocumentActivityService(); 