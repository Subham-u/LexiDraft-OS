/**
 * Template routes
 */
import express, { Router, Request, Response } from 'express';
import { authenticate } from '../shared/middleware/auth';
import { asyncHandler, ApiError } from '../shared/middleware/error';
import { createLogger } from '../shared/utils/logger';
import { storage } from '../storage';
import { insertTemplateSchema } from '@shared/schema';

const router: Router = express.Router();
const logger = createLogger('template-routes');

/**
 * Get all templates
 */
router.get("/", asyncHandler(async (req: Request, res: Response) => {
  logger.info("All templates requested");
  
  // Get templates from storage
  const templates = await storage.getAllTemplates();
  
  // Filter public templates for unauthenticated users
  let filteredTemplates = templates;
  if (!req.user) {
    filteredTemplates = templates.filter(t => t.isPublic);
  }
  
  return res.json({
    success: true,
    data: filteredTemplates
  });
}));

/**
 * Get popular templates
 */
router.get("/popular", asyncHandler(async (req: Request, res: Response) => {
  logger.info("Popular templates requested");
  
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
  
  // Get popular templates from storage
  const templates = await storage.getPopularTemplates(limit);
  
  return res.json({
    success: true,
    data: templates
  });
}));

/**
 * Get template by ID
 */
router.get("/:id", asyncHandler(async (req: Request, res: Response) => {
  const templateId = parseInt(req.params.id);
  
  if (isNaN(templateId)) {
    throw ApiError.badRequest('Invalid template ID');
  }
  
  logger.info(`Template requested by ID: ${templateId}`);
  
  // Get template from storage
  const template = await storage.getTemplate(templateId);
  
  if (!template) {
    throw ApiError.notFound('Template not found');
  }
  
  // Check access for private templates
  if (!template.isPublic && !req.user) {
    throw ApiError.forbidden('This template is not available for public access');
  }
  
  return res.json({
    success: true,
    data: template
  });
}));

/**
 * Create a new template
 */
router.post("/", authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  logger.info(`Creating new template for user: ${req.user.id}`);
  
  // Validate template data
  const templateData = {
    ...req.body,
    userId: req.user.id
  };
  
  try {
    // Validate using zod schema
    insertTemplateSchema.parse(templateData);
  } catch (error) {
    throw ApiError.badRequest('Invalid template data');
  }
  
  // Create template in storage
  const newTemplate = await storage.createTemplate(templateData);
  
  return res.status(201).json({
    success: true,
    data: newTemplate
  });
}));

export default router;