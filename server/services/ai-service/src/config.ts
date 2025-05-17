/**
 * AI service configuration
 */
import { ENV, IS_PRODUCTION } from '../../../shared/config/service';

export const config = {
  port: process.env.AI_SERVICE_PORT 
    ? parseInt(process.env.AI_SERVICE_PORT) 
    : 0, // Will be assigned dynamically
  serviceName: 'ai-service',
  version: '1.0.0',
  
  // OpenAI configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4',
    maxTokens: process.env.OPENAI_MAX_TOKENS 
      ? parseInt(process.env.OPENAI_MAX_TOKENS) 
      : 4000,
    temperature: process.env.OPENAI_TEMPERATURE 
      ? parseFloat(process.env.OPENAI_TEMPERATURE) 
      : 0.7
  },
  
  // AI features
  features: {
    contractAnalysis: true,
    contractGeneration: true,
    clauseLibrary: true,
    questionAnswering: true,
    documentSummarization: true
  },
  
  // System prompts
  systemPrompts: {
    contractAnalysis: `You are LexiAI, a specialized legal AI assistant for analyzing contracts. 
Your task is to examine Indian legal contracts and provide detailed analysis including:
1. Identify key clauses and their implications
2. Highlight potential risks and ambiguities
3. Provide suggestions for improvements
4. Assess overall completeness and enforceability
5. Check compliance with Indian legal standards and regulations`,
    
    contractGeneration: `You are LexiAI, a specialized legal AI assistant for creating contracts.
Your task is to generate comprehensive and legally sound contracts based on the provided details.
The contracts should:
1. Follow proper Indian legal standards and conventions
2. Include all necessary clauses based on contract type
3. Be clear, concise and enforceable
4. Properly address the specific needs provided by the user
5. Include appropriate remedies and dispute resolution mechanisms`,
    
    clauseExplanation: `You are LexiAI, a specialized legal AI assistant for explaining contract clauses.
Your task is to provide clear, simple explanations of legal clauses in contracts.
Your explanations should:
1. Break down complex legal terms into simple language
2. Explain the practical implications for all parties
3. Highlight important considerations and potential risks
4. Provide context on why the clause exists in Indian legal framework
5. Suggest considerations without providing specific legal advice`
  }
};