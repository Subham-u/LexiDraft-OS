import { Router } from 'express';
import { documentActivityService } from '../services/document-activity.service';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

// Log document activity
router.post('/',
  authenticate,
  validateRequest({
    body: z.object({
      documentId: z.number(),
      activityType: z.string(),
      metadata: z.any().optional()
    })
  }),
  async (req, res) => {
    try {
      const activity = await documentActivityService.logActivity({
        documentId: req.body.documentId,
        userId: req.user.uid,
        activityType: req.body.activityType,
        metadata: req.body.metadata
      });
      res.json({ success: true, activity });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Get activities for specific document
router.get('/:documentId',
  authenticate,
  async (req, res) => {
    try {
      const activities = await documentActivityService.getDocumentActivities(
        parseInt(req.params.documentId)
      );
      res.json({ success: true, activities });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Get all user's document activities
router.get('/',
  authenticate,
  async (req, res) => {
    try {
      const activities = await documentActivityService.getUserDocumentActivities(
        req.user.uid
      );
      res.json({ success: true, activities });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

export default router; 