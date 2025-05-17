/**
 * Contract routes
 */
import express, { Router, Request, Response } from 'express';
import { asyncHandler, ApiError } from '../middleware/error';
import { authenticate } from '../middleware/auth';
import { createLogger } from '../utils/logger';
import * as contractService from '../services/contract.service';
import { insertContractSchema } from '../../shared/schema';

const router: Router = express.Router();
const logger = createLogger('contract-routes');

/**
 * Get all contracts
 * @route GET /api/contracts
 */
router.get("/", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  logger.info(`Getting all contracts for user: ${req.user?.id}`);
  
  // If user is authenticated, get their contracts
  if (req.user) {
    const contracts = await contractService.getContractsByUserId(req.user.id);
    
    // Adapt the contract data to match frontend expectations
    const adaptedContracts = contracts.map(contract => {
      // Ensure all expected fields are present
      return {
        ...contract,
        // Ensure these fields exist for the frontend, using defaults if not present
        status: contract.status || 'draft',
        type: contract.type || 'contract',
        parties: contract.parties || [],
        clauses: contract.clauses || [],
        // Ensure dates are in ISO format for frontend
        createdAt: contract.createdAt,
        updatedAt: contract.updatedAt || contract.createdAt
      };
    });
    
    return res.json({
      success: true,
      data: adaptedContracts
    });
  }
  
  // Otherwise, return error - contracts require authentication
  throw ApiError.unauthorized('Authentication required to access contracts');
}));

/**
 * Get recent contracts
 * @route GET /api/contracts/recent
 */
router.get("/recent", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  logger.info(`Getting recent contracts for user: ${req.user?.id}`);
  
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
  
  // Get recent contracts for user
  if (req.user) {
    const allContracts = await contractService.getContractsByUserId(req.user.id);
    
    // Sort by createdAt descending and limit
    const recentContracts = allContracts
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
    
    return res.json({
      success: true,
      data: recentContracts
    });
  }
  
  throw ApiError.unauthorized('Authentication required to access contracts');
}));

/**
 * Get contract by ID
 * @route GET /api/contracts/:id
 */
router.get("/:id", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  const contractId = parseInt(req.params.id);
  
  if (isNaN(contractId)) {
    throw ApiError.badRequest('Invalid contract ID');
  }
  
  logger.info(`Getting contract by ID: ${contractId}`);
  
  const contract = await contractService.getContractById(contractId);
  
  if (!contract) {
    throw ApiError.notFound('Contract not found');
  }
  
  // Check if user has access to this contract
  if (req.user && contract.userId !== req.user.id) {
    throw ApiError.forbidden('You do not have permission to access this contract');
  }
  
  // Adapt the contract data to match frontend expectations
  const adaptedContract = {
    ...contract,
    // Ensure these fields exist for the frontend, using defaults if not present
    status: contract.status || 'draft',
    type: contract.type || 'contract',
    parties: contract.parties || [],
    clauses: contract.clauses || [],
    // Generate a LexiCert ID if not present (frontend expects this)
    lexiCertId: contract.lexiCertId || `LEXI-${810000 + contractId}`,
    // Ensure dates are in ISO format for frontend
    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt || contract.createdAt
  };
  
  return res.json({
    success: true,
    data: adaptedContract
  });
}));

/**
 * Create a new contract
 * @route POST /api/contracts
 */
router.post("/", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  logger.info(`Creating new contract for user: ${req.user.id}`);
  
  // Add user ID to contract data
  const contractData = {
    ...req.body,
    userId: req.user.id
  };
  
  // Validate contract data
  const validatedData = insertContractSchema.parse(contractData);
  
  // Create contract
  const newContract = await contractService.createContract(validatedData);
  
  return res.status(201).json({
    success: true,
    data: newContract
  });
}));

/**
 * Update an existing contract
 * @route PATCH /api/contracts/:id
 */
router.patch("/:id", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const contractId = parseInt(req.params.id);
  
  if (isNaN(contractId)) {
    throw ApiError.badRequest('Invalid contract ID');
  }
  
  logger.info(`Updating contract ${contractId} for user: ${req.user.id}`);
  
  // Check if contract exists and belongs to user
  const existingContract = await contractService.getContractById(contractId);
  
  if (!existingContract) {
    throw ApiError.notFound('Contract not found');
  }
  
  if (existingContract.userId !== req.user.id) {
    throw ApiError.forbidden('You do not have permission to update this contract');
  }
  
  // Update contract
  const updatedContract = await contractService.updateContract(contractId, req.body);
  
  return res.json({
    success: true,
    data: updatedContract
  });
}));

/**
 * Delete a contract
 * @route DELETE /api/contracts/:id
 */
router.delete("/:id", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const contractId = parseInt(req.params.id);
  
  if (isNaN(contractId)) {
    throw ApiError.badRequest('Invalid contract ID');
  }
  
  logger.info(`Deleting contract ${contractId} for user: ${req.user.id}`);
  
  // Check if contract exists and belongs to user
  const existingContract = await contractService.getContractById(contractId);
  
  if (!existingContract) {
    throw ApiError.notFound('Contract not found');
  }
  
  if (existingContract.userId !== req.user.id) {
    throw ApiError.forbidden('You do not have permission to delete this contract');
  }
  
  // Delete contract
  await contractService.deleteContract(contractId);
  
  return res.json({
    success: true,
    message: 'Contract deleted successfully'
  });
}));

/**
 * Update contract status
 * @route PATCH /api/contracts/:id/status
 */
router.patch("/:id/status", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const contractId = parseInt(req.params.id);
  const { status } = req.body;
  
  if (isNaN(contractId)) {
    throw ApiError.badRequest('Invalid contract ID');
  }
  
  if (!status) {
    throw ApiError.badRequest('Status is required');
  }
  
  logger.info(`Updating contract ${contractId} status to ${status}`);
  
  // Check if contract exists and belongs to user
  const existingContract = await contractService.getContractById(contractId);
  
  if (!existingContract) {
    throw ApiError.notFound('Contract not found');
  }
  
  if (existingContract.userId !== req.user.id) {
    throw ApiError.forbidden('You do not have permission to update this contract');
  }
  
  // Update contract status
  const updatedContract = await contractService.updateContractStatus(contractId, status);
  
  return res.json({
    success: true,
    data: updatedContract
  });
}));

export default router;