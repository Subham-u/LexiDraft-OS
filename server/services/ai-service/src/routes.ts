/**
 * AI service routes
 */
import express, { Request, Response, Router } from 'express';
import { aiControllers } from './controllers';
import { asyncHandler } from '../../../shared/middleware/error';
import { authenticate } from '../../../shared/middleware/auth';
import { createLogger } from '../../../shared/utils/logger';

// Create router for the AI service
const router: Router = express.Router();
const logger = createLogger('ai-service-routes');

// Analyze a contract
router.post('/analyze/:contractId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const contractId = parseInt(req.params.contractId);
  const userId = req.user!.id;
  
  const result = await aiControllers.analyzeContract(contractId, userId);
  res.json(result);
}));

// Generate a contract
router.post('/generate', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { contractType, parameters } = req.body;
  
  if (!contractType) {
    return res.status(400).json({
      success: false,
      error: 'missing_contract_type',
      message: 'Contract type is required'
    });
  }
  
  const result = await aiControllers.generateContract(userId, contractType, parameters || {});
  res.status(201).json(result);
}));

// Explain a clause
router.post('/explain-clause', asyncHandler(async (req: Request, res: Response) => {
  const { clause } = req.body;
  
  if (!clause) {
    return res.status(400).json({
      success: false,
      error: 'missing_clause',
      message: 'Clause text is required'
    });
  }
  
  const result = await aiControllers.explainClause(clause);
  res.json(result);
}));

// Chat with AI
router.post('/chat', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { message, conversationId } = req.body;
  
  if (!message) {
    return res.status(400).json({
      success: false,
      error: 'missing_message',
      message: 'Message is required'
    });
  }
  
  const result = await aiControllers.chat(userId, message, conversationId);
  res.json(result);
}));

// Service status endpoint
router.get('/status', (req: Request, res: Response) => {
  const status = aiControllers.getStatus();
  res.json(status);
});

export const routes = router;