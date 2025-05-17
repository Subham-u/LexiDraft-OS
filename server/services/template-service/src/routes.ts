/**
 * Template service routes
 */
import express, { Request, Response, Router } from 'express';
import { templateControllers } from './controllers';
import { asyncHandler } from '../../../shared/middleware/error';
import { authenticate } from '../../../shared/middleware/auth';
import { createLogger } from '../../../shared/utils/logger';

// Create router for the template service
const router: Router = express.Router();
const logger = createLogger('template-service-routes');

// Get all templates with optional filters
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const filters = req.query.filters ? JSON.parse(req.query.filters as string) : {};
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  
  const result = await templateControllers.getAllTemplates(filters, limit, page);
  res.json(result);
}));

// Get a specific template by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const templateId = parseInt(req.params.id);
  
  const result = await templateControllers.getTemplateById(templateId);
  res.json(result);
}));

// Get popular templates
router.get('/popular', asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
  
  const result = await templateControllers.getPopularTemplates(limit);
  res.json(result);
}));

// Create a new template (requires authentication)
router.post('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  // Validate required fields
  const requiredFields = ['title', 'description', 'content', 'category'];
  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res.status(400).json({
        success: false,
        error: 'missing_field',
        message: `${field} is required`
      });
    }
  }
  
  const result = await templateControllers.createTemplate(userId, req.body);
  res.status(201).json(result);
}));

// Update a template (requires authentication)
router.patch('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const templateId = parseInt(req.params.id);
  const userId = req.user!.id;
  
  const result = await templateControllers.updateTemplate(templateId, userId, req.body);
  res.json(result);
}));

// Purchase a template (requires authentication)
router.post('/:id/purchase', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const templateId = parseInt(req.params.id);
  const userId = req.user!.id;
  
  const result = await templateControllers.purchaseTemplate(templateId, userId);
  res.status(201).json(result);
}));

// Get user's purchased templates (requires authentication)
router.get('/purchased', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  const result = await templateControllers.getUserPurchasedTemplates(userId);
  res.json(result);
}));

// Get template categories
router.get('/categories', asyncHandler(async (req: Request, res: Response) => {
  const result = await templateControllers.getTemplateCategories();
  res.json(result);
}));

// Search templates by keyword
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
  
  const result = await templateControllers.searchTemplates(query, limit, page);
  res.json(result);
}));

// Service status endpoint
router.get('/status', (req: Request, res: Response) => {
  const status = templateControllers.getStatus();
  res.json(status);
});

export const routes = router;