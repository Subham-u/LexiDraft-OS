/**
 * Template service for managing contract templates
 */
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { templates, type Template, type InsertTemplate } from '../../shared/schema';
import { createLogger } from '../utils/logger';
import { ApiError } from '../middleware/error';

const logger = createLogger('template-service');

/**
 * Get all templates
 */
export async function getAllTemplates(): Promise<Template[]> {
  try {
    return await db.select().from(templates);
  } catch (error) {
    logger.error('Error getting all templates', error);
    throw error;
  }
}

/**
 * Get public templates
 */
export async function getPublicTemplates(): Promise<Template[]> {
  try {
    return await db
      .select()
      .from(templates)
      .where(eq(templates.isPublic, true));
  } catch (error) {
    logger.error('Error getting public templates', error);
    throw error;
  }
}

/**
 * Get templates by user ID
 */
export async function getTemplatesByUserId(userId: number): Promise<Template[]> {
  try {
    return await db
      .select()
      .from(templates)
      .where(eq(templates.userId, userId));
  } catch (error) {
    logger.error(`Error getting templates for user: ${userId}`, error);
    throw error;
  }
}

/**
 * Get template by ID
 */
export async function getTemplateById(id: number): Promise<Template | null> {
  try {
    const [template] = await db
      .select()
      .from(templates)
      .where(eq(templates.id, id));
    
    return template || null;
  } catch (error) {
    logger.error(`Error getting template by ID: ${id}`, error);
    throw error;
  }
}

/**
 * Create a new template
 */
export async function createTemplate(templateData: any): Promise<Template> {
  try {
    const [newTemplate] = await db
      .insert(templates)
      .values({
        ...templateData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    logger.info(`Template created with ID: ${newTemplate.id}`);
    return newTemplate;
  } catch (error) {
    logger.error('Error creating template', error);
    throw error;
  }
}

/**
 * Update an existing template
 */
export async function updateTemplate(id: number, templateData: Partial<any>): Promise<Template> {
  try {
    // Check if template exists
    const template = await getTemplateById(id);
    if (!template) {
      throw ApiError.notFound('Template not found');
    }
    
    // Update template
    const [updatedTemplate] = await db
      .update(templates)
      .set({
        ...templateData,
        updatedAt: new Date()
      })
      .where(eq(templates.id, id))
      .returning();
    
    logger.info(`Template updated: ${id}`);
    return updatedTemplate;
  } catch (error) {
    logger.error(`Error updating template: ${id}`, error);
    throw error;
  }
}

/**
 * Delete a template
 */
export async function deleteTemplate(id: number): Promise<void> {
  try {
    // Check if template exists
    const template = await getTemplateById(id);
    if (!template) {
      throw ApiError.notFound('Template not found');
    }
    
    // Delete template
    await db
      .delete(templates)
      .where(eq(templates.id, id));
    
    logger.info(`Template deleted: ${id}`);
  } catch (error) {
    logger.error(`Error deleting template: ${id}`, error);
    throw error;
  }
}

/**
 * Get popular templates with limit
 */
export async function getPopularTemplates(limit: number = 5): Promise<Template[]> {
  try {
    // In a real application, this might consider factors like download count or usage
    // For now, just return public templates with a limit
    const allTemplates = await getPublicTemplates();
    return allTemplates.slice(0, limit);
  } catch (error) {
    logger.error('Error getting popular templates', error);
    throw error;
  }
}

/**
 * Toggle template public status
 */
export async function toggleTemplatePublic(id: number, isPublic: boolean): Promise<Template> {
  try {
    const [updatedTemplate] = await db
      .update(templates)
      .set({
        isPublic,
        updatedAt: new Date()
      })
      .where(eq(templates.id, id))
      .returning();
    
    if (!updatedTemplate) {
      throw ApiError.notFound('Template not found');
    }
    
    logger.info(`Template ${id} public status set to: ${isPublic}`);
    return updatedTemplate;
  } catch (error) {
    logger.error(`Error updating template public status: ${id}`, error);
    throw error;
  }
}