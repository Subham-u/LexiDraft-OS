/**
 * OpenAI Service for LexiDraft
 * Provides AI-powered functionality for contracts and legal analysis
 */

import OpenAI from "openai";
import { OPENAI_CONFIG } from "../shared/config";
import { createLogger } from "../shared/utils/logger";

// Create logger
const logger = createLogger('openai-service');

// Initialize OpenAI client
let openai: OpenAI | null = null;

try {
  if (OPENAI_CONFIG.available) {
    openai = new OpenAI({ apiKey: OPENAI_CONFIG.apiKey });
    logger.info("OpenAI client initialized successfully");
  } else {
    logger.warn("OpenAI API key not provided, service will be unavailable");
  }
} catch (error) {
  logger.error("Failed to initialize OpenAI client", { error });
}

/**
 * Generate text completions using OpenAI
 * @param prompt The text prompt
 * @param previousMessages Previous messages in the conversation
 * @returns The generated text or an error message
 */
export async function generateCompletions(
  prompt: string,
  previousMessages: { role: string; content: string }[] = []
): Promise<string> {
  try {
    if (!openai) {
      logger.warn("OpenAI client not available for text generation");
      throw new Error("AI service unavailable. Please try again later.");
    }
    
    // Format previous messages for the API
    const messages = [
      {
        role: "system",
        content: `You are Lexi, a premium legal AI assistant specializing in Indian law.
        
        Your guidelines:
        1. Provide accurate, helpful legal information specific to Indian law
        2. Maintain a professional, confident tone
        3. When uncertain, clarify that you're providing general information and not legal advice
        4. Do not answer questions outside the legal domain
        5. Include relevant Indian legal statutes and case references when appropriate`
      },
      ...previousMessages.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      })),
      {
        role: "user",
        content: prompt
      }
    ];

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.7,
      max_tokens: 1000
    });

    return response.choices[0].message.content || "I'm unable to provide a response at this time.";
  } catch (error) {
    logger.error("Error generating completions:", { error });
    
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        throw new Error("AI service configuration issue. Please contact support.");
      }
      if (error.message.includes("timeout") || error.message.includes("network")) {
        throw new Error("Network error occurred. Please check your connection and try again.");
      }
      if (error.message.includes("rate limit")) {
        throw new Error("AI service is experiencing high demand. Please try again in a few minutes.");
      }
    }
    
    throw new Error("Unable to generate text response. Please try again later.");
  }
}

/**
 * Analyze contract data to find risks and insights
 * @param contracts Array of contracts to analyze
 * @returns Analysis results with risks and insights
 */
export async function analyzeContract(contracts: any[]): Promise<{
  risks: { level: string; message: string }[];
  insights: { title: string; description: string }[];
}> {
  try {
    if (!openai) {
      logger.warn("OpenAI client not available for contract analysis");
      return {
        risks: [
          { level: "info", message: "AI analysis service is currently unavailable." }
        ],
        insights: [
          { title: "Service Status", description: "Contract analysis is temporarily unavailable." }
        ]
      };
    }
    
    if (contracts.length === 0) {
      return {
        risks: [],
        insights: [
          { title: "No Contracts", description: "You have no contracts to analyze yet." }
        ]
      };
    }
    
    // Prepare the data for analysis
    const contractSummary = contracts.map(c => ({
      id: c.id,
      title: c.title,
      type: c.type,
      status: c.status,
      createdAt: c.createdAt
    }));
    
    // Prepare the prompt for OpenAI
    const prompt = `
      Analyze the following contract portfolio data and identify:
      1. Key risks that should be addressed
      2. Important insights about the portfolio
      
      Contract portfolio: ${JSON.stringify(contractSummary)}
      
      Format your response as JSON with these keys:
      - risks: array of objects with "level" (high, medium, low, info) and "message" fields
      - insights: array of objects with "title" and "description" fields
    `;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a legal contract analysis expert specializing in Indian contract law."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 1500
    });

    const content = response.choices[0].message.content;
    
    if (!content) {
      throw new Error("No content in response");
    }
    
    try {
      const analysis = JSON.parse(content);
      return {
        risks: Array.isArray(analysis.risks) ? analysis.risks : [],
        insights: Array.isArray(analysis.insights) ? analysis.insights : []
      };
    } catch (parseError) {
      logger.error("Error parsing JSON response:", { error: parseError });
      return {
        risks: [
          { level: "info", message: "Error processing analysis results." }
        ],
        insights: [
          { title: "Basic Summary", description: `You have ${contracts.length} contracts in your portfolio.` }
        ]
      };
    }
  } catch (error) {
    logger.error("Error analyzing contracts:", { error });
    
    return {
      risks: [
        { level: "info", message: "Failed to complete contract analysis." }
      ],
      insights: [
        { title: "Portfolio Size", description: `Your portfolio contains ${contracts.length} contracts.` }
      ]
    };
  }
}

/**
 * Generate a contract based on parameters
 */
export async function generateContract(
  type: string,
  parties: { name: string; role: string }[],
  jurisdiction: string,
  requirements: string
): Promise<string> {
  try {
    // Check if OpenAI client is available
    if (!openai) {
      logger.warn("OpenAI client not available for contract generation");
      throw new Error("AI service unavailable. Please try again later.");
    }
    
    // Format the parties for the prompt
    const partiesText = parties.map(p => `${p.name} (${p.role})`).join(", ");
    
    // Map contract types to relevant Indian laws
    const indianLawReferences = {
      nda: "Indian Contract Act, 1872 and the Information Technology Act, 2000",
      freelance: "Indian Contract Act, 1872 and the Copyright Act, 1957",
      employment: "Indian Contract Act, 1872, Industrial Disputes Act, 1947, and the Shops and Establishments Act",
      founder: "Indian Contract Act, 1872, Companies Act, 2013, and Limited Liability Partnership Act, 2008",
      lease: "Indian Contract Act, 1872, Transfer of Property Act, 1882, and the Rent Control Act of the specific state",
      other: "Indian Contract Act, 1872 and other applicable sectoral laws"
    };
    
    // Get the specific laws that apply to this contract type
    const applicableLaws = indianLawReferences[type as keyof typeof indianLawReferences] || indianLawReferences.other;
    
    // Build regional context based on jurisdiction
    let regionalContext = "";
    if (jurisdiction.toLowerCase() !== "india") {
      // Provide state-specific legal context if a state is specified
      regionalContext = `
        Include specific provisions that comply with ${jurisdiction} state laws in addition to central Indian laws.
        Consider local regulations and precedents from the ${jurisdiction} High Court when applicable.
      `;
    }
    
    // Prepare the enhanced prompt for OpenAI
    const prompt = `
      Generate a comprehensive and legally sound ${type} contract for the following parties: ${partiesText}.
      
      The contract must be valid under Indian law, specifically complying with ${applicableLaws}.
      ${regionalContext}
      
      Additional requirements: ${requirements || "Standard terms that protect both parties adequately."}
      
      The contract should include ALL of the following:
      1. A clear preamble with date, parties, and purpose of the agreement
      2. Precise definitions of all key terms
      3. Detailed scope of work/services/obligations with measurable deliverables
      4. Clear payment terms, including amounts, schedule, and late payment consequences
      5. Intellectual property rights provisions
      6. Confidentiality clauses
      7. Term and termination conditions
      8. Dispute resolution mechanism (preferably arbitration in India)
      9. Force majeure clause covering unexpected events
      10. Applicable law and jurisdiction statement
      11. Severability and waiver clauses
      12. Amendment procedures
      13. Complete signature block
      
      Format the output as a professional, well-structured legal document with proper clause numbering and hierarchical organization.
      Use formal but clear language that would be admissible in Indian courts.
      
      For each major clause, provide a brief explanation in [square brackets] that helps the parties understand its legal implications in simple terms.
    `;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a senior legal expert specializing in Indian contract law with 15+ years of experience drafting contracts for the Indian market.
          
          Your expertise includes:
          - Comprehensive knowledge of the Indian Contract Act, 1872
          - Familiarity with industry-specific regulations across India
          - Understanding of state-specific legal variations
          - Ability to draft contracts that protect client interests while remaining fair and enforceable
          
          Create professional, precise, and legally sound contracts tailored to Indian legal requirements and business practices.
          Include all necessary standard clauses that would be expected in this type of agreement under Indian law.
          Format the contract in a clean, professional structure with proper numbering and hierarchy.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });

    return response.choices[0].message.content || "Unable to generate contract content.";
  } catch (error) {
    logger.error("Error generating contract:", { error });
    
    // Provide more user-friendly error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes("API service unavailable")) {
        throw new Error("AI service is currently unavailable. Please try again later.");
      } else if (error.message.includes("API key")) {
        throw new Error("Contract generation service is experiencing technical issues. Please contact support.");
      } else if (error.message.includes("timeout") || error.message.includes("network")) {
        throw new Error("Network error while generating contract. Please check your connection and try again.");
      } else if (error.message.includes("rate limit")) {
        throw new Error("Service is experiencing high demand. Please try again in a few minutes.");
      }
    }
    
    throw new Error("Failed to generate contract. Our team has been notified of this issue.");
  }
}

/**
 * Analyze a contract clause
 */
export async function analyzeClause(clause: string): Promise<{
  explanation: string;
  suggestions: string[];
  legalContext: string;
}> {
  try {
    // Check if OpenAI client is available
    if (!openai) {
      logger.warn("OpenAI client not available for clause analysis");
      return {
        explanation: "The clause analysis service is currently unavailable. Please try again later.",
        suggestions: ["Try again later when the service is available."],
        legalContext: "Unable to provide legal context at this time."
      };
    }
    
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a legal expert specializing in Indian contract law. 
          Analyze the following contract clause and provide:
          1. A clear explanation in simple terms
          2. Suggestions for improvements or alternative phrasings
          3. Relevant legal context under Indian law
          Format your response as JSON with keys: explanation, suggestions (as an array), and legalContext.`
        },
        {
          role: "user",
          content: clause
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1000
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }

    try {
      const parsed = JSON.parse(content);
      return {
        explanation: parsed.explanation || "No explanation provided.",
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
        legalContext: parsed.legalContext || "No legal context provided."
      };
    } catch (parseError) {
      logger.error("Error parsing JSON response:", { error: parseError });
      return {
        explanation: "Unable to parse the analysis response from the AI service.",
        suggestions: ["Try submitting a clearer or more complete clause."],
        legalContext: "Analysis processing error occurred."
      };
    }
  } catch (error) {
    logger.error("Error analyzing clause:", { error });
    
    // Provide appropriate error message based on error type
    let explanation = "An error occurred while analyzing the clause.";
    let suggestions = ["Try again later."];
    let legalContext = "Service unavailable.";
    
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        explanation = "The clause analysis service is experiencing configuration issues.";
        suggestions = ["Please contact support if this problem persists."];
      } else if (error.message.includes("timeout") || error.message.includes("network")) {
        explanation = "A network error occurred while analyzing the clause.";
        suggestions = ["Check your internet connection and try again."];
      } else if (error.message.includes("rate limit")) {
        explanation = "The service is currently experiencing high demand.";
        suggestions = ["Please try again in a few minutes."];
      }
    }
    
    return { explanation, suggestions, legalContext };
  }
}