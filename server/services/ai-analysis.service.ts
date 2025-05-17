/**
 * AI-powered contract analysis service
 */
import OpenAI from "openai";
import { createLogger } from "../utils/logger";
import * as analysisService from "./analysis.service";
import * as contractService from "./contract.service";

const logger = createLogger('ai-analysis-service');

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

/**
 * Analyze a contract using AI
 */
export async function analyzeContract(contractId: number, userId: number) {
  try {
    // Get the contract
    const contract = await contractService.getContractById(contractId);
    
    if (!contract) {
      throw new Error('Contract not found');
    }
    
    // Check if user has access to the contract
    if (contract.userId !== userId) {
      throw new Error('User does not have access to this contract');
    }
    
    logger.info(`Analyzing contract ${contractId} using AI`);
    
    // Extract contract content
    const contractContent = contract.content;
    const contractTitle = contract.title;
    const contractType = contract.type;
    const jurisdiction = contract.jurisdiction;
    
    // Create prompt for contract analysis
    const prompt = `
    You are an expert legal AI assistant specializing in Indian contract law. Analyze this ${contractType} contract titled "${contractTitle}" with jurisdiction in ${jurisdiction}.
    
    CONTRACT CONTENT:
    ${contractContent}
    
    Perform a thorough analysis of this contract and provide the following structured output in JSON format:
    
    1. "riskScore": A number from 1-100 representing the overall risk level (higher = more risk)
    2. "completeness": A number from 1-100 representing how complete the contract is
    3. "strengths": Array of strengths in the contract (at least 3)
    4. "weaknesses": Array of weaknesses or areas of concern (at least 3)
    5. "recommendations": Array of specific recommendations for improvement (at least 3)
    6. "issues": Array of potential legal issues or ambiguities
    7. "compliantWithIndianLaw": Boolean indicating if the contract appears compliant with Indian law
    8. "analysisMetadata": Object with your confidence level and reasoning
    
    Your analysis should focus on identifying legal risks, ambiguities, missing clauses, and overall contract structure. Pay special attention to enforceability under Indian law.
    `;
    
    // Call OpenAI API for analysis
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });
    
    // Extract and parse the analysis
    const analysisResult = JSON.parse(response.choices[0].message.content);
    
    // Create analysis record in database
    const analysis = await analysisService.createContractAnalysis({
      contractId,
      userId,
      riskScore: analysisResult.riskScore,
      completeness: analysisResult.completeness,
      issues: analysisResult.issues || [],
      strengths: analysisResult.strengths,
      weaknesses: analysisResult.weaknesses,
      recommendations: analysisResult.recommendations,
      compliantWithIndianLaw: analysisResult.compliantWithIndianLaw,
      analysisMetadata: {
        model: "gpt-4o",
        timestamp: new Date().toISOString(),
        confidence: analysisResult.analysisMetadata?.confidence || 0.8,
        reasoning: analysisResult.analysisMetadata?.reasoning
      }
    });
    
    logger.info(`Contract ${contractId} analysis complete, ID: ${analysis.id}`);
    
    return analysis;
  } catch (error) {
    logger.error(`Error analyzing contract: ${error.message}`, error);
    throw error;
  }
}

/**
 * Generate improvement suggestions for a specific clause in a contract
 */
export async function suggestClauseImprovements(contractId: number, userId: number, clauseId: string) {
  try {
    // Get the contract
    const contract = await contractService.getContractById(contractId);
    
    if (!contract) {
      throw new Error('Contract not found');
    }
    
    // Check if user has access to the contract
    if (contract.userId !== userId) {
      throw new Error('User does not have access to this contract');
    }
    
    // Find the specific clause
    const clause = contract.clauses.find(c => c.id === clauseId);
    
    if (!clause) {
      throw new Error('Clause not found in contract');
    }
    
    logger.info(`Generating improvement suggestions for clause ${clauseId} in contract ${contractId}`);
    
    // Create prompt for clause improvement
    const prompt = `
    You are an expert legal AI assistant specializing in Indian contract law. Analyze this specific clause from a ${contract.type} contract with jurisdiction in ${contract.jurisdiction}.
    
    CLAUSE TITLE: ${clause.title}
    
    CLAUSE CONTENT:
    ${clause.content}
    
    Provide suggestions for improving this clause, focusing on:
    1. Legal clarity and precision
    2. Protection against potential risks
    3. Compliance with Indian law
    4. Enforceability
    5. Language simplification (where appropriate)
    
    Format your response as a JSON object with the following structure:
    {
      "improvementSuggestions": [array of specific suggestions],
      "riskAreas": [array of potential issues with this clause],
      "alternativeLanguage": "A rewritten version of the clause addressing the issues",
      "legalCitations": [array of relevant legal references, if applicable]
    }
    `;
    
    // Call OpenAI API for clause suggestions
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });
    
    // Extract and return the suggestions
    const suggestions = JSON.parse(response.choices[0].message.content);
    
    return {
      clauseId,
      clauseTitle: clause.title,
      originalContent: clause.content,
      suggestions
    };
  } catch (error) {
    logger.error(`Error generating clause improvements: ${error.message}`, error);
    throw error;
  }
}

/**
 * Identify missing clauses in a contract by type
 */
export async function identifyMissingClauses(contractId: number, userId: number) {
  try {
    // Get the contract
    const contract = await contractService.getContractById(contractId);
    
    if (!contract) {
      throw new Error('Contract not found');
    }
    
    // Check if user has access to the contract
    if (contract.userId !== userId) {
      throw new Error('User does not have access to this contract');
    }
    
    logger.info(`Identifying missing clauses for contract ${contractId}`);
    
    // Create prompt for missing clauses identification
    const prompt = `
    You are an expert legal AI assistant specializing in Indian contract law. Review this ${contract.type} contract titled "${contract.title}" with jurisdiction in ${contract.jurisdiction}.
    
    CONTRACT CONTENT:
    ${contract.content}
    
    EXISTING CLAUSE TITLES:
    ${contract.clauses.map(c => c.title).join('\n')}
    
    Identify important clauses that are missing from this contract based on best practices for ${contract.type} contracts in India.
    
    Format your response as a JSON object with the following structure:
    {
      "missingClauses": [
        {
          "title": "Clause Title",
          "importance": "critical|important|recommended",
          "description": "Brief explanation of why this clause is needed",
          "sampleContent": "Sample clause language that could be added"
        }
      ]
    }
    `;
    
    // Call OpenAI API for missing clauses
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });
    
    // Extract and return the missing clauses
    const missingClauses = JSON.parse(response.choices[0].message.content);
    
    return {
      contractId,
      contractType: contract.type,
      ...missingClauses
    };
  } catch (error) {
    logger.error(`Error identifying missing clauses: ${error.message}`, error);
    throw error;
  }
}

/**
 * Assess contract compliance with specific Indian laws or regulations
 */
export async function assessComplianceWithIndianLaw(contractId: number, userId: number, specificLaws?: string[]) {
  try {
    // Get the contract
    const contract = await contractService.getContractById(contractId);
    
    if (!contract) {
      throw new Error('Contract not found');
    }
    
    // Check if user has access to the contract
    if (contract.userId !== userId) {
      throw new Error('User does not have access to this contract');
    }
    
    logger.info(`Assessing compliance with Indian laws for contract ${contractId}`);
    
    // Create prompt for compliance assessment
    const lawsToCheck = specificLaws && specificLaws.length > 0 
      ? specificLaws.join(', ') 
      : 'Indian Contract Act, 1872; Specific Relief Act, 1963; Information Technology Act, 2000';
    
    const prompt = `
    You are an expert legal AI assistant specializing in Indian contract law. Assess the compliance of this ${contract.type} contract with Indian legal requirements, specifically focusing on ${lawsToCheck}.
    
    CONTRACT CONTENT:
    ${contract.content}
    
    Analyze this contract for compliance with relevant Indian laws. Assess whether the terms and conditions are enforceable under Indian law and identify any areas of non-compliance or legal risk.
    
    Format your response as a JSON object with the following structure:
    {
      "complianceScore": A number from 1-100 representing overall compliance,
      "compliantWithIndianLaw": true/false,
      "lawSpecificCompliance": [
        {
          "law": "Name of law",
          "isCompliant": true/false,
          "issues": ["Description of any compliance issues"],
          "suggestions": ["Recommendations to address issues"]
        }
      ],
      "overallAssessment": "Summary of compliance status",
      "keyConcerns": ["Major compliance issues if any"]
    }
    `;
    
    // Call OpenAI API for compliance assessment
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });
    
    // Extract and return the compliance assessment
    const complianceAssessment = JSON.parse(response.choices[0].message.content);
    
    return {
      contractId,
      contractType: contract.type,
      ...complianceAssessment
    };
  } catch (error) {
    logger.error(`Error assessing compliance: ${error.message}`, error);
    throw error;
  }
}