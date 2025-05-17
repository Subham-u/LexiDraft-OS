/**
 * Contract service routes
 */
import express, { Router } from 'express';
import { contractControllers } from './controllers';
import { asyncHandler } from '../../../shared/middleware/error';
import { authenticate } from '../../../shared/middleware/auth';
import { createLogger } from '../../../shared/utils/logger';

// Create router for the contract service
const router: Router = express.Router();
const logger = createLogger('contract-service-routes');

// Get contract by ID
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const contractId = parseInt(req.params.id);
  const userId = req.user!.id;
  
  const result = await contractControllers.getContractById(contractId, userId);
  res.json(result);
}));

// Get all contracts for the authenticated user
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  
  const result = await contractControllers.getUserContracts(userId);
  res.json(result);
}));

// Get recent contracts for the authenticated user
router.get('/recent', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
  
  const result = await contractControllers.getRecentContracts(userId, limit);
  res.json(result);
}));

// Create a new contract
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  
  // Ensure the contract belongs to the authenticated user
  const contractData = {
    ...req.body,
    userId
  };
  
  const result = await contractControllers.createContract(contractData);
  res.status(201).json(result);
}));

// Update an existing contract
router.patch('/:id', authenticate, asyncHandler(async (req, res) => {
  const contractId = parseInt(req.params.id);
  const userId = req.user!.id;
  
  const result = await contractControllers.updateContract(contractId, userId, req.body);
  res.json(result);
}));

// Generate PDF for a contract
router.post('/:id/pdf', authenticate, asyncHandler(async (req, res) => {
  const contractId = parseInt(req.params.id);
  const userId = req.user!.id;
  
  const result = await contractControllers.generateContractPdf(contractId, userId);
  res.json(result);
}));

// Add a party to a contract
router.post('/:id/parties', authenticate, asyncHandler(async (req, res) => {
  const contractId = parseInt(req.params.id);
  const userId = req.user!.id;
  const party = req.body;
  
  const result = await contractControllers.addPartyToContract(contractId, userId, party);
  res.json(result);
}));

// Service status endpoint
router.get('/status', (req, res) => {
  const status = contractControllers.getStatus();
  res.json(status);
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'contract-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

export const routes = router;