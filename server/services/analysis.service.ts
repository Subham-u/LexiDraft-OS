/**
 * Contract analysis service
 */
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { contractAnalyses } from '../../shared/schema';
import { createLogger } from '../utils/logger';

const logger = createLogger('analysis-service');

/**
 * Get contract analysis by contract ID
 */
export async function getContractAnalysisByContractId(contractId: number) {
  try {
    const [analysis] = await db
      .select()
      .from(contractAnalyses)
      .where(eq(contractAnalyses.contractId, contractId));
    
    return analysis;
  } catch (error) {
    logger.error(`Error getting contract analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
}

/**
 * Create contract analysis
 */
export async function createContractAnalysis(analysis: any) {
  try {
    const [result] = await db
      .insert(contractAnalyses)
      .values(analysis)
      .returning();
    
    return result;
  } catch (error) {
    logger.error(`Error creating contract analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

/**
 * Update contract analysis
 */
export async function updateContractAnalysis(analysisId: number, updates: any) {
  try {
    const [result] = await db
      .update(contractAnalyses)
      .set(updates)
      .where(eq(contractAnalyses.id, analysisId))
      .returning();
    
    return result;
  } catch (error) {
    logger.error(`Error updating contract analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

/**
 * Delete contract analysis
 */
export async function deleteContractAnalysis(analysisId: number) {
  try {
    await db
      .delete(contractAnalyses)
      .where(eq(contractAnalyses.id, analysisId));
    
    return true;
  } catch (error) {
    logger.error(`Error deleting contract analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}