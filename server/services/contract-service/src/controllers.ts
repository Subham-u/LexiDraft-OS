/**
 * Contract service controllers
 */
import { storage } from '../../../storage';
import { createLogger } from '../../../shared/utils/logger';
import { ApiError } from '../../../shared/types';
import { config } from './config';
import { Contract, InsertContract } from '../../../shared/schema';

const logger = createLogger('contract-service-controllers');

export const contractControllers = {
  // Get contract by ID
  getContractById: async (contractId: number, userId: number) => {
    try {
      const contract = await storage.getContract(contractId);
      
      if (!contract) {
        throw ApiError.notFound('Contract not found');
      }
      
      // Check if user has access to this contract
      if (contract.userId !== userId) {
        throw ApiError.forbidden('You do not have permission to access this contract');
      }
      
      return {
        success: true,
        data: contract
      };
    } catch (error) {
      logger.error(`Error fetching contract ${contractId}`, { error });
      throw error;
    }
  },
  
  // Get all contracts for a user
  getUserContracts: async (userId: number) => {
    try {
      const contracts = await storage.getAllContracts();
      
      // Filter contracts by user ID
      const userContracts = contracts.filter(contract => contract.userId === userId);
      
      return {
        success: true,
        data: userContracts
      };
    } catch (error) {
      logger.error(`Error fetching contracts for user ${userId}`, { error });
      throw error;
    }
  },
  
  // Get recent contracts for a user
  getRecentContracts: async (userId: number, limit: number = 5) => {
    try {
      const contracts = await storage.getRecentContracts(limit);
      
      // Filter contracts by user ID
      const userContracts = contracts.filter(contract => contract.userId === userId);
      
      return {
        success: true,
        data: userContracts
      };
    } catch (error) {
      logger.error(`Error fetching recent contracts for user ${userId}`, { error });
      throw error;
    }
  },
  
  // Create a new contract
  createContract: async (contractData: InsertContract) => {
    try {
      const newContract = await storage.createContract(contractData);
      
      return {
        success: true,
        data: newContract
      };
    } catch (error) {
      logger.error('Error creating contract', { error });
      throw error;
    }
  },
  
  // Update an existing contract
  updateContract: async (contractId: number, userId: number, contractData: Partial<InsertContract>) => {
    try {
      // First check if the contract exists and belongs to the user
      const existingContract = await storage.getContract(contractId);
      
      if (!existingContract) {
        throw ApiError.notFound('Contract not found');
      }
      
      if (existingContract.userId !== userId) {
        throw ApiError.forbidden('You do not have permission to update this contract');
      }
      
      const updatedContract = await storage.updateContract(contractId, contractData);
      
      if (!updatedContract) {
        throw ApiError.internal('Failed to update contract');
      }
      
      return {
        success: true,
        data: updatedContract
      };
    } catch (error) {
      logger.error(`Error updating contract ${contractId}`, { error });
      throw error;
    }
  },
  
  // Generate PDF for a contract
  generateContractPdf: async (contractId: number, userId: number) => {
    try {
      // First check if the contract exists and belongs to the user
      const existingContract = await storage.getContract(contractId);
      
      if (!existingContract) {
        throw ApiError.notFound('Contract not found');
      }
      
      if (existingContract.userId !== userId) {
        throw ApiError.forbidden('You do not have permission to access this contract');
      }
      
      // Generate PDF (this would call a PDF generation service)
      const pdfUrl = await storage.generateContractPdf(contractId);
      
      if (!pdfUrl) {
        throw ApiError.internal('Failed to generate PDF');
      }
      
      return {
        success: true,
        data: {
          pdfUrl
        }
      };
    } catch (error) {
      logger.error(`Error generating PDF for contract ${contractId}`, { error });
      throw error;
    }
  },
  
  // Add a party to a contract
  addPartyToContract: async (contractId: number, userId: number, party: { name: string; role: string }) => {
    try {
      // First check if the contract exists and belongs to the user
      const existingContract = await storage.getContract(contractId);
      
      if (!existingContract) {
        throw ApiError.notFound('Contract not found');
      }
      
      if (existingContract.userId !== userId) {
        throw ApiError.forbidden('You do not have permission to update this contract');
      }
      
      const updatedContract = await storage.addPartyToContract(contractId, party);
      
      if (!updatedContract) {
        throw ApiError.internal('Failed to add party to contract');
      }
      
      return {
        success: true,
        data: updatedContract
      };
    } catch (error) {
      logger.error(`Error adding party to contract ${contractId}`, { error });
      throw error;
    }
  },
  
  // Get service status
  getStatus: () => {
    return {
      success: true,
      service: 'contract-service',
      version: config.version,
      status: 'operational',
      timestamp: new Date().toISOString()
    };
  }
};