/**
 * Contract service for handling contract-related operations
 */
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { contracts, type Contract, type InsertContract } from '../../shared/schema';
import { createLogger } from '../utils/logger';
import { ApiError } from '../middleware/error';

const logger = createLogger('contract-service');

/**
 * Get all contracts
 */
export async function getAllContracts(): Promise<Contract[]> {
  try {
    return await db.select().from(contracts);
  } catch (error) {
    logger.error('Error getting all contracts', error);
    throw error;
  }
}

/**
 * Get contracts by user ID
 */
export async function getContractsByUserId(userId: number): Promise<Contract[]> {
  try {
    return await db
      .select()
      .from(contracts)
      .where(eq(contracts.userId, userId));
  } catch (error) {
    logger.error(`Error getting contracts for user: ${userId}`, error);
    throw error;
  }
}

/**
 * Get contract by ID
 */
export async function getContractById(id: number): Promise<Contract | null> {
  try {
    const [contract] = await db
      .select()
      .from(contracts)
      .where(eq(contracts.id, id));
    
    return contract || null;
  } catch (error) {
    logger.error(`Error getting contract by ID: ${id}`, error);
    throw error;
  }
}

/**
 * Create a new contract
 */
export async function createContract(contractData: InsertContract): Promise<Contract> {
  try {
    // Filter out any timestamp properties as they're handled automatically by PostgreSQL
    const { createdAt, updatedAt, ...filteredData } = contractData as any;
    
    const [newContract] = await db
      .insert(contracts)
      .values(filteredData)
      .returning();
    
    logger.info(`Contract created with ID: ${newContract.id}`);
    return newContract;
  } catch (error) {
    logger.error('Error creating contract', error);
    throw error;
  }
}

/**
 * Update an existing contract
 */
export async function updateContract(id: number, contractData: Partial<InsertContract>): Promise<Contract> {
  try {
    // Check if contract exists
    const contract = await getContractById(id);
    if (!contract) {
      throw ApiError.notFound('Contract not found');
    }
    
    // Filter out any timestamp properties
    const { createdAt, updatedAt, ...filteredData } = contractData as any;
    
    // Update contract
    const [updatedContract] = await db
      .update(contracts)
      .set(filteredData)
      .where(eq(contracts.id, id))
      .returning();
    
    logger.info(`Contract updated: ${id}`);
    return updatedContract;
  } catch (error) {
    logger.error(`Error updating contract: ${id}`, error);
    throw error;
  }
}

/**
 * Delete a contract
 */
export async function deleteContract(id: number): Promise<void> {
  try {
    // Check if contract exists
    const contract = await getContractById(id);
    if (!contract) {
      throw ApiError.notFound('Contract not found');
    }
    
    // Delete contract
    await db
      .delete(contracts)
      .where(eq(contracts.id, id));
    
    logger.info(`Contract deleted: ${id}`);
  } catch (error) {
    logger.error(`Error deleting contract: ${id}`, error);
    throw error;
  }
}

/**
 * Get recent contracts with limit
 */
export async function getRecentContracts(limit: number = 5): Promise<Contract[]> {
  try {
    return await db
      .select()
      .from(contracts)
      .orderBy(contracts.createdAt, 'desc')
      .limit(limit);
  } catch (error) {
    logger.error('Error getting recent contracts', error);
    throw error;
  }
}

/**
 * Change contract status
 */
export async function updateContractStatus(id: number, status: string): Promise<Contract> {
  try {
    const [updatedContract] = await db
      .update(contracts)
      .set({
        status: status as any, // Type cast to handle enum
        updatedAt: new Date()
      })
      .where(eq(contracts.id, id))
      .returning();
    
    if (!updatedContract) {
      throw ApiError.notFound('Contract not found');
    }
    
    logger.info(`Contract ${id} status updated to: ${status}`);
    return updatedContract;
  } catch (error) {
    logger.error(`Error updating contract status: ${id}`, error);
    throw error;
  }
}