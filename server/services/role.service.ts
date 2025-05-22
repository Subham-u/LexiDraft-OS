/**
 * Role Management Service
 */
import { db } from '../db';
import { roles, permissions, type Permission } from '../../shared/schema';
import { createLogger } from '../utils/logger';
import { ApiError } from '../middleware/error';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('role-service');

// Default permissions for each role
const DEFAULT_PERMISSIONS = {
  user: [
    { controller: 'contracts', action: 'read', enabled: true },
    { controller: 'contracts', action: 'create', enabled: true },
    { controller: 'contracts', action: 'update', enabled: true },
    { controller: 'contracts', action: 'delete', enabled: false },
    { controller: 'templates', action: 'read', enabled: true },
    { controller: 'templates', action: 'create', enabled: false },
    { controller: 'templates', action: 'update', enabled: false },
    { controller: 'templates', action: 'delete', enabled: false }
  ],
  lawyer: [
    { controller: 'contracts', action: 'read', enabled: true },
    { controller: 'contracts', action: 'create', enabled: true },
    { controller: 'contracts', action: 'update', enabled: true },
    { controller: 'contracts', action: 'delete', enabled: true },
    { controller: 'templates', action: 'read', enabled: true },
    { controller: 'templates', action: 'create', enabled: true },
    { controller: 'templates', action: 'update', enabled: true },
    { controller: 'templates', action: 'delete', enabled: true },
    { controller: 'consultations', action: 'read', enabled: true },
    { controller: 'consultations', action: 'create', enabled: true },
    { controller: 'consultations', action: 'update', enabled: true },
    { controller: 'consultations', action: 'delete', enabled: true }
  ],
  admin: [
    { controller: '*', action: '*', enabled: true }
  ]
};

/**
 * Create a new role
 */
export async function createRole(roleData: { name: string; description: string }): Promise<any> {
  try {
    // Generate a random UUID for the role
    const roleId = uuidv4();
    
    // Get default permissions for the role
    const rolePermissions = DEFAULT_PERMISSIONS[roleData.name as keyof typeof DEFAULT_PERMISSIONS] || [];
    
    // Create new role
    const [newRole] = await db
      .insert(roles)
      .values({
        id: roleId,
        name: roleData.name,
        description: roleData.description,
        permissions: rolePermissions,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    logger.info(`Created new role with id: ${roleId}`);
    return newRole;
  } catch (error) {
    logger.error('Error creating role', error);
    throw error;
  }
}

/**
 * Get all roles
 */
export async function getAllRoles(): Promise<any[]> {
  try {
    const allRoles = await db
      .select()
      .from(roles);
    
    logger.info(`Retrieved ${allRoles.length} roles`);
    return allRoles;
  } catch (error) {
    logger.error('Error getting all roles', error);
    throw error;
  }
}

/**
 * Get role by ID
 */
export async function getRoleById(roleId: string): Promise<any | null> {
  try {
    const [role] = await db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId));
    
    if (!role) {
      logger.warn(`Role not found with id: ${roleId}`);
      return null;
    }
    
    logger.info(`Retrieved role with id: ${roleId}`);
    return role;
  } catch (error) {
    logger.error(`Error getting role by id: ${roleId}`, error);
    throw error;
  }
}

/**
 * Update role
 */
export async function updateRole(roleId: string, updateData: { 
  name?: string; 
  description?: string; 
  permissions?: Permission[] 
}): Promise<any> {
  try {
    // Check if role exists
    const [existingRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId));
    
    if (!existingRole) {
      throw ApiError.notFound('Role not found');
    }
    
    // If name is being updated, get new default permissions
    let permissions = updateData.permissions;
    if (updateData.name && !permissions) {
      permissions = DEFAULT_PERMISSIONS[updateData.name as keyof typeof DEFAULT_PERMISSIONS] || existingRole.permissions;
    }
    
    // Update role
    const [updatedRole] = await db
      .update(roles)
      .set({
        ...updateData,
        permissions: permissions || existingRole.permissions,
        updatedAt: new Date()
      })
      .where(eq(roles.id, roleId))
      .returning();
    
    logger.info(`Updated role with id: ${roleId}`);
    return updatedRole;
  } catch (error) {
    logger.error(`Error updating role: ${roleId}`, error);
    throw error;
  }
}

/**
 * Delete role
 */
export async function deleteRole(roleId: string): Promise<void> {
  try {
    // Check if role exists
    const [existingRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId));
    
    if (!existingRole) {
      throw ApiError.notFound('Role not found');
    }
    
    // Delete role
    await db
      .delete(roles)
      .where(eq(roles.id, roleId));
    
    logger.info(`Deleted role with id: ${roleId}`);
  } catch (error) {
    logger.error(`Error deleting role: ${roleId}`, error);
    throw error;
  }
}

/**
 * Check if user has permission
 */
export async function hasPermission(roleName: string, controller: string, action: string): Promise<boolean> {
  try {
    const [role] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, roleName));
    
    if (!role) {
      return false;
    }
    
    // Admin has all permissions
    if (role.name === 'admin') {
      return true;
    }
    
    // Check if permission exists and is enabled
    const permission = role.permissions.find(p => 
      (p.controller === controller || p.controller === '*') && 
      (p.action === action || p.action === '*') && 
      p.enabled
    );
    
    return !!permission;
  } catch (error) {
    logger.error(`Error checking permission: ${roleName} ${controller} ${action}`, error);
    return false;
  }
} 