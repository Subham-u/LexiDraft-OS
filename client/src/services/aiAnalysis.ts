/**
 * AI Contract Analysis Service
 * Provides methods to interact with the AI analysis API endpoints
 */

// Types for contract analysis
export interface ContractAnalysisRequest {
  contractId: number;
  userId: number;
  analysisType: 'full' | 'clauses' | 'compliance' | 'missing';
  options?: {
    jurisdiction?: string;
    contractType?: string;
    focusAreas?: string[];
  };
}

export interface ContractAnalysisResponse {
  id: number;
  contractId: number;
  userId: number;
  createdAt: string;
  status: 'pending' | 'completed' | 'failed';
  analysisType: string;
  results: AnalysisResults;
}

export interface AnalysisResults {
  score?: number;
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  suggestions?: Suggestion[];
  missingClauses?: MissingClause[];
  risks?: Risk[];
  complianceIssues?: ComplianceIssue[];
}

export interface Suggestion {
  id: string;
  title: string;
  originalText?: string;
  suggestedText: string;
  explanation: string;
  priority: 'high' | 'medium' | 'low';
  clauseReference?: string;
}

export interface MissingClause {
  id: string;
  title: string;
  description: string;
  importance: 'critical' | 'important' | 'recommended';
  suggestedText: string;
}

export interface Risk {
  id: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  recommendation: string;
  clauseReference?: string;
}

export interface ComplianceIssue {
  id: string;
  title: string;
  description: string;
  regulation: string;
  severity: 'high' | 'medium' | 'low';
  recommendation: string;
  clauseReference?: string;
}

// API endpoint paths
const API_ENDPOINTS = {
  ANALYZE_CONTRACT: '/api/contracts/analysis',
  GET_ANALYSIS: (id: number) => `/api/contracts/analysis/${id}`,
};

/**
 * Request a full contract analysis
 */
export async function analyzeContract(request: ContractAnalysisRequest): Promise<ContractAnalysisResponse> {
  try {
    const response = await fetch(API_ENDPOINTS.ANALYZE_CONTRACT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to analyze contract');
    }

    return response.json();
  } catch (error) {
    console.error('Error analyzing contract:', error);
    
    // In development mode, return mock data if the API fails
    if (import.meta.env.DEV) {
      return getMockAnalysisResponse(request);
    }
    
    throw error;
  }
}

/**
 * Get analysis results by ID
 */
export async function getContractAnalysis(id: number): Promise<ContractAnalysisResponse> {
  try {
    const response = await fetch(API_ENDPOINTS.GET_ANALYSIS(id));

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch analysis results');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching analysis:', error);
    
    // In development mode, return mock data if the API fails
    if (import.meta.env.DEV) {
      return {
        id,
        contractId: 1,
        userId: 1,
        createdAt: new Date().toISOString(),
        status: 'completed',
        analysisType: 'full',
        results: getMockAnalysisResults()
      };
    }
    
    throw error;
  }
}

/**
 * Generate mock analysis results for development and testing
 */
function getMockAnalysisResponse(request: ContractAnalysisRequest): ContractAnalysisResponse {
  return {
    id: Math.floor(Math.random() * 1000),
    contractId: request.contractId,
    userId: request.userId,
    createdAt: new Date().toISOString(),
    status: 'completed',
    analysisType: request.analysisType,
    results: getMockAnalysisResults(),
  };
}

/**
 * Generate mock analysis results data
 */
function getMockAnalysisResults(): AnalysisResults {
  return {
    score: 72,
    summary: "This contract contains multiple areas that require attention. While the basic structure is sound, there are several clauses that could benefit from clearer language, and a few critical clauses are missing. The contract has medium to high risk in its current form.",
    strengths: [
      "Clear payment terms and schedule",
      "Well-defined intellectual property rights",
      "Appropriate confidentiality provisions"
    ],
    weaknesses: [
      "Ambiguous termination clause",
      "Vague force majeure provisions",
      "Inadequate liability limitations"
    ],
    suggestions: [
      {
        id: "s1",
        title: "Improve termination clause",
        originalText: "Either party may terminate this Agreement with 30 days notice.",
        suggestedText: "Either party may terminate this Agreement for convenience with 30 days prior written notice to the other party. In case of material breach, the non-breaching party may terminate this Agreement with 14 days written notice if such breach remains uncured during this period.",
        explanation: "The current termination clause is too simplistic and doesn't address material breaches or the notice mechanism.",
        priority: "high",
        clauseReference: "Section 14.2"
      },
      {
        id: "s2",
        title: "Enhance force majeure clause",
        originalText: "Neither party shall be liable for failure to perform due to events beyond their control.",
        suggestedText: "Neither party shall be liable for failure or delay in performance of its obligations to the extent caused by circumstances beyond its reasonable control, including but not limited to acts of God, natural disasters, terrorism, riots, war, epidemics, pandemics, communication line failures, power failures, or governmental restrictions. The affected party shall promptly notify the other party of the force majeure event and resume performance as soon as reasonably possible after the force majeure event ends.",
        explanation: "The current force majeure clause is too vague and doesn't include notification requirements or resumption expectations.",
        priority: "medium",
        clauseReference: "Section 17.1"
      }
    ],
    missingClauses: [
      {
        id: "m1",
        title: "Dispute Resolution",
        description: "The contract lacks a clear dispute resolution mechanism, which could lead to costly litigation.",
        importance: "critical",
        suggestedText: "Any dispute arising out of or in connection with this Agreement shall first be attempted to be resolved through good faith negotiation between senior representatives of each party. If not resolved within 30 days, the dispute shall be submitted to mediation under the rules of [Appropriate Mediation Body]. If mediation fails, the dispute shall be finally resolved by arbitration under the rules of [Appropriate Arbitration Institution], by one or more arbitrators appointed in accordance with said rules. The place of arbitration shall be [City, Country]. The language of the arbitration shall be English."
      },
      {
        id: "m2",
        title: "Change Control Procedure",
        description: "No mechanism is defined for how changes to the contract or scope of work will be handled.",
        importance: "important",
        suggestedText: "Any change to this Agreement or the Services described herein must be made through a written Change Order signed by authorized representatives of both parties. The Change Order shall describe the nature of the change, any adjustment to the fees, and any modification to the timeline. Neither party is obligated to perform changes until a Change Order is executed by both parties."
      }
    ],
    risks: [
      {
        id: "r1",
        title: "Inadequate Liability Limitation",
        description: "The current liability clause does not properly protect your interests in case of significant damages.",
        severity: "high",
        recommendation: "Add a clear liability cap that is proportional to the contract value (e.g., 12 months of fees) and exclude certain types of damages from the limitation (like IP infringement).",
        clauseReference: "Section 12.3"
      },
      {
        id: "r2",
        title: "Weak Indemnification Provisions",
        description: "Current indemnification clause is one-sided and exposes you to significant risk.",
        severity: "medium",
        recommendation: "Make indemnification mutual and clarify the scope and process for indemnification claims.",
        clauseReference: "Section 13.1"
      }
    ],
    complianceIssues: [
      {
        id: "c1",
        title: "Data Protection Compliance",
        description: "The privacy and data protection provisions do not adequately address GDPR requirements.",
        regulation: "General Data Protection Regulation (GDPR)",
        severity: "high",
        recommendation: "Add specific clauses addressing data subject rights, data breach notification, and define the roles as controller/processor clearly.",
        clauseReference: "Section 9.2"
      },
      {
        id: "c2",
        title: "Electronic Signature Compliance",
        description: "The contract does not explicitly allow for electronic signatures or specify the process.",
        regulation: "Electronic Signatures in Global and National Commerce Act (ESIGN)",
        severity: "low",
        recommendation: "Add a clause explicitly stating that electronic signatures are acceptable and legally binding.",
        clauseReference: "Section 20.4"
      }
    ]
  };
}