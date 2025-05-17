/**
 * Contract analysis routes for AI-powered contract analysis
 */
import express, { Router, Request, Response } from 'express';
import { asyncHandler, ApiError } from '../middleware/error';
import { authenticate } from '../middleware/auth';
import { createLogger } from '../utils/logger';
import * as analysisService from '../services/analysis.service';
import * as aiAnalysisService from '../services/ai-analysis.service';

const router: Router = express.Router();
const logger = createLogger('analysis-routes');

/**
 * Generate AI analysis for a contract
 * @route POST /api/analysis/contracts/:contractId/ai
 */
router.post("/contracts/:contractId/ai", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const contractId = parseInt(req.params.contractId);
  
  if (isNaN(contractId)) {
    throw ApiError.badRequest('Invalid contract ID');
  }
  
  logger.info(`Generating AI analysis for contract: ${contractId} by user: ${req.user.id}`);
  
  const analysis = await aiAnalysisService.analyzeContract(contractId, req.user.id);
  
  return res.status(201).json({
    success: true,
    data: analysis
  });
}));

/**
 * Generate manual analysis for a contract (legacy)
 * @route POST /api/analysis/contracts/:contractId
 */
router.post("/contracts/:contractId", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const contractId = parseInt(req.params.contractId);
  
  if (isNaN(contractId)) {
    throw ApiError.badRequest('Invalid contract ID');
  }
  
  logger.info(`Generating analysis for contract: ${contractId} by user: ${req.user.id}`);
  
  const analysis = await analysisService.generateContractAnalysis(contractId, req.user.id);
  
  return res.status(201).json({
    success: true,
    data: analysis
  });
}));

/**
 * Get AI suggestions for improving a specific clause
 * @route POST /api/analysis/contracts/:contractId/clauses/:clauseId/suggestions
 */
router.post("/contracts/:contractId/clauses/:clauseId/suggestions", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const contractId = parseInt(req.params.contractId);
  const clauseId = req.params.clauseId;
  
  if (isNaN(contractId)) {
    throw ApiError.badRequest('Invalid contract ID');
  }
  
  if (!clauseId) {
    throw ApiError.badRequest('Clause ID is required');
  }
  
  logger.info(`Generating clause improvement suggestions for contract: ${contractId}, clause: ${clauseId}`);
  
  const suggestions = await aiAnalysisService.suggestClauseImprovements(contractId, req.user.id, clauseId);
  
  return res.json({
    success: true,
    data: suggestions
  });
}));

/**
 * Identify missing clauses for a contract
 * @route GET /api/analysis/contracts/:contractId/missing-clauses
 */
router.get("/contracts/:contractId/missing-clauses", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const contractId = parseInt(req.params.contractId);
  
  if (isNaN(contractId)) {
    throw ApiError.badRequest('Invalid contract ID');
  }
  
  logger.info(`Identifying missing clauses for contract: ${contractId}`);
  
  const missingClauses = await aiAnalysisService.identifyMissingClauses(contractId, req.user.id);
  
  return res.json({
    success: true,
    data: missingClauses
  });
}));

/**
 * Assess compliance with Indian law
 * @route POST /api/analysis/contracts/:contractId/compliance
 */
router.post("/contracts/:contractId/compliance", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const contractId = parseInt(req.params.contractId);
  const { specificLaws } = req.body;
  
  if (isNaN(contractId)) {
    throw ApiError.badRequest('Invalid contract ID');
  }
  
  logger.info(`Assessing legal compliance for contract: ${contractId}`);
  
  const compliance = await aiAnalysisService.assessComplianceWithIndianLaw(contractId, req.user.id, specificLaws);
  
  return res.json({
    success: true,
    data: compliance
  });
}));

/**
 * Get analysis for a contract
 * @route GET /api/analysis/contracts/:contractId
 */
router.get("/contracts/:contractId", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const contractId = parseInt(req.params.contractId);
  
  if (isNaN(contractId)) {
    throw ApiError.badRequest('Invalid contract ID');
  }
  
  logger.info(`Getting analysis for contract: ${contractId}`);
  
  const analysis = await analysisService.getContractAnalysisByContractId(contractId);
  
  if (!analysis) {
    throw ApiError.notFound('Analysis not found for this contract');
  }
  
  // Check if user has access to this analysis
  if (analysis.userId !== req.user.id && req.user.role !== 'admin') {
    throw ApiError.forbidden('You do not have permission to view this analysis');
  }
  
  return res.json({
    success: true,
    data: analysis
  });
}));

/**
 * Get analysis by ID
 * @route GET /api/analysis/:id
 */
router.get("/:id", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const analysisId = parseInt(req.params.id);
  
  if (isNaN(analysisId)) {
    throw ApiError.badRequest('Invalid analysis ID');
  }
  
  logger.info(`Getting analysis: ${analysisId}`);
  
  const analysis = await analysisService.getContractAnalysisById(analysisId);
  
  if (!analysis) {
    throw ApiError.notFound('Analysis not found');
  }
  
  // Check if user has access to this analysis
  if (analysis.userId !== req.user.id && req.user.role !== 'admin') {
    throw ApiError.forbidden('You do not have permission to view this analysis');
  }
  
  return res.json({
    success: true,
    data: analysis
  });
}));

/**
 * Get all analyses for authenticated user
 * @route GET /api/analysis
 */
router.get("/", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  logger.info(`Getting all analyses for user: ${req.user.id}`);
  
  const analyses = await analysisService.getUserContractAnalyses(req.user.id);
  
  return res.json({
    success: true,
    data: analyses
  });
}));

/**
 * Delete analysis
 * @route DELETE /api/analysis/:id
 */
router.delete("/:id", authenticate(), asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const analysisId = parseInt(req.params.id);
  
  if (isNaN(analysisId)) {
    throw ApiError.badRequest('Invalid analysis ID');
  }
  
  logger.info(`Deleting analysis: ${analysisId}`);
  
  // Get analysis to check permissions
  const analysis = await analysisService.getContractAnalysisById(analysisId);
  
  if (!analysis) {
    throw ApiError.notFound('Analysis not found');
  }
  
  // Check if user has access to this analysis
  if (analysis.userId !== req.user.id && req.user.role !== 'admin') {
    throw ApiError.forbidden('You do not have permission to delete this analysis');
  }
  
  await analysisService.deleteContractAnalysis(analysisId);
  
  return res.json({
    success: true,
    message: 'Analysis deleted successfully'
  });
}));

export default router;