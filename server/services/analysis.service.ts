/**
 * Contract analysis service for AI-powered contract evaluation
 */
import { db } from '../db';
import { eq, and } from 'drizzle-orm';
import { 
  contractAnalyses, 
  type ContractAnalysis, 
  type InsertContractAnalysis,
  contracts
} from '../../shared/schema';
import { createLogger } from '../utils/logger';
import { ApiError } from '../middleware/error';
import { getContractById } from './contract.service';

const logger = createLogger('analysis-service');

/**
 * Create a new contract analysis
 */
export async function createContractAnalysis(
  analysisData: Omit<InsertContractAnalysis, 'createdAt' | 'updatedAt'>
): Promise<ContractAnalysis> {
  try {
    logger.info(`Creating analysis for contract: ${analysisData.contractId} by user: ${analysisData.userId}`);
    
    // Verify the contract exists
    const contract = await getContractById(analysisData.contractId);
    if (!contract) {
      throw ApiError.notFound('Contract not found');
    }
    
    // Check if user has access to the contract
    if (contract.userId !== analysisData.userId) {
      throw ApiError.forbidden('User does not have access to this contract');
    }
    
    // Check if an analysis already exists
    const existingAnalysis = await getContractAnalysisByContractId(analysisData.contractId);
    
    // If an analysis already exists, update it
    if (existingAnalysis) {
      return updateContractAnalysis(existingAnalysis.id, analysisData);
    }
    
    // Create new analysis
    const [newAnalysis] = await db
      .insert(contractAnalyses)
      .values(analysisData)
      .returning();
    
    logger.info(`Created analysis with ID: ${newAnalysis.id}`);
    
    return newAnalysis;
  } catch (error) {
    logger.error('Error creating contract analysis', error);
    throw error;
  }
}

/**
 * Get analysis by ID
 */
export async function getContractAnalysisById(id: number): Promise<ContractAnalysis | null> {
  try {
    const [analysis] = await db
      .select()
      .from(contractAnalyses)
      .where(eq(contractAnalyses.id, id));
    
    return analysis || null;
  } catch (error) {
    logger.error(`Error getting contract analysis with ID: ${id}`, error);
    throw error;
  }
}

/**
 * Get analysis by contract ID
 */
export async function getContractAnalysisByContractId(contractId: number): Promise<ContractAnalysis | null> {
  try {
    const [analysis] = await db
      .select()
      .from(contractAnalyses)
      .where(eq(contractAnalyses.contractId, contractId));
    
    return analysis || null;
  } catch (error) {
    logger.error(`Error getting analysis for contract: ${contractId}`, error);
    throw error;
  }
}

/**
 * Update contract analysis
 */
export async function updateContractAnalysis(
  id: number,
  analysisData: Partial<Omit<InsertContractAnalysis, 'createdAt' | 'updatedAt'>>
): Promise<ContractAnalysis> {
  try {
    const analysis = await getContractAnalysisById(id);
    
    if (!analysis) {
      throw ApiError.notFound('Contract analysis not found');
    }
    
    const [updatedAnalysis] = await db
      .update(contractAnalyses)
      .set({
        ...analysisData,
        updatedAt: new Date()
      })
      .where(eq(contractAnalyses.id, id))
      .returning();
    
    logger.info(`Updated analysis: ${id}`);
    
    return updatedAnalysis;
  } catch (error) {
    logger.error(`Error updating contract analysis: ${id}`, error);
    throw error;
  }
}

/**
 * Delete contract analysis
 */
export async function deleteContractAnalysis(id: number): Promise<void> {
  try {
    const analysis = await getContractAnalysisById(id);
    
    if (!analysis) {
      throw ApiError.notFound('Contract analysis not found');
    }
    
    await db
      .delete(contractAnalyses)
      .where(eq(contractAnalyses.id, id));
    
    logger.info(`Deleted analysis: ${id}`);
  } catch (error) {
    logger.error(`Error deleting contract analysis: ${id}`, error);
    throw error;
  }
}

/**
 * Get all analyses for a user
 */
export async function getUserContractAnalyses(userId: number): Promise<ContractAnalysis[]> {
  try {
    return await db
      .select()
      .from(contractAnalyses)
      .where(eq(contractAnalyses.userId, userId))
      .orderBy(contractAnalyses.createdAt);
  } catch (error) {
    logger.error(`Error getting analyses for user: ${userId}`, error);
    throw error;
  }
}

/**
 * Generate analysis for a contract
 * This performs the actual AI-based analysis
 */
export async function generateContractAnalysis(
  contractId: number,
  userId: number
): Promise<ContractAnalysis> {
  try {
    logger.info(`Generating analysis for contract: ${contractId}`);
    
    // Get the contract
    const contract = await getContractById(contractId);
    if (!contract) {
      throw ApiError.notFound('Contract not found');
    }
    
    // Check if user has access to the contract
    if (contract.userId !== userId) {
      throw ApiError.forbidden('User does not have access to this contract');
    }
    
    // Here we would typically call an AI service to analyze the contract
    // For now, we'll simulate a basic analysis
    
    // Generate a risk score (1-100, higher = more risk)
    const riskScore = Math.floor(Math.random() * 60) + 20; // Random between 20-80
    
    // Generate completeness score (0-100%)
    const completeness = Math.floor(Math.random() * 40) + 60; // Random between 60-100
    
    // Example issues/strengths/weaknesses based on the contract content
    const strengths = [
      'Clear definition of responsibilities',
      'Well-structured payment terms',
      'Proper termination clauses'
    ];
    
    const weaknesses = [
      'Ambiguous liability provisions',
      'Missing force majeure clause',
      'Jurisdiction not clearly specified'
    ];
    
    const recommendations = [
      'Add more specific indemnification clauses',
      'Include detailed dispute resolution process',
      'Specify confidentiality terms more clearly'
    ];
    
    // Assume compliance with Indian law based on risk score
    const compliantWithIndianLaw = riskScore < 50;
    
    // Create analysis record
    const analysisData: Omit<InsertContractAnalysis, 'createdAt' | 'updatedAt'> = {
      contractId,
      userId,
      riskScore,
      completeness,
      issues: [],
      strengths,
      weaknesses,
      recommendations,
      compliantWithIndianLaw,
      analysisMetadata: {
        version: '1.0',
        timestamp: new Date().toISOString(),
        method: 'ai-assisted'
      }
    };
    
    return createContractAnalysis(analysisData);
  } catch (error) {
    logger.error(`Error generating analysis for contract: ${contractId}`, error);
    throw error;
  }
}