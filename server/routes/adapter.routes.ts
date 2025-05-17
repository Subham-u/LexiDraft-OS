/**
 * Frontend adapter routes
 * 
 * This file contains routes that adapt our backend services to match the
 * frontend's expected API structure without modifying the frontend code.
 */
import express, { Router, Request, Response } from 'express';
import { asyncHandler, ApiError } from '../middleware/error';
import { authenticate } from '../middleware/auth';
import { db } from '../db';
import { createLogger } from '../utils/logger';
import * as contractService from '../services/contract.service';
import { 
  mockContractAnalysis, 
  mockNotifications, 
  mockUnreadCount,
  mockChatRooms,
  mockChatMessages
} from './mock-responses';

const router: Router = express.Router();
const logger = createLogger('adapter-routes');

/**
 * Get recent contracts 
 * @route GET /api/contracts/recent
 */
router.get("/contracts/recent", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  logger.info(`[Adapter] Getting recent contracts for user: ${req.user?.id}`);
  
  // Get limit from query params or default to 5
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
  
  if (req.user) {
    // Get all contracts for user
    const contracts = await contractService.getContractsByUserId(req.user.id);
    
    // Sort by createdAt/updatedAt and limit
    const recentContracts = contracts
      .sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(a.createdAt);
        const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, limit)
      .map(contract => ({
        ...contract,
        // Ensure these fields exist for the frontend
        status: contract.status || 'draft',
        type: contract.type || 'contract',
        parties: contract.parties || [],
        clauses: contract.clauses || [],
        // Generate a LexiCert ID if not present (frontend expects this)
        lexiCertId: `LEXI-${810000 + contract.id}`,
      }));
    
    // Format matches frontend expectations
    return res.json({
      success: true,
      data: recentContracts
    });
  }
  
  throw ApiError.unauthorized('Authentication required to access contracts');
}));

/**
 * Get contract analysis by contract ID
 * @route GET /api/contracts/analysis/:id
 */
router.get("/contracts/analysis/:id", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  const contractId = parseInt(req.params.id);
  
  if (isNaN(contractId)) {
    throw ApiError.badRequest('Invalid contract ID');
  }
  
  logger.info(`[Adapter] Getting AI analysis for contract: ${contractId}`);
  
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  // Return mock data for now
  return res.json(mockContractAnalysis);
}));

/**
 * Get user notifications
 * @route GET /api/notifications
 */
router.get("/notifications", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  logger.info(`[Adapter] Getting notifications for user: ${req.user.id}`);
  
  // Return mock data for now
  return res.json(mockNotifications);
}));

/**
 * Get unread notification count
 * @route GET /api/notifications/unread
 */
router.get("/notifications/unread", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  logger.info(`[Adapter] Getting unread notification count for user: ${req.user.id}`);
  
  // Return mock data for now
  return res.json(mockUnreadCount);
}));

/**
 * Get user chat rooms
 * @route GET /api/chat/rooms
 */
router.get("/chat/rooms", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  logger.info(`[Adapter] Getting chat rooms for user: ${req.user.id}`);
  
  // Return mock data for now
  return res.json(mockChatRooms);
}));

/**
 * Get chat messages for a room
 * @route GET /api/chat/rooms/:id/messages
 */
router.get("/chat/rooms/:id/messages", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const roomId = parseInt(req.params.id);
  
  if (isNaN(roomId)) {
    throw ApiError.badRequest('Invalid room ID');
  }
  
  logger.info(`[Adapter] Getting messages for chat room: ${roomId}`);
  
  // Return mock data for now
  return res.json(mockChatMessages);
}));

export default router;