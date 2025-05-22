/**
 * Role Management API Routes
 */
import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { createLogger } from '../utils/logger';
import { z } from 'zod';
import * as roleService from '../services/role.service';
import { type Permission } from '../../shared/schema';

const router = Router();
const logger = createLogger('role-routes');

// Validation schemas
const permissionSchema = z.object({
  controller: z.string().min(1),
  action: z.string().min(1),
  enabled: z.boolean().default(true)
});

const createRoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1)
});

const updateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  permissions: z.array(permissionSchema).optional()
});

/**
 * @route POST /api/roles
 * @desc Create a new role (Admin only)
 */
router.post('/roles', authenticate, asyncHandler(async (req: Request, res: Response) => {
  // Check if user is admin
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Admin access required'
    });
  }

  logger.info('Creating new role');
  
  try {
    // Validate role data
    const roleData = createRoleSchema.parse(req.body);
    
    // Create role
    const role = await roleService.createRole(roleData);
    
    return res.status(201).json({
      success: true,
      data: role
    });
  } catch (error: any) {
    logger.error(`Error creating role: ${error.message}`, error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role data',
        errors: error.errors
      });
    }
    throw error;
  }
}));

/**
 * @route GET /api/roles
 * @desc Get all roles (Admin only)
 */
router.get('/roles', authenticate, asyncHandler(async (req: Request, res: Response) => {
  // Check if user is admin
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Admin access required'
    });
  }

  logger.info('Getting all roles');
  
  try {
    const roles = await roleService.getAllRoles();
    
    return res.json({
      success: true,
      data: roles
    });
  } catch (error: any) {
    logger.error(`Error getting roles: ${error.message}`, error);
    throw error;
  }
}));

/**
 * @route GET /api/roles/:roleId
 * @desc Get role by ID (Admin only)
 */
router.get('/roles/:roleId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  // Check if user is admin
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Admin access required'
    });
  }

  const { roleId } = req.params;
  logger.info(`Getting role with ID: ${roleId}`);
  
  try {
    const role = await roleService.getRoleById(roleId);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    return res.json({
      success: true,
      data: role
    });
  } catch (error: any) {
    logger.error(`Error getting role: ${error.message}`, error);
    throw error;
  }
}));

/**
 * @route PUT /api/roles/:roleId
 * @desc Update role (Admin only)
 */
router.put('/roles/:roleId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  // Check if user is admin
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Admin access required'
    });
  }

  const { roleId } = req.params;
  logger.info(`Updating role with ID: ${roleId}`);
  
  try {
    // Validate update data
    const updateData = updateRoleSchema.parse(req.body);
    
    // Update role
    const updatedRole = await roleService.updateRole(roleId, updateData);
    
    return res.json({
      success: true,
      data: updatedRole
    });
  } catch (error: any) {
    logger.error(`Error updating role: ${error.message}`, error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role data',
        errors: error.errors
      });
    }
    throw error;
  }
}));

/**
 * @route DELETE /api/roles/:roleId
 * @desc Delete role (Admin only)
 */
router.delete('/roles/:roleId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  // Check if user is admin
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Admin access required'
    });
  }

  const { roleId } = req.params;
  logger.info(`Deleting role with ID: ${roleId}`);
  
  try {
    await roleService.deleteRole(roleId);
    
    return res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error: any) {
    logger.error(`Error deleting role: ${error.message}`, error);
    if (error.name === 'NotFoundError') {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    throw error;
  }
}));

export default router; 