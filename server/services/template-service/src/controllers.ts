/**
 * Template service controllers
 */
import { createLogger } from '../../../shared/utils/logger';
import { ApiError } from '../../../shared/middleware/error';
import { config } from './config';
import { storage } from '../../../storage';
import type { Template } from '../../../shared/schema';

const logger = createLogger('template-service-controllers');

export const templateControllers = {
  // Get all templates with optional filters
  getAllTemplates: async (filters: Record<string, any> = {}, limit: number = 20, page: number = 1) => {
    try {
      // Get all templates from storage
      let templates = await storage.getAllTemplates();
      
      // Apply filters if provided
      if (filters.category) {
        templates = templates.filter(template => 
          template.category === filters.category
        );
      }
      
      if (filters.isPremium !== undefined) {
        templates = templates.filter(template => 
          template.isPremium === filters.isPremium
        );
      }
      
      if (filters.query) {
        const query = filters.query.toLowerCase();
        templates = templates.filter(template => 
          template.title.toLowerCase().includes(query) || 
          template.description.toLowerCase().includes(query)
        );
      }
      
      // Calculate total before pagination
      const total = templates.length;
      
      // Implement pagination
      const skip = (page - 1) * limit;
      templates = templates.slice(skip, skip + limit);
      
      return {
        success: true,
        data: templates,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching templates', { error });
      throw error;
    }
  },
  
  // Get a specific template by ID
  getTemplateById: async (templateId: number) => {
    try {
      const template = await storage.getTemplate(templateId);
      
      if (!template) {
        throw ApiError.notFound('Template not found');
      }
      
      return {
        success: true,
        data: template
      };
    } catch (error) {
      logger.error(`Error fetching template ${templateId}`, { error });
      throw error;
    }
  },
  
  // Get popular templates
  getPopularTemplates: async (limit: number = 5) => {
    try {
      // Get all templates
      const templates = await storage.getPopularTemplates(limit);
      
      return {
        success: true,
        data: templates
      };
    } catch (error) {
      logger.error('Error fetching popular templates', { error });
      throw error;
    }
  },
  
  // Create a new template
  createTemplate: async (userId: number, templateData: any) => {
    try {
      const { title, description, content, category, isPremium, price } = templateData;
      
      // Validate category
      if (!config.categories.includes(category)) {
        throw ApiError.badRequest(`Invalid category. Must be one of: ${config.categories.join(', ')}`);
      }
      
      // Create template
      const template = await storage.createTemplate({
        userId,
        title,
        description,
        content,
        category,
        isPremium: isPremium || false,
        price: price || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      return {
        success: true,
        data: template
      };
    } catch (error) {
      logger.error('Error creating template', { error });
      throw error;
    }
  },
  
  // Update a template
  updateTemplate: async (templateId: number, userId: number, templateData: any) => {
    try {
      // Get the template to check ownership
      const template = await storage.getTemplate(templateId);
      
      if (!template) {
        throw ApiError.notFound('Template not found');
      }
      
      // Check if user owns the template or is an admin
      if (template.userId !== userId && !templateData.isAdmin) {
        throw ApiError.forbidden('You do not have permission to update this template');
      }
      
      // Validate category if provided
      if (templateData.category && !config.categories.includes(templateData.category)) {
        throw ApiError.badRequest(`Invalid category. Must be one of: ${config.categories.join(', ')}`);
      }
      
      // Update template
      const updatedTemplate = await storage.updateTemplate(templateId, {
        ...templateData,
        updatedAt: new Date().toISOString()
      });
      
      return {
        success: true,
        data: updatedTemplate
      };
    } catch (error) {
      logger.error(`Error updating template ${templateId}`, { error });
      throw error;
    }
  },
  
  // Purchase a template
  purchaseTemplate: async (templateId: number, userId: number) => {
    try {
      // Get the template
      const template = await storage.getTemplate(templateId);
      
      if (!template) {
        throw ApiError.notFound('Template not found');
      }
      
      // Check if template is premium and requires purchase
      if (!template.isPremium) {
        throw ApiError.badRequest('This template is free and does not require purchase');
      }
      
      // Check if user has already purchased the template
      const hasPurchased = await storage.hasUserPurchasedTemplate(userId, templateId);
      
      if (hasPurchased) {
        throw ApiError.badRequest('You have already purchased this template');
      }
      
      // Create purchase record
      // This would typically involve payment processing, which would be handled by the payment service
      // For now, we'll just record the purchase
      const purchase = await storage.recordTemplatePurchase(userId, templateId, template.price);
      
      return {
        success: true,
        data: {
          templateId,
          userId,
          purchaseId: purchase.id,
          purchaseDate: purchase.createdAt
        }
      };
    } catch (error) {
      logger.error(`Error purchasing template ${templateId}`, { error });
      throw error;
    }
  },
  
  // Get user's purchased templates
  getUserPurchasedTemplates: async (userId: number) => {
    try {
      // Get user's purchases
      const purchases = await storage.getUserTemplatePurchases(userId);
      
      // Get the template details for each purchase
      const templateIds = purchases.map(purchase => purchase.templateId);
      const templates = await Promise.all(
        templateIds.map(id => storage.getTemplate(id))
      );
      
      // Filter out any templates that might have been deleted
      const validTemplates = templates.filter(Boolean);
      
      return {
        success: true,
        data: validTemplates
      };
    } catch (error) {
      logger.error(`Error fetching purchased templates for user ${userId}`, { error });
      throw error;
    }
  },
  
  // Get template categories
  getTemplateCategories: async () => {
    try {
      return {
        success: true,
        data: config.categories
      };
    } catch (error) {
      logger.error('Error fetching template categories', { error });
      throw error;
    }
  },
  
  // Search templates by keyword
  searchTemplates: async (query: string, limit: number = 20, page: number = 1) => {
    try {
      // Get all templates
      const templates = await storage.getAllTemplates();
      
      // Filter templates by the search query
      const searchResults = templates.filter(template => 
        template.title.toLowerCase().includes(query.toLowerCase()) ||
        template.description.toLowerCase().includes(query.toLowerCase()) ||
        template.category.toLowerCase().includes(query.toLowerCase())
      );
      
      // Calculate total before pagination
      const total = searchResults.length;
      
      // Implement pagination
      const skip = (page - 1) * limit;
      const paginatedResults = searchResults.slice(skip, skip + limit);
      
      return {
        success: true,
        data: paginatedResults,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          query
        }
      };
    } catch (error) {
      logger.error(`Error searching templates with query: ${query}`, { error });
      throw error;
    }
  },
  
  // Get service status
  getStatus: () => {
    return {
      success: true,
      service: 'template-service',
      version: config.version,
      features: config.features,
      status: 'operational',
      timestamp: new Date().toISOString()
    };
  }
};