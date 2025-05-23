import { Router } from 'express';
import { documentSharingService } from '../services/document-sharing.service';
import { documentActivityService } from '../services/document-activity.service';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

// Generate email template for sharing
router.post('/email-template',
  authenticate,
  validateRequest({
    body: z.object({
      documentId: z.number(),
      recipientEmail: z.string().email()
    })
  }),
  async (req, res) => {
    try {
      const template = await documentSharingService.generateEmailTemplate(
        req.body.documentId,
        req.body.recipientEmail
      );
      res.json({ success: true, template });
    } catch (error:any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Send contract via email
router.post('/send-email',
  authenticate,
  validateRequest({
    body: z.object({
      documentId: z.number(),
      recipientEmail: z.string().email(),
      message: z.string().optional()
    })
  }),
  async (req, res) => {
    try {
      await documentSharingService.sendDocumentViaEmail(
        req.body.documentId,
        req.body.recipientEmail,
        req.body.message
      );
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Create shareable document links
router.post('/shared-links',
  authenticate,
  validateRequest({
    body: z.object({
      documentId: z.number(),
      expiresAt: z.string().datetime().optional()
    })
  }),
  async (req, res) => {
    try {
      const sharedLink = await documentSharingService.createSharedLink(
        req.body.documentId,
        req.user.uid,
        req.body.expiresAt ? new Date(req.body.expiresAt) : undefined
      );
      res.json({ success: true, sharedLink });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Get shared links for document
router.get('/shared-links/document/:documentId',
  authenticate,
  async (req, res) => {
    try {
      const links = await documentSharingService.getSharedLinksForDocument(
        parseInt(req.params.documentId)
      );
      res.json({ success: true, links });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Access document via shared link
router.get('/shared-links/:uniqueId',
  async (req, res) => {
    try {
      const document = await documentSharingService.getDocumentBySharedLink(
        req.params.uniqueId
      );
      res.json({ success: true, document });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Deactivate shared link
router.post('/shared-links/:uniqueId/deactivate',
  authenticate,
  async (req, res) => {
    try {
      await documentSharingService.deactivateSharedLink(req.params.uniqueId);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

export default router; 