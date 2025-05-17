import { storage } from "../storage";
import type { InsertContract, Contract } from "@shared/schema";

/**
 * Get a contract by ID
 */
export async function getContractById(id: number): Promise<Contract | undefined> {
  return storage.getContract(id);
}

/**
 * Get all contracts
 */
export async function getAllContracts(): Promise<Contract[]> {
  return storage.getAllContracts();
}

/**
 * Get recent contracts
 */
export async function getRecentContracts(limit: number = 5): Promise<Contract[]> {
  return storage.getRecentContracts(limit);
}

/**
 * Create a new contract
 */
export async function createContract(contractData: InsertContract): Promise<Contract> {
  // Validate required fields
  if (!contractData.title || !contractData.type || !contractData.jurisdiction) {
    throw new Error("Missing required contract fields");
  }
  
  // Ensure parties array is not empty
  if (!contractData.parties || !Array.isArray(contractData.parties) || contractData.parties.length === 0) {
    throw new Error("At least one party is required");
  }
  
  // Set default values if not provided
  const preparedData = {
    ...contractData,
    status: contractData.status || "draft",
    content: contractData.content || "",
    clauses: contractData.clauses || [],
    pdfUrl: contractData.pdfUrl || null
  };
  
  return storage.createContract(preparedData);
}

/**
 * Update an existing contract
 */
export async function updateContract(id: number, contractData: Partial<InsertContract>): Promise<Contract | undefined> {
  // Get the existing contract
  const existingContract = await storage.getContract(id);
  if (!existingContract) {
    return undefined;
  }
  
  // Update the contract
  return storage.updateContract(id, contractData);
}

/**
 * Generate PDF for a contract
 * Note: This would typically use a PDF generation library
 * For this implementation, we'll just update the pdfUrl field
 */
export async function generateContractPdf(id: number): Promise<string | null> {
  const contract = await storage.getContract(id);
  if (!contract) {
    throw new Error("Contract not found");
  }
  
  // In a real implementation, we would generate the PDF here
  // For now, we'll just create a placeholder URL
  const pdfUrl = `/contracts/${id}/document.pdf`;
  
  // Update the contract with the PDF URL
  await storage.updateContract(id, { pdfUrl });
  
  return pdfUrl;
}

/**
 * Add a party to a contract
 */
export async function addPartyToContract(id: number, party: { name: string; role: string }): Promise<Contract | undefined> {
  const contract = await storage.getContract(id);
  if (!contract) {
    return undefined;
  }
  
  // Add the party to the contract
  const updatedParties = [...contract.parties, party];
  
  return storage.updateContract(id, { parties: updatedParties });
}

/**
 * Remove a party from a contract
 */
export async function removePartyFromContract(id: number, partyIndex: number): Promise<Contract | undefined> {
  const contract = await storage.getContract(id);
  if (!contract) {
    return undefined;
  }
  
  // Remove the party from the contract
  const updatedParties = [...contract.parties];
  updatedParties.splice(partyIndex, 1);
  
  return storage.updateContract(id, { parties: updatedParties });
}
