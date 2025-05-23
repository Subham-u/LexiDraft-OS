import { db } from '../db';
import { sharedDocuments, documentVersions, documentActivities } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { sendEmail } from '../utils/email';
import { createLogger } from '../utils/logger';

const logger = createLogger('document-sharing-service');

export class DocumentSharingService {
  async generateEmailTemplate(documentId: number, recipientEmail: string) {
    try {
      const document = await db.query.sharedDocuments.findFirst({
        where: eq(sharedDocuments.id, documentId)
      });

      if (!document) {
        throw new Error('Document not found');
      }

      const template = `
        <h2>Document Shared with You</h2>
        <p>You have been granted access to a document.</p>
        <p>Document Name: ${document.name}</p>
        <p>Click the link below to access the document:</p>
        <a href="${process.env.FRONTEND_URL}/shared/${document.id}">Access Document</a>
      `;

      return template;
    } catch (error) {
      logger.error('Error generating email template:', error);
      throw error;
    }
  }

  async sendDocumentViaEmail(documentId: number, recipientEmail: string, message?: string) {
    try {
      const template = await this.generateEmailTemplate(documentId, recipientEmail);
      await sendEmail({
        to: recipientEmail,
        subject: 'Document Shared with You',
        html: template
      });
      return true;
    } catch (error) {
      logger.error('Error sending document via email:', error);
      throw error;
    }
  }

  async createSharedLink(documentId: number, userId: string, expiresAt?: Date) {
    try {
      const uniqueId = nanoid();
      const sharedLink = await db.insert(sharedDocuments).values({
        documentId,
        userId,
        uniqueId,
        expiresAt,
        isActive: true
      }).returning();

      return sharedLink[0];
    } catch (error) {
      logger.error('Error creating shared link:', error);
      throw error;
    }
  }

  async getSharedLinksForDocument(documentId: number) {
    try {
      const links = await db.query.sharedDocuments.findMany({
        where: eq(sharedDocuments.documentId, documentId)
      });
      return links;
    } catch (error) {
      logger.error('Error getting shared links:', error);
      throw error;
    }
  }

  async getDocumentBySharedLink(uniqueId: string) {
    try {
      const sharedLink = await db.query.sharedDocuments.findFirst({
        where: eq(sharedDocuments.uniqueId, uniqueId)
      });

      if (!sharedLink || !sharedLink.isActive) {
        throw new Error('Shared link not found or inactive');
      }

      if (sharedLink.expiresAt && new Date() > sharedLink.expiresAt) {
        throw new Error('Shared link has expired');
      }

      return sharedLink;
    } catch (error) {
      logger.error('Error getting document by shared link:', error);
      throw error;
    }
  }

  async deactivateSharedLink(uniqueId: string) {
    try {
      await db.update(sharedDocuments)
        .set({ isActive: false })
        .where(eq(sharedDocuments.uniqueId, uniqueId));
      return true;
    } catch (error) {
      logger.error('Error deactivating shared link:', error);
      throw error;
    }
  }
}

export const documentSharingService = new DocumentSharingService(); 