/**
 * Consultation service routes
 */
import express, { Request, Response, Router } from 'express';
import { consultationControllers } from './controllers';
import { asyncHandler } from '../../../shared/middleware/error';
import { authenticate } from '../../../shared/middleware/auth';
import { createLogger } from '../../../shared/utils/logger';

// Create router for the consultation service
const router: Router = express.Router();
const logger = createLogger('consultation-service-routes');

// Get consultation by ID
router.get('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const consultationId = parseInt(req.params.id);
  const userId = req.user!.id;
  
  const result = await consultationControllers.getConsultationById(consultationId, userId);
  res.json(result);
}));

// Get all consultations for authenticated user
router.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  const result = await consultationControllers.getUserConsultations(userId);
  res.json(result);
}));

// Get upcoming consultations
router.get('/upcoming', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
  
  const result = await consultationControllers.getUpcomingConsultations(userId, limit);
  res.json(result);
}));

// Create a new consultation
router.post('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  // Validate required fields
  const requiredFields = ['lawyerId', 'scheduledTime', 'duration', 'mode', 'subject', 'price'];
  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res.status(400).json({
        success: false,
        error: 'missing_field',
        message: `${field} is required`
      });
    }
  }
  
  const result = await consultationControllers.createConsultation(userId, req.body);
  res.status(201).json(result);
}));

// Update consultation status
router.patch('/:id/status', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const consultationId = parseInt(req.params.id);
  const userId = req.user!.id;
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({
      success: false,
      error: 'missing_status',
      message: 'Status is required'
    });
  }
  
  const result = await consultationControllers.updateConsultationStatus(consultationId, userId, status);
  res.json(result);
}));

// Add a note to a consultation
router.post('/:id/notes', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const consultationId = parseInt(req.params.id);
  const userId = req.user!.id;
  const { note } = req.body;
  
  if (!note) {
    return res.status(400).json({
      success: false,
      error: 'missing_note',
      message: 'Note content is required'
    });
  }
  
  const result = await consultationControllers.addConsultationNote(consultationId, userId, note);
  res.json(result);
}));

// Share a document in a consultation
router.post('/:id/documents', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const consultationId = parseInt(req.params.id);
  const userId = req.user!.id;
  
  const requiredFields = ['title', 'url', 'type'];
  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res.status(400).json({
        success: false,
        error: 'missing_field',
        message: `${field} is required`
      });
    }
  }
  
  const result = await consultationControllers.shareDocument(consultationId, userId, req.body);
  res.json(result);
}));

// Get shared documents for a consultation
router.get('/:id/documents', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const consultationId = parseInt(req.params.id);
  const userId = req.user!.id;
  
  const result = await consultationControllers.getSharedDocuments(consultationId, userId);
  res.json(result);
}));

// Service status endpoint
router.get('/status', (req: Request, res: Response) => {
  const status = consultationControllers.getStatus();
  res.json(status);
});

export const routes = router;