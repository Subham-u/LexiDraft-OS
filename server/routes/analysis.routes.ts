/**
 * Contract Analysis API Routes
 */

import { Router, Request, Response } from 'express';
import { aiAnalysisService, AnalysisRequest } from '../services/ai-analysis.service';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { createLogger } from '../utils/logger';
const logger = createLogger('analysis');
import { z } from 'zod';

const router = Router();

// Validation schema for analysis request
const analysisRequestSchema = z.object({
  contractId: z.number(),
  userId: z.string(),
  analysisType: z.enum(['full', 'clauses', 'missing', 'compliance']),
  options: z.object({
    jurisdiction: z.string().optional(),
    contractType: z.string().optional(),
    focusAreas: z.array(z.string()).optional(),
  }).optional(),
});

/**
 * @route POST /api/contracts/analysis
 * @desc Request a contract analysis
 */
router.post('/contracts/analysis', authenticate, asyncHandler(async (req: Request, res: Response) => {
  logger.info('Received contract analysis request');
  
  try {
    // Validate request
    const validatedData = analysisRequestSchema.parse(req.body);
    
    // Ensure the user ID matches the authenticated user
    if (req.user && req.user.uid !== validatedData.userId) {
      logger.warn(`User ${req.user.uid} attempted to analyze contract for user ${validatedData.userId}`);
      validatedData.userId = req.user.uid;
    }
    
    // Request analysis
    const analysisId = await aiAnalysisService.analyzeContract(validatedData as AnalysisRequest);
    
    logger.info(`Created analysis request with ID: ${analysisId}`);
    
    return res.status(202).json({
      id: analysisId,
      contractId: validatedData.contractId,
      status: 'pending',
      message: 'Contract analysis initiated. Check the analysis endpoint for results.',
    });
  } catch (error) {
    logger.error(`Error in contract analysis request: ${error.message}`, error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors,
      });
    }
    
    throw error;
  }
}));

/**
 * @route GET /api/contracts/analysis/:id
 * @desc Get analysis results by ID
 */
router.get('/contracts/analysis/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  logger.info(`Fetching analysis with ID: ${req.params.id}`);
  
  try {
    const analysisId = parseInt(req.params.id);
    
    if (isNaN(analysisId)) {
      return res.status(400).json({
        error: 'Invalid analysis ID',
      });
    }
    
    const analysis = await aiAnalysisService.getAnalysisById(analysisId);
    
    if (!analysis) {
      return res.status(404).json({
        error: 'Analysis not found',
      });
    }
    
    // Check if the user has permission to access this analysis
    if (req.user && req.user.uid !== analysis.userId) {
      logger.warn(`User ${req.user.uid} attempted to access analysis owned by user ${analysis.userId}`);
      return res.status(403).json({
        error: 'You do not have permission to access this analysis',
      });
    }
    
    return res.status(200).json(analysis);
  } catch (error:any) {
    logger.error(`Error fetching analysis: ${error.message}`, error);
    throw error;
  }
}));

export default router;