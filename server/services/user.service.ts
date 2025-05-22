/**
 * User Management Service
 */
import { db } from '../db';
import { users, type User, type InsertUser } from '../../shared/schema';
import { createLogger } from '../utils/logger';
import { ApiError } from '../middleware/error';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('user-service');

/**
 * Create a new user
 */
export async function createUser(userData: InsertUser): Promise<User> {
  try {
    // Generate a random UUID
    const uid = uuidv4();
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    // Create new user with default role if not provided
    const [newUser] = await db
      .insert(users)
      .values({
        ...userData,
        uid,
        password: hashedPassword,
        role: userData.role || 'user', // Set default role to 'user'
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    logger.info(`Created new user with uid: ${uid}`);
    return newUser;
  } catch (error) {
    logger.error('Error creating user', error);
    throw error;
  }
}

/**
 * Get all users
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    const allUsers = await db
      .select()
      .from(users);
    
    logger.info(`Retrieved ${allUsers.length} users`);
    return allUsers;
  } catch (error) {
    logger.error('Error getting all users', error);
    throw error;
  }
}

/**
 * Get user by UID
 */
export async function getUserByUid(uid: string): Promise<User | null> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.uid, uid));
    
    if (!user) {
      logger.warn(`User not found with uid: ${uid}`);
      return null;
    }
    
    logger.info(`Retrieved user with uid: ${uid}`);
    return user;
  } catch (error) {
    logger.error(`Error getting user by uid: ${uid}`, error);
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateUser(uid: string, updateData: Partial<User>): Promise<User> {
  try {
    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.uid, uid));
    
    if (!existingUser) {
      throw ApiError.notFound('User not found');
    }
    
    // If password is being updated, hash it
    let finalUpdateData = { ...updateData };
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      finalUpdateData.password = await bcrypt.hash(updateData.password, salt);
    }
    
    // Update user
    const [updatedUser] = await db
      .update(users)
      .set({
        ...finalUpdateData,
        updatedAt: new Date()
      })
      .where(eq(users.uid, uid))
      .returning();
    
    logger.info(`Updated user with uid: ${uid}`);
    return updatedUser;
  } catch (error) {
    logger.error(`Error updating user: ${uid}`, error);
    throw error;
  }
}

/**
 * Delete user
 */
export async function deleteUser(uid: string): Promise<void> {
  try {
    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.uid, uid));
    
    if (!existingUser) {
      throw ApiError.notFound('User not found');
    }
    
    // Delete user from database only
    await db
      .delete(users)
      .where(eq(users.uid, uid));
    
    logger.info(`Deleted user with uid: ${uid}`);
  } catch (error) {
    logger.error(`Error deleting user: ${uid}`, error);
    throw error;
  }
}

/**
 * Check if user exists by email
 */
export async function userExistsByEmail(email: string): Promise<boolean> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    
    return !!user;
  } catch (error) {
    logger.error(`Error checking if user exists by email: ${email}`, error);
    throw error;
  }
}

/**
 * Check if user exists by username
 */
export async function userExistsByUsername(username: string): Promise<boolean> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    
    return !!user;
  } catch (error) {
    logger.error(`Error checking if user exists by username: ${username}`, error);
    throw error;
  }
}

/**
 * Get users by role
 */
export async function getUsersByRole(role: string): Promise<User[]> {
  try {
    const usersByRole = await db
      .select()
      .from(users)
      .where(eq(users.role, role));
    
    logger.info(`Retrieved ${usersByRole.length} users with role: ${role}`);
    return usersByRole;
  } catch (error) {
    logger.error(`Error getting users by role: ${role}`, error);
    throw error;
  }
}

/**
 * Update user role
 */
export async function updateUserRole(uid: string, role: string): Promise<User> {
  try {
    const [updatedUser] = await db
      .update(users)
      .set({
        role,
        updatedAt: new Date()
      })
      .where(eq(users.uid, uid))
      .returning();
    
    if (!updatedUser) {
      throw ApiError.notFound('User not found');
    }
    
    logger.info(`Updated role for user ${uid} to ${role}`);
    return updatedUser;
  } catch (error) {
    logger.error(`Error updating user role: ${uid}`, error);
    throw error;
  }
}

/**
 * Get user statistics
 */
export async function getUserStats(): Promise<{
  totalUsers: number;
  verifiedUsers: number;
  adminUsers: number;
  recentUsers: number;
}> {
  try {
    const allUsers = await db
      .select()
      .from(users);
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const stats = {
      totalUsers: allUsers.length,
      verifiedUsers: allUsers.filter(user => user.isVerified).length,
      adminUsers: allUsers.filter(user => user.role === 'admin').length,
      recentUsers: allUsers.filter(user => new Date(user.createdAt) > thirtyDaysAgo).length
    };
    
    logger.info('Retrieved user statistics');
    return stats;
  } catch (error) {
    logger.error('Error getting user statistics', error);
    throw error;
  }
} 