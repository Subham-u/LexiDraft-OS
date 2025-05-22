/**
 * Authentication service for user management
 */
// import { getAuth } from 'firebase-admin/auth';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { users, insertUserSchema, type User, type InsertUser } from '../../shared/schema';
import { createLogger } from '../utils/logger';
import { ApiError } from '../middleware/error';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { sendEmail } from '../utils/email';

const logger = createLogger('auth-service');

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const RESET_TOKEN_EXPIRY = '1h';
const VERIFICATION_TOKEN_EXPIRY = '24h';

/**
 * Register a new user
 */
export async function registerUser(userData: InsertUser): Promise<User> {
  try {
    // Generate a random UUID
    const uid = uuidv4();
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    // Validate user data using zod schema
    const validatedData = insertUserSchema.parse(userData);
    
    // Check if user already exists by email or username
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email) || eq(users.username, validatedData.username));
    
    if (existingUser) {
      throw ApiError.badRequest('User with this email or username already exists');
    }
    
    // Create new user with generated uid and hashed password
    logger.info(`Creating new user with uid: ${uid}`);
    
    const [newUser] = await db
      .insert(users)
      .values({
        ...validatedData,
        uid,
        password: hashedPassword,
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
 * Login user with username and password
 */
export async function loginUser(username: string, password: string): Promise<User> {
  try {
    // Find user by username
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    
    if (!user) {
      throw ApiError.unauthorized('Invalid username or password');
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw ApiError.unauthorized('Invalid username or password');
    }
    
    return user;
  } catch (error) {
    logger.error('Error logging in user', error);
    throw error;
  }
}

/**
 * Refresh auth tokens
 */
export async function refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  try {
    const jwtService = await import('../services/jwt.service');
    const decoded = await jwtService.verifyToken(refreshToken);
    
    // Generate new tokens
    const tokens = await jwtService.generateTokens(
      decoded.uid,
      decoded.role
    );
    
    return tokens;
  } catch (error) {
    logger.error('Error refreshing tokens', error);
    throw ApiError.unauthorized('Invalid refresh token');
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string): Promise<void> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    
    if (!user) {
      // Don't reveal that the email doesn't exist
      return;
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
    
    // Store reset token in database
    await db
      .update(users)
      .set({
        resetToken,
        resetTokenExpiry,
        updatedAt: new Date()
      })
      .where(eq(users.uid, user.uid));
    
    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      text: `Please click the following link to reset your password: ${resetUrl}`,
      html: `<p>Please click the following link to reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`
    });
  } catch (error) {
    logger.error('Error sending password reset email', error);
    throw error;
  }
}

/**
 * Reset password
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.resetToken, token));
    
    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw ApiError.badRequest('Invalid or expired reset token');
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password and clear reset token
    await db
      .update(users)
      .set({
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date()
      })
      .where(eq(users.uid, user.uid));
  } catch (error) {
    logger.error('Error resetting password', error);
    throw error;
  }
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(email: string): Promise<void> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 86400000); // 24 hours
    
    // Store verification token in database
    await db
      .update(users)
      .set({
        verificationToken,
        verificationTokenExpiry,
        updatedAt: new Date()
      })
      .where(eq(users.uid, user.uid));
    
    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email',
      text: `Please click the following link to verify your email: ${verificationUrl}`,
      html: `<p>Please click the following link to verify your email: <a href="${verificationUrl}">${verificationUrl}</a></p>`
    });
  } catch (error) {
    logger.error('Error sending verification email', error);
    throw error;
  }
}

/**
 * Verify email
 */
export async function verifyEmail(token: string): Promise<void> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.verificationToken, token));
    
    if (!user || !user.verificationTokenExpiry || user.verificationTokenExpiry < new Date()) {
      throw ApiError.badRequest('Invalid or expired verification token');
    }
    
    // Update user as verified and clear verification token
    await db
      .update(users)
      .set({
        isVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
        updatedAt: new Date()
      })
      .where(eq(users.uid, user.uid));
  } catch (error) {
    logger.error('Error verifying email', error);
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(uid: string, updateData: { fullName?: string; avatar?: string }): Promise<User> {
  try {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(users.uid, uid))
      .returning();
    
    if (!updatedUser) {
      throw ApiError.notFound('User not found');
    }
    
    return updatedUser;
  } catch (error) {
    logger.error('Error updating user profile', error);
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
export async function updateUserRole(uid: string, role: string): Promise<User> {
  try {
    const [user] = await db
      .update(users)
      .set({ 
        role,
        updatedAt: new Date()
      })
      .where(eq(users.uid, uid))
      .returning();
    
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    
    return user;
  } catch (error) {
    logger.error(`Error updating user role: ${uid}`, error);
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
 * Get current user based on JWT token
 */
export async function getCurrentUser(token: string): Promise<User | null> {
  try {
    const jwtService = await import('../services/jwt.service');
    const decoded = await jwtService.verifyToken(token);
    
    // Get user from database
    return await getUserByUid(decoded.uid);
  } catch (error) {
    logger.error('Error getting current user', error);
    throw ApiError.unauthorized('Invalid or expired token');
  }
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    const allUsers = await db
      .select()
      .from(users);
    
    return allUsers;
  } catch (error) {
    logger.error('Error getting all users', error);
    throw error;
  }
}