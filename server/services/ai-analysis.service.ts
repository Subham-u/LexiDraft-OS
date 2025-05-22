/**
 * AI Contract Analysis Service
 * Uses OpenAI to analyze legal contracts and provide insights, suggestions, and risk assessments
 */

import OpenAI from 'openai';
import { db } from '../db';
import { contractAnalyses, contracts } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { createLogger } from '../utils/logger';

// Initialize logger
const logger = createLogger('ai-analysis');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Analysis types
export type AnalysisType = 'full' | 'clauses' | 'missing' | 'compliance';

// Analysis options
export interface AnalysisOptions {
  jurisdiction?: string;
  contractType?: string;
  focusAreas?: string[];
}

// Analysis request
export interface AnalysisRequest {
  contractId: number;
  userId: number;
  analysisType: AnalysisType;
  options?: AnalysisOptions;
}

// Analysis result
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

// Suggestion interface
export interface Suggestion {
  id: string;
  title: string;
  originalText?: string;
  suggestedText: string;
  explanation: string;
  priority: 'high' | 'medium' | 'low';
  clauseReference?: string;
}

// Missing clause interface
export interface MissingClause {
  id: string;
  title: string;
  description: string;
  importance: 'critical' | 'important' | 'recommended';
  suggestedText: string;
}

// Risk interface
export interface Risk {
  id: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  recommendation: string;
  clauseReference?: string;
}

// Compliance issue interface
export interface ComplianceIssue {
  id: string;
  title: string;
  description: string;
  regulation: string;
  severity: 'high' | 'medium' | 'low';
  recommendation: string;
  clauseReference?: string;
}

// Main analysis service class
export class AIAnalysisService {
  /**
   * Analyze a contract and save the results to the database
   */
  async analyzeContract(request: AnalysisRequest): Promise<number> {
    try {
      logger.info(`Starting ${request.analysisType} analysis for contract ${request.contractId}`);
      
      // Create a new analysis record
      const [analysis] = await db.insert(contractAnalyses).values({
        contractId: request.contractId,
        userId: request.userId,
        analysisType: request.analysisType,
        status: 'pending',
        options: request.options || {},
        results: {},
      }).returning();
      
      // Start analysis in background (don't await)
      this.runAnalysis(analysis.id, request).catch(error => {
        logger.error(`Error in background analysis: ${error.message}`, error);
      });
      
      return analysis.id;
    } catch (error) {
      logger.error(`Error initiating contract analysis: ${error.message}`, error);
      throw new Error(`Failed to initiate contract analysis: ${error.message}`);
    }
  }
  
  /**
   * Get analysis results by ID
   */
  async getAnalysisById(id: number) {
    try {
      const [analysis] = await db.select().from(contractAnalyses).where(eq(contractAnalyses.id, id));
      return analysis;
    } catch (error:any) {
      logger.error(`Error getting analysis with ID ${id}: ${error.message}`, error);
      throw new Error(`Failed to get analysis: ${error.message}`);
    }
  }
  
  /**
   * Run the actual analysis in the background
   */
  private async runAnalysis(analysisId: number, request: AnalysisRequest) {
    try {
      // Get the contract content
      const [contract] = await db.select().from(contracts).where(eq(contracts.id, request.contractId));
      
      if (!contract || !contract.content) {
        throw new Error(`Contract not found or has no content: ${request.contractId}`);
      }
      
      // Depending on analysis type, call the appropriate OpenAI function
      let results: AnalysisResults;
      
      switch (request.analysisType) {
        case 'full':
          results = await this.performFullAnalysis(contract.content, request.options);
          break;
        case 'clauses':
          results = await this.analyzeContractClauses(contract.content, request.options);
          break;
        case 'missing':
          results = await this.identifyMissingClauses(contract.content, request.options);
          break;
        case 'compliance':
          results = await this.checkCompliance(contract.content, request.options);
          break;
        default:
          throw new Error(`Unknown analysis type: ${request.analysisType}`);
      }
      
      // Update the analysis record
      await db.update(contractAnalyses)
        .set({
          status: 'completed',
          results: results,
          completedAt: new Date(),
        })
        .where(eq(contractAnalyses.id, analysisId));
      
      logger.info(`Completed ${request.analysisType} analysis for contract ${request.contractId}`);
      
      return results;
    } catch (error:any) {
      logger.error(`Error running analysis: ${error.message}`, error);
      
      // Update the analysis record with error
      await db.update(contractAnalyses)
        .set({
          status: 'failed',
          error: error.message,
          completedAt: new Date(),
        })
        .where(eq(contractAnalyses.id, analysisId));
      
      throw error;
    }
  }
  
  /**
   * Perform a full comprehensive analysis of the contract
   */
  private async performFullAnalysis(contractContent: string, options?: AnalysisOptions): Promise<AnalysisResults> {
    // Prepare the prompt
    const systemPrompt = this.buildFullAnalysisSystemPrompt(options);
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: contractContent },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 4000,
      });
      
      // Parse the response
      if (!response.choices[0]?.message?.content) {
        throw new Error('No response from OpenAI API');
      }
      
      const analysisResults = JSON.parse(response.choices[0].message.content);
      
      // Generate IDs for each item if they don't have them
      if (analysisResults.suggestions) {
        analysisResults.suggestions = analysisResults.suggestions.map((suggestion: Suggestion, index: number) => ({
          ...suggestion,
          id: suggestion.id || `s${index + 1}`,
        }));
      }
      
      if (analysisResults.missingClauses) {
        analysisResults.missingClauses = analysisResults.missingClauses.map((clause: MissingClause, index: number) => ({
          ...clause,
          id: clause.id || `m${index + 1}`,
        }));
      }
      
      if (analysisResults.risks) {
        analysisResults.risks = analysisResults.risks.map((risk: Risk, index: number) => ({
          ...risk,
          id: risk.id || `r${index + 1}`,
        }));
      }
      
      if (analysisResults.complianceIssues) {
        analysisResults.complianceIssues = analysisResults.complianceIssues.map((issue: ComplianceIssue, index: number) => ({
          ...issue,
          id: issue.id || `c${index + 1}`,
        }));
      }
      
      return analysisResults;
    } catch (error) {
      logger.error(`Error in full analysis: ${error.message}`, error);
      throw new Error(`Failed to analyze contract: ${error.message}`);
    }
  }
  
  /**
   * Analyze specific clauses in the contract and provide suggestions
   */
  private async analyzeContractClauses(contractContent: string, options?: AnalysisOptions): Promise<AnalysisResults> {
    // Prepare the prompt
    const systemPrompt = this.buildClauseAnalysisSystemPrompt(options);
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: contractContent },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 3000,
      });
      
      // Parse the response
      if (!response.choices[0]?.message?.content) {
        throw new Error('No response from OpenAI API');
      }
      
      const analysisResults = JSON.parse(response.choices[0].message.content);
      
      // Generate IDs for suggestions if they don't have them
      if (analysisResults.suggestions) {
        analysisResults.suggestions = analysisResults.suggestions.map((suggestion: Suggestion, index: number) => ({
          ...suggestion,
          id: suggestion.id || `s${index + 1}`,
        }));
      }
      
      return analysisResults;
    } catch (error) {
      logger.error(`Error in clause analysis: ${error.message}`, error);
      throw new Error(`Failed to analyze contract clauses: ${error.message}`);
    }
  }
  
  /**
   * Identify missing clauses in the contract
   */
  private async identifyMissingClauses(contractContent: string, options?: AnalysisOptions): Promise<AnalysisResults> {
    // Prepare the prompt
    const systemPrompt = this.buildMissingClausesSystemPrompt(options);
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: contractContent },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 3000,
      });
      
      // Parse the response
      if (!response.choices[0]?.message?.content) {
        throw new Error('No response from OpenAI API');
      }
      
      const analysisResults = JSON.parse(response.choices[0].message.content);
      
      // Generate IDs for missing clauses if they don't have them
      if (analysisResults.missingClauses) {
        analysisResults.missingClauses = analysisResults.missingClauses.map((clause: MissingClause, index: number) => ({
          ...clause,
          id: clause.id || `m${index + 1}`,
        }));
      }
      
      return analysisResults;
    } catch (error) {
      logger.error(`Error in missing clauses analysis: ${error.message}`, error);
      throw new Error(`Failed to identify missing clauses: ${error.message}`);
    }
  }
  
  /**
   * Check the contract for compliance with relevant laws and regulations
   */
  private async checkCompliance(contractContent: string, options?: AnalysisOptions): Promise<AnalysisResults> {
    // Prepare the prompt
    const systemPrompt = this.buildComplianceCheckSystemPrompt(options);
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: contractContent },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 3000,
      });
      
      // Parse the response
      if (!response.choices[0]?.message?.content) {
        throw new Error('No response from OpenAI API');
      }
      
      const analysisResults = JSON.parse(response.choices[0].message.content);
      
      // Generate IDs for compliance issues if they don't have them
      if (analysisResults.complianceIssues) {
        analysisResults.complianceIssues = analysisResults.complianceIssues.map((issue: ComplianceIssue, index: number) => ({
          ...issue,
          id: issue.id || `c${index + 1}`,
        }));
      }
      
      return analysisResults;
    } catch (error:any) {
      logger.error(`Error in compliance check: ${error.message}`, error);
      throw new Error(`Failed to check compliance: ${error.message}`);
    }
  }
  
  /**
   * Build system prompt for full analysis
   */
  private buildFullAnalysisSystemPrompt(options?: AnalysisOptions): string {
    let jurisdictionInfo = '';
    if (options?.jurisdiction) {
      jurisdictionInfo = `The contract is governed by the laws of ${options.jurisdiction}. `;
    }
    
    let contractTypeInfo = '';
    if (options?.contractType) {
      contractTypeInfo = `This is a ${options.contractType} contract. `;
    }
    
    let focusAreasInfo = '';
    if (options?.focusAreas && options.focusAreas.length > 0) {
      focusAreasInfo = `Pay special attention to these areas: ${options.focusAreas.join(', ')}. `;
    }
    
    return `
You are an expert legal AI trained to analyze contracts. ${jurisdictionInfo}${contractTypeInfo}${focusAreasInfo}

For the contract provided, perform a comprehensive analysis and return a structured JSON response with the following components:

1. "score" (number from 0-100): Overall quality score for the contract.
2. "summary" (string): Brief summary of the contract's quality and key issues.
3. "strengths" (array of strings): List of the contract's strengths.
4. "weaknesses" (array of strings): List of the contract's weaknesses.
5. "suggestions" (array of objects): Specific improvements for problematic clauses with the following structure:
   - "id" (string): Unique identifier
   - "title" (string): Short descriptive title
   - "originalText" (string): The problematic text from the contract
   - "suggestedText" (string): Improved text for the clause
   - "explanation" (string): Why this change is recommended
   - "priority" (string): "high", "medium", or "low"
   - "clauseReference" (string): Section number or heading (if identifiable)
6. "missingClauses" (array of objects): Important clauses that should be added:
   - "id" (string): Unique identifier
   - "title" (string): Name of the clause
   - "description" (string): Why this clause is needed
   - "importance" (string): "critical", "important", or "recommended"
   - "suggestedText" (string): Sample text for the clause
7. "risks" (array of objects): Legal or business risks in the contract:
   - "id" (string): Unique identifier
   - "title" (string): Risk name
   - "description" (string): Description of the risk
   - "severity" (string): "high", "medium", or "low"
   - "recommendation" (string): How to mitigate this risk
   - "clauseReference" (string, optional): Section reference
8. "complianceIssues" (array of objects): Regulatory compliance concerns:
   - "id" (string): Unique identifier
   - "title" (string): Issue name
   - "description" (string): Description of the compliance issue
   - "regulation" (string): Relevant law or regulation
   - "severity" (string): "high", "medium", or "low"
   - "recommendation" (string): How to address this issue
   - "clauseReference" (string, optional): Section reference

Format your response as a valid JSON object.
`;
  }
  
  /**
   * Build system prompt for clause analysis
   */
  private buildClauseAnalysisSystemPrompt(options?: AnalysisOptions): string {
    let jurisdictionInfo = '';
    if (options?.jurisdiction) {
      jurisdictionInfo = `The contract is governed by the laws of ${options.jurisdiction}. `;
    }
    
    let contractTypeInfo = '';
    if (options?.contractType) {
      contractTypeInfo = `This is a ${options.contractType} contract. `;
    }
    
    let focusAreasInfo = '';
    if (options?.focusAreas && options.focusAreas.length > 0) {
      focusAreasInfo = `Pay special attention to these areas: ${options.focusAreas.join(', ')}. `;
    }
    
    return `
You are an expert legal AI trained to analyze contract clauses. ${jurisdictionInfo}${contractTypeInfo}${focusAreasInfo}

For the contract provided, analyze each clause and return a structured JSON response with the following components:

1. "summary" (string): Brief summary of the clauses' quality and notable issues.
2. "suggestions" (array of objects): Specific improvements for problematic clauses with the following structure:
   - "id" (string): Unique identifier
   - "title" (string): Short descriptive title
   - "originalText" (string): The problematic text from the contract
   - "suggestedText" (string): Improved text for the clause
   - "explanation" (string): Why this change is recommended
   - "priority" (string): "high", "medium", or "low"
   - "clauseReference" (string): Section number or heading (if identifiable)

Focus on identifying:
- Ambiguous language
- One-sided terms
- Provisions that need strengthening
- Outdated clauses
- Inconsistencies
- Legally problematic terms

Format your response as a valid JSON object.
`;
  }
  
  /**
   * Build system prompt for missing clauses analysis
   */
  private buildMissingClausesSystemPrompt(options?: AnalysisOptions): string {
    let jurisdictionInfo = '';
    if (options?.jurisdiction) {
      jurisdictionInfo = `The contract is governed by the laws of ${options.jurisdiction}. `;
    }
    
    let contractTypeInfo = '';
    if (options?.contractType) {
      contractTypeInfo = `This is a ${options.contractType} contract. `;
    }
    
    return `
You are an expert legal AI trained to identify missing clauses in contracts. ${jurisdictionInfo}${contractTypeInfo}

For the contract provided, identify important clauses that are missing and return a structured JSON response with the following components:

1. "summary" (string): Brief summary of the missing clauses and their importance.
2. "missingClauses" (array of objects): Important clauses that should be added:
   - "id" (string): Unique identifier
   - "title" (string): Name of the clause
   - "description" (string): Why this clause is needed
   - "importance" (string): "critical", "important", or "recommended"
   - "suggestedText" (string): Sample text for the clause

Consider standard clauses appropriate for this type of contract, especially those that:
- Provide essential legal protections
- Address common risks
- Meet regulatory requirements
- Follow industry best practices
- Clarify important terms

Format your response as a valid JSON object.
`;
  }
  
  /**
   * Build system prompt for compliance check
   */
  private buildComplianceCheckSystemPrompt(options?: AnalysisOptions): string {
    let jurisdictionInfo = 'Indian law';
    if (options?.jurisdiction) {
      jurisdictionInfo = `the laws of ${options.jurisdiction}`;
    }
    
    let contractTypeInfo = '';
    if (options?.contractType) {
      contractTypeInfo = ` for ${options.contractType} contracts`;
    }
    
    return `
You are an expert legal AI trained to assess contract compliance. 

For the contract provided, evaluate compliance with ${jurisdictionInfo}${contractTypeInfo} and return a structured JSON response with the following components:

1. "summary" (string): Brief summary of compliance status and key issues.
2. "complianceIssues" (array of objects): Regulatory or legal compliance concerns:
   - "id" (string): Unique identifier
   - "title" (string): Issue name
   - "description" (string): Description of the compliance issue
   - "regulation" (string): Relevant law, regulation, or legal principle
   - "severity" (string): "high", "medium", or "low"
   - "recommendation" (string): How to address this issue
   - "clauseReference" (string, optional): Section reference

Consider compliance with:
- Contract formation requirements
- Sector-specific regulations
- Consumer protection laws
- Data protection and privacy requirements
- Employment and labor laws
- Tax and financial regulations
- Industry-specific requirements
- Ethical business practices

Format your response as a valid JSON object.
`;
  }
}

// Create and export a singleton instance
export const aiAnalysisService = new AIAnalysisService();