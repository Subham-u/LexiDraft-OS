import express, { Router } from 'express';
import { storage } from '../../storage';
import { authenticate } from '../../shared/middleware/auth';
import { FIREBASE_CONFIG } from '../../shared/config';

// Create router for auth microservice
const authRouter: Router = express.Router();

// User login endpoint
authRouter.post('/login', async (req, res) => {
  try {
    // In a production environment, Firebase authentication would be used
    // This is a placeholder for the actual authentication logic
    const { uid } = req.body;
    
    if (!uid) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Find the user in our database
    let user = await storage.getUserByUid(uid);
    
    // If user doesn't exist, create a new user record
    if (!user) {
      // We'd normally get more user info from Firebase
      const defaultUser = {
        uid,
        username: `user_${Date.now()}`,
        email: req.body.email || null,
        role: 'user',
        profileCompleted: false
      };
      
      user = await storage.createUser(defaultUser);
    }
    
    // Return user information (without sensitive fields)
    res.json({
      success: true,
      user: {
        id: user.id,
        uid: user.uid,
        username: user.username,
        email: user.email,
        role: user.role,
        profileCompleted: user.profileCompleted
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
});

// Get current user profile
authRouter.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await storage.getUser(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Return user information (excluding sensitive fields)
    res.json({
      success: true,
      user: {
        id: user.id,
        uid: user.uid,
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.name,
        phone: user.phone,
        company: user.company,
        profileCompleted: user.profileCompleted,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile'
    });
  }
});

// Update user profile
authRouter.patch('/profile', authenticate, async (req, res) => {
  try {
    const result = await storage.updateUser(req.user.id, req.body);
    
    res.json({
      success: true,
      user: {
        id: result.id,
        uid: result.uid,
        username: result.username,
        email: result.email,
        role: result.role,
        name: result.name,
        phone: result.phone,
        company: result.company,
        profileCompleted: result.profileCompleted,
        createdAt: result.createdAt
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user profile'
    });
  }
});

// Check authentication service status
authRouter.get('/status', (req, res) => {
  res.json({
    success: true,
    service: 'auth',
    available: FIREBASE_CONFIG.available,
    message: FIREBASE_CONFIG.available 
      ? 'Authentication service is operational' 
      : 'Authentication service is running in development mode'
  });
});

export default authRouter;