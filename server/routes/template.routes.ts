/**
 * Template routes for managing contract templates
 */
import express, { Router, Request, Response } from 'express';
import { asyncHandler, ApiError } from '../middleware/error';
import { authenticate } from '../middleware/auth';
import { createLogger } from '../utils/logger';
import * as templateService from '../services/template.service';
import { insertTemplateSchema } from '../../shared/schema';

const router: Router = express.Router();
const logger = createLogger('template-routes');

/**
 * Get all templates (public or user's templates)
 * @route GET /api/templates
 */
router.get("/", authenticate(false), asyncHandler(async (req: Request, res: Response) => {
  logger.info('Getting templates');
  
  let templates;
  
  // If user is authenticated, get their templates and public templates
  if (req.user) {
    const userTemplates = await templateService.getTemplatesByUserId(req.user.id);
    const publicTemplates = await templateService.getPublicTemplates();
    
    // Combine and deduplicate by ID
    const templateMap = new Map();
    [...userTemplates, ...publicTemplates].forEach(template => {
      templateMap.set(template.id, template);
    });
    
    templates = Array.from(templateMap.values());
  } else {
    // Otherwise, just get public templates
    templates = await templateService.getPublicTemplates();
  }
  
  return res.json({
    success: true,
    data: templates
  });
}));

/**
 * Get popular templates
 * @route GET /api/templates/popular
 */
router.get("/popular", asyncHandler(async (req: Request, res: Response) => {
  logger.info('Getting popular templates');
  
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
  const templates = await templateService.getPopularTemplates(limit);
  
  return res.json({
    success: true,
    data: templates
  });
}));

/**
 * Get template by ID
 * @route GET /api/templates/:id
 */
router.get("/:id", authenticate(false), asyncHandler(async (req: Request, res: Response) => {
  const templateId = parseInt(req.params.id);
  
  if (isNaN(templateId)) {
    throw ApiError.badRequest('Invalid template ID');
  }
  
  logger.info(`Getting template by ID: ${templateId}`);
  
  const template = await templateService.getTemplateById(templateId);
  
  if (!template) {
    throw ApiError.notFound('Template not found');
  }
  
  // Check if template is public or belongs to the user
  if (!template.isPublic && (!req.user || template.userId !== req.user.id)) {
    throw ApiError.forbidden('You do not have permission to access this template');
  }
  
  return res.json({
    success: true,
    data: template
  });
}));

/**
 * Create a new template
 * @route POST /api/templates
 */
router.post("/", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  logger.info(`Creating new template for user: ${req.user.id}`);
  
  // Add user ID to template data
  const templateData = {
    ...req.body,
    userId: req.user.id
  };
  
  // Validate template data
  const validatedData = insertTemplateSchema.parse(templateData);
  
  // Create template
  const newTemplate = await templateService.createTemplate(validatedData);
  
  return res.status(201).json({
    success: true,
    data: newTemplate
  });
}));

/**
 * Update an existing template
 * @route PATCH /api/templates/:id
 */
router.patch("/:id", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const templateId = parseInt(req.params.id);
  
  if (isNaN(templateId)) {
    throw ApiError.badRequest('Invalid template ID');
  }
  
  logger.info(`Updating template ${templateId} for user: ${req.user.id}`);
  
  // Check if template exists and belongs to user
  const existingTemplate = await templateService.getTemplateById(templateId);
  
  if (!existingTemplate) {
    throw ApiError.notFound('Template not found');
  }
  
  if (existingTemplate.userId !== req.user.id) {
    throw ApiError.forbidden('You do not have permission to update this template');
  }
  
  // Update template
  const updatedTemplate = await templateService.updateTemplate(templateId, req.body);
  
  return res.json({
    success: true,
    data: updatedTemplate
  });
}));

/**
 * Delete a template
 * @route DELETE /api/templates/:id
 */
router.delete("/:id", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const templateId = parseInt(req.params.id);
  
  if (isNaN(templateId)) {
    throw ApiError.badRequest('Invalid template ID');
  }
  
  logger.info(`Deleting template ${templateId} for user: ${req.user.id}`);
  
  // Check if template exists and belongs to user
  const existingTemplate = await templateService.getTemplateById(templateId);
  
  if (!existingTemplate) {
    throw ApiError.notFound('Template not found');
  }
  
  // Only owner or admin can delete template
  if (existingTemplate.userId !== req.user.id && req.user.role !== 'admin') {
    throw ApiError.forbidden('You do not have permission to delete this template');
  }
  
  // Delete template
  await templateService.deleteTemplate(templateId);
  
  return res.json({
    success: true,
    message: 'Template deleted successfully'
  });
}));

/**
 * Toggle template public status
 * @route PATCH /api/templates/:id/public
 */
router.patch("/:id/public", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const templateId = parseInt(req.params.id);
  const { isPublic } = req.body;
  
  if (isNaN(templateId)) {
    throw ApiError.badRequest('Invalid template ID');
  }
  
  if (typeof isPublic !== 'boolean') {
    throw ApiError.badRequest('isPublic boolean value is required');
  }
  
  logger.info(`Updating template ${templateId} public status to ${isPublic}`);
  
  // Check if template exists and belongs to user
  const existingTemplate = await templateService.getTemplateById(templateId);
  
  if (!existingTemplate) {
    throw ApiError.notFound('Template not found');
  }
  
  if (existingTemplate.userId !== req.user.id && req.user.role !== 'admin') {
    throw ApiError.forbidden('You do not have permission to update this template');
  }
  
  // Toggle public status
  const updatedTemplate = await templateService.toggleTemplatePublic(templateId, isPublic);
  
  return res.json({
    success: true,
    data: updatedTemplate
  });
}));

export default router;