/**
 * Contract routes
 */
import express, { Router } from 'express';
import { authenticate } from '../shared/middleware/auth';
import { asyncHandler, ApiError } from '../shared/middleware/error';
import { createLogger } from '../shared/utils/logger';
import { storage } from '../storage';
import { insertContractSchema } from '@shared/schema';
import { 
  getContractById, 
  getRecentContracts, 
  getAllContracts, 
  createContract, 
  updateContract,
  generateContractPdf
} from "../services/contractService";

const router: Router = express.Router();
const logger = createLogger('contract-routes');

/**
 * Get all contracts
 */
router.get("/", authenticate, asyncHandler(async (req, res) => {
  logger.info(`Getting all contracts for user: ${req.user?.id}`);
  const contracts = await getAllContracts();
  
  // Filter contracts by user ID
  const userContracts = req.user ? 
    contracts.filter(contract => contract.userId === req.user.id) : 
    contracts;
  
  return res.json({
    success: true,
    data: userContracts
  });
}));

/**
 * Get recent contracts
 */
router.get("/recent", authenticate, asyncHandler(async (req, res) => {
  logger.info(`Getting recent contracts for user: ${req.user?.id}`);
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
  const contracts = await getRecentContracts(limit);
  
  // Filter contracts by user ID
  const userContracts = req.user ? 
    contracts.filter(contract => contract.userId === req.user.id) : 
    contracts;
  
  return res.json({
    success: true,
    data: userContracts
  });
}));

/**
 * Get contract by ID
 */
router.get("/:id", authenticate, asyncHandler(async (req, res) => {
  const contractId = parseInt(req.params.id);
  logger.info(`Getting contract by ID: ${contractId} for user: ${req.user?.id}`);
  
  if (isNaN(contractId)) {
    throw ApiError.badRequest('Invalid contract ID');
  }
  
  const contract = await getContractById(contractId);
  
  if (!contract) {
    throw ApiError.notFound('Contract not found');
  }
  
  // Check if user has access to this contract
  if (req.user && contract.userId !== req.user.id) {
    throw ApiError.forbidden('You do not have permission to access this contract');
  }
  
  return res.json({
    success: true,
    data: contract
  });
}));

/**
 * Create a new contract
 */
router.post("/", authenticate, asyncHandler(async (req, res) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  logger.info(`Creating new contract for user: ${req.user.id}`);
  
  // Validate contract data
  const contractData = {
    ...req.body,
    userId: req.user.id
  };
  
  try {
    // Validate using zod schema
    insertContractSchema.parse(contractData);
  } catch (error) {
    throw ApiError.badRequest('Invalid contract data');
  }
  
  const newContract = await createContract(contractData);
  
  return res.status(201).json({
    success: true,
    data: newContract
  });
}));

/**
 * Update an existing contract
 */
router.patch("/:id", authenticate, asyncHandler(async (req, res) => {
  const contractId = parseInt(req.params.id);
  
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  if (isNaN(contractId)) {
    throw ApiError.badRequest('Invalid contract ID');
  }
  
  logger.info(`Updating contract ${contractId} for user: ${req.user.id}`);
  
  // Check if contract exists and belongs to user
  const existingContract = await getContractById(contractId);
  
  if (!existingContract) {
    throw ApiError.notFound('Contract not found');
  }
  
  if (existingContract.userId !== req.user.id) {
    throw ApiError.forbidden('You do not have permission to update this contract');
  }
  
  const updatedContract = await updateContract(contractId, req.body);
  
  if (!updatedContract) {
    throw ApiError.internal('Failed to update contract');
  }
  
  return res.json({
    success: true,
    data: updatedContract
  });
}));

/**
 * Generate PDF for a contract
 */
router.post("/:id/pdf", authenticate, asyncHandler(async (req, res) => {
  const contractId = parseInt(req.params.id);
  
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  if (isNaN(contractId)) {
    throw ApiError.badRequest('Invalid contract ID');
  }
  
  logger.info(`Generating PDF for contract ${contractId}`);
  
  // Check if contract exists and belongs to user
  const existingContract = await getContractById(contractId);
  
  if (!existingContract) {
    throw ApiError.notFound('Contract not found');
  }
  
  if (existingContract.userId !== req.user.id) {
    throw ApiError.forbidden('You do not have permission to access this contract');
  }
  
  const pdfUrl = await generateContractPdf(contractId);
  
  if (!pdfUrl) {
    throw ApiError.internal('Failed to generate PDF');
  }
  
  return res.json({
    success: true,
    data: {
      pdfUrl
    }
  });
}));

export default router;