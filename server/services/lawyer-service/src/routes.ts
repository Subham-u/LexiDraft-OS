/**
 * Lawyer service routes
 */
import express, { Request, Response, Router } from 'express';
import { lawyerControllers } from './controllers';
import { asyncHandler } from '../../../shared/middleware/error';
import { authenticate } from '../../../shared/middleware/auth';
import { createLogger } from '../../../shared/utils/logger';

// Create router for the lawyer service
const router: Router = express.Router();
const logger = createLogger('lawyer-service-routes');

// Get all lawyers with optional filters
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const filters = req.query.filters ? JSON.parse(req.query.filters as string) : {};
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  
  const result = await lawyerControllers.getAllLawyers(filters, limit, page);
  res.json(result);
}));

// Get featured lawyers
router.get('/featured', asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
  
  const result = await lawyerControllers.getFeaturedLawyers(limit);
  res.json(result);
}));

// Get a specific lawyer by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const lawyerId = parseInt(req.params.id);
  
  const result = await lawyerControllers.getLawyerById(lawyerId);
  res.json(result);
}));

// Get lawyer availability
router.get('/:id/availability', asyncHandler(async (req: Request, res: Response) => {
  const lawyerId = parseInt(req.params.id);
  const date = req.query.date as string | undefined;
  
  const result = await lawyerControllers.getLawyerAvailability(lawyerId, date);
  res.json(result);
}));

// Get reviews for a lawyer
router.get('/:id/reviews', asyncHandler(async (req: Request, res: Response) => {
  const lawyerId = parseInt(req.params.id);
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  
  const result = await lawyerControllers.getLawyerReviews(lawyerId, limit, page);
  res.json(result);
}));

// Add a review for a lawyer (requires authentication)
router.post('/:id/reviews', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const lawyerId = parseInt(req.params.id);
  const userId = req.user!.id;
  const { rating, comment } = req.body;
  
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      error: 'invalid_rating',
      message: 'Rating must be between 1 and 5'
    });
  }
  
  if (!comment) {
    return res.status(400).json({
      success: false,
      error: 'missing_comment',
      message: 'Comment is required'
    });
  }
  
  const result = await lawyerControllers.addLawyerReview(lawyerId, userId, { rating, comment });
  res.status(201).json(result);
}));

// Search for lawyers by keyword
router.get('/search', asyncHandler(async (req: Request, res: Response) => {
  const query = req.query.query as string;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  
  if (!query) {
    return res.status(400).json({
      success: false,
      error: 'missing_query',
      message: 'Search query is required'
    });
  }
  
  const result = await lawyerControllers.searchLawyers(query, limit, page);
  res.json(result);
}));

// Get practice areas
router.get('/practice-areas', asyncHandler(async (req: Request, res: Response) => {
  const result = await lawyerControllers.getPracticeAreas();
  res.json(result);
}));

// Service status endpoint
router.get('/status', (req: Request, res: Response) => {
  const status = lawyerControllers.getStatus();
  res.json(status);
});

export const routes = router;