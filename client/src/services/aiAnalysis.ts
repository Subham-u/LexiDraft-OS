/**
 * AI Analysis Service
 * Provides contract analysis functionality using the LexiDraft API
 */

// Analysis result interface
export interface ContractAnalysisResult {
  success: boolean
  riskScore: number
  completeness: number
  issues: number
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  compliantWithIndianLaw: boolean
}

/**
 * Get AI analysis for a contract
 * @param contractId - ID of the contract to analyze
 */
export async function getContractAnalysis(contractId: number): Promise<ContractAnalysisResult> {
  try {
    const response = await fetch(`/api/contracts/analysis/${contractId}`);
    
    if (!response.ok) {
      throw new Error(`Error fetching contract analysis: ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Failed to get contract analysis:', error);
    
    // Rethrow for error handling by the caller
    throw error;
  }
}

/**
 * Request a new analysis for a contract
 * @param contractId - ID of the contract to analyze
 */
export async function requestContractAnalysis(contractId: number): Promise<{ success: boolean, message: string }> {
  try {
    const response = await fetch(`/api/analysis/request/${contractId}`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error(`Error requesting contract analysis: ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Failed to request contract analysis:', error);
    
    // Rethrow for error handling by the caller
    throw error;
  }
}