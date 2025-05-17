/**
 * Authentication service for user management
 */
import { getAuth } from 'firebase-admin/auth';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { users, insertUserSchema, type User, type InsertUser } from '../../shared/schema';
import { createLogger } from '../utils/logger';
import { ApiError } from '../middleware/error';

const logger = createLogger('auth-service');

/**
 * Register a new user or update existing user based on Firebase auth data
 */
export async function registerUser(userData: InsertUser): Promise<User> {
  try {
    // Validate user data using zod schema
    const validatedData = insertUserSchema.parse(userData);
    
    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.uid, validatedData.uid));
    
    if (existingUser) {
      // Update existing user
      logger.info(`Updating existing user: ${existingUser.id}`);
      
      const [updatedUser] = await db
        .update(users)
        .set({
          ...validatedData,
          updatedAt: new Date()
        })
        .where(eq(users.id, existingUser.id))
        .returning();
      
      return updatedUser;
    }
    
    // Create new user
    logger.info(`Creating new user with uid: ${validatedData.uid}`);
    
    const [newUser] = await db
      .insert(users)
      .values({
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return newUser;
  } catch (error) {
    logger.error('Error registering user', error);
    throw error;
  }
}

/**
 * Get user by ID
 */
export async function getUserById(id: number): Promise<User | null> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    
    return user || null;
  } catch (error) {
    logger.error(`Error getting user by ID: ${id}`, error);
    throw error;
  }
}

/**
 * Get user by Firebase UID
 */
export async function getUserByUid(uid: string): Promise<User | null> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.uid, uid));
    
    return user || null;
  } catch (error) {
    logger.error(`Error getting user by UID: ${uid}`, error);
    throw error;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    
    return user || null;
  } catch (error) {
    logger.error(`Error getting user by email: ${email}`, error);
    throw error;
  }
}

/**
 * Update user role
 */
export async function updateUserRole(id: number, role: string): Promise<User> {
  try {
    const [user] = await db
      .update(users)
      .set({ 
        role,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    
    return user;
  } catch (error) {
    logger.error(`Error updating user role: ${id}`, error);
    throw error;
  }
}

/**
 * Delete user
 */
export async function deleteUser(id: number): Promise<void> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    
    // Delete user from Firebase Auth
    await getAuth().deleteUser(user.uid);
    
    // Delete user from database
    await db
      .delete(users)
      .where(eq(users.id, id));
    
    logger.info(`User deleted: ${id}`);
  } catch (error) {
    logger.error(`Error deleting user: ${id}`, error);
    throw error;
  }
}

/**
 * Get current user based on Firebase ID token
 */
export async function getCurrentUser(token: string): Promise<User | null> {
  try {
    // Verify the ID token
    const decodedToken = await getAuth().verifyIdToken(token);
    
    // Get user from database
    return await getUserByUid(decodedToken.uid);
  } catch (error) {
    logger.error('Error getting current user', error);
    throw ApiError.unauthorized('Invalid or expired token');
  }
}