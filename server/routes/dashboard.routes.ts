/**
 * Dashboard routes
 */
import express, { Router, Request, Response } from 'express';
import { authenticate } from '../shared/middleware/auth';
import { asyncHandler } from '../shared/middleware/error';
import { createLogger } from '../shared/utils/logger';
import { storage } from '../storage';

const router: Router = express.Router();
const logger = createLogger('dashboard-routes');

/**
 * Get dashboard statistics
 */
router.get("/stats", authenticate, asyncHandler(async (req: Request, res: Response) => {
  logger.info(`Dashboard stats requested by user ${req.user?.id}`);
  
  // Get contracts for the authenticated user
  const contracts = await storage.getAllContracts();
  const userContracts = req.user ? contracts.filter(c => c.userId === req.user.id) : [];
  
  // Generate statistics
  const stats = {
    totalContracts: userContracts.length,
    drafts: userContracts.filter(c => c.status === "draft").length,
    signed: userContracts.filter(c => c.status === "signed").length,
    pending: userContracts.filter(c => c.status === "pending").length
  };
  
  return res.json({
    success: true,
    data: stats
  });
}));

/**
 * Calculate risk score based on strengths and weaknesses
 */
function calculateRiskScore(analysis: { strengths: string[]; weaknesses: string[] }): number {
  // Calculate risk score based on strengths and weaknesses
  const strengthsWeight = 0.4;
  const weaknessesWeight = 0.6;
  
  const strengthsScore = 100 - (analysis.strengths.length === 0 ? 100 : Math.min(100, (analysis.weaknesses.length / (analysis.strengths.length + analysis.weaknesses.length)) * 100));
  const weaknessesScore = analysis.weaknesses.length === 0 ? 0 : Math.min(100, analysis.weaknesses.length * 15);
  
  // Lower score is better (less risk)
  const riskScore = Math.round((strengthsScore * strengthsWeight) + (weaknessesScore * weaknessesWeight));
  return Math.min(100, Math.max(0, riskScore));
}

/**
 * Calculate completeness based on recommendations
 */
function calculateCompleteness(analysis: { recommendations: string[] }): number {
  // Calculate completeness based on recommendations
  const baseCompleteness = 85; // Start with a base completeness score
  const deductionPerRecommendation = 5; // Deduct for each recommendation
  const completeness = Math.max(0, baseCompleteness - (analysis.recommendations.length * deductionPerRecommendation));
  return Math.round(completeness);
}

/**
 * Generate availability data for lawyers
 */
function generateAvailability() {
  const week = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
  ];
  
  const availability = {};
  
  week.forEach(day => {
    // 9am to 5pm in hour slots (9 slots)
    const slots = [];
    for (let i = 9; i <= 17; i++) {
      slots.push({
        time: `${i}:00`,
        available: Math.random() > 0.3 // 70% chance of being available
      });
    }
    availability[day] = slots;
  });
  
  return availability;
}

/**
 * Get dashboard analysis
 */
router.get("/analysis", authenticate, asyncHandler(async (req: Request, res: Response) => {
  logger.info(`Dashboard analysis requested by user ${req.user?.id}`);
  
  // Get all contracts
  const contracts = await storage.getAllContracts();
  const userContracts = req.user ? contracts.filter(c => c.userId === req.user.id) : [];
  
  // Basic analysis stats
  const totalContracts = userContracts.length;
  const draftContracts = userContracts.filter(c => c.status === 'draft').length;
  const pendingContracts = userContracts.filter(c => c.status === 'pending').length;
  const signedContracts = userContracts.filter(c => c.status === 'signed').length;
  
  // Calculate risk scores (1-100) using a sample of up to 5 contracts
  let averageRiskScore = 50; // Default moderate risk
  let averageCompleteness = 70; // Default moderately complete
  
  // If we have contracts, calculate actual metrics
  if (userContracts.length > 0) {
    const sampleContracts = userContracts.slice(0, Math.min(5, userContracts.length));
    
    // Calculate risk and completeness from our sample
    let riskScoreSum = 0;
    let completenessSum = 0;
    
    for (const contract of sampleContracts) {
      // Simple heuristic: longer contracts tend to be more complete and lower risk
      const length = contract.content ? contract.content.length : 0;
      // More clauses tend to mean lower risk
      const clauseCount = contract.clauses ? contract.clauses.length : 0;
      
      const riskScore = Math.max(20, Math.min(90, 100 - (length / 1000 * 10) - (clauseCount * 5)));
      const completeness = Math.min(95, (length / 2000 * 50) + (clauseCount * 10));
      
      riskScoreSum += riskScore;
      completenessSum += completeness;
    }
    
    averageRiskScore = Math.round(riskScoreSum / sampleContracts.length);
    averageCompleteness = Math.round(completenessSum / sampleContracts.length);
  }
  
  return res.json({
    success: true,
    data: {
      totalContracts,
      draftContracts,
      pendingContracts,
      signedContracts,
      averageRiskScore,
      averageCompleteness
    }
  });
}));

export default router;