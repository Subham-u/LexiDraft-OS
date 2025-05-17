/**
 * AI service controllers
 */
import { createLogger } from '../../../shared/utils/logger';
import { ApiError } from '../../../shared/middleware/error';
import { config } from './config';
import { storage } from '../../../storage';
import { AIMessage } from '../../../shared/schema';

const logger = createLogger('ai-service-controllers');

// Import OpenAI or create an abstraction over it
const openaiClient = {
  async createChatCompletion(messages: any[], options: any = {}) {
    // Check if OpenAI key is available
    if (!config.openai.apiKey) {
      logger.error('OpenAI API key not found');
      throw ApiError.internal('OpenAI API key not configured', 'openai_key_missing');
    }
    
    try {
      // This would use the actual OpenAI client in production
      // For now, return a simulated response for development
      const model = options.model || config.openai.model;
      const maxTokens = options.max_tokens || config.openai.maxTokens;
      
      // Simple simulation based on prompt content
      const userMessage = messages.find(msg => msg.role === 'user')?.content || '';
      let responseContent = '';
      
      if (userMessage.includes('analyze')) {
        responseContent = generateMockContractAnalysis();
      } else if (userMessage.includes('generate')) {
        responseContent = generateMockContract();
      } else if (userMessage.includes('explain')) {
        responseContent = generateMockClauseExplanation();
      } else {
        responseContent = 'I understand your question. As LexiAI, I\'m here to help with contract-related inquiries. Could you provide more details about what you\'re looking for?';
      }
      
      return {
        choices: [{
          message: {
            role: 'assistant',
            content: responseContent
          }
        }]
      };
      
    } catch (error) {
      logger.error('Error calling OpenAI', { error });
      throw ApiError.internal('Failed to process AI request', 'openai_error');
    }
  }
};

function generateMockContractAnalysis() {
  return `# Contract Analysis

## Overview
This contract appears to be a service agreement between two parties. It covers standard terms and conditions for service provision in India.

## Key Clauses
1. **Scope of Services**: Clearly defined and comprehensive
2. **Payment Terms**: Net 30 payment structure with detailed invoicing requirements
3. **Termination**: 30-day notice period for both parties
4. **Confidentiality**: Standard but lacks specific data protection provisions

## Risks and Ambiguities
- The intellectual property rights clause does not clearly specify ownership of derivative works
- The liability limitation clause may not be enforceable under Indian Contract Act in its current form
- Dispute resolution section does not specify jurisdiction clearly

## Recommendations
- Add specific data protection provisions to comply with pending Indian data protection laws
- Clarify intellectual property rights regarding derivative works
- Specify jurisdiction and governing law explicitly
- Consider adding force majeure clause with specific reference to pandemic situations

## Compliance Check
- The contract generally complies with Indian Contract Act, 1872
- Additional provisions needed for IT/data-related compliances
- Digital signature provisions should reference IT Act, 2000

## Overall Assessment
This contract provides a solid foundation but requires specific revisions to strengthen legal protection and compliance with Indian laws.`;
}

function generateMockContract() {
  return `# SERVICE AGREEMENT

THIS SERVICE AGREEMENT ("Agreement") is made on this [Date], by and between:

**[Client Name]**, a company incorporated under the Companies Act, 2013, having its registered office at [Client Address] (hereinafter referred to as the "Client"); and

**[Service Provider Name]**, a company incorporated under the Companies Act, 2013, having its registered office at [Service Provider Address] (hereinafter referred to as the "Service Provider").

The Client and Service Provider are hereinafter individually referred to as a "Party" and collectively as the "Parties".

## 1. SCOPE OF SERVICES

1.1 The Service Provider agrees to provide the services ("Services") as described in Schedule A attached hereto.

1.2 Any additional services not specified in Schedule A shall be negotiated and agreed upon in writing by both Parties.

## 2. TERM

2.1 This Agreement shall commence on [Start Date] and shall continue until [End Date], unless terminated earlier in accordance with the provisions of this Agreement ("Term").

## 3. PAYMENT TERMS

3.1 In consideration of the Services, the Client shall pay the Service Provider the fees as set out in Schedule B attached hereto.

3.2 The Service Provider shall issue invoices on a monthly basis, and the Client shall make payment within thirty (30) days of receipt of a valid invoice.

3.3 All amounts payable under this Agreement are exclusive of GST, which shall be charged additionally as applicable.

## 4. CONFIDENTIALITY

4.1 Each Party acknowledges that during the Term, it may have access to confidential information of the other Party. Each Party agrees to maintain the confidentiality of such information and not to disclose it to any third party without prior written consent.

## 5. INTELLECTUAL PROPERTY RIGHTS

5.1 All pre-existing intellectual property rights remain the property of the originating Party.

5.2 All intellectual property rights specifically created for the Client as part of the Services shall vest in the Client upon payment of all fees due.

## 6. TERMINATION

6.1 Either Party may terminate this Agreement by giving thirty (30) days' written notice to the other Party.

6.2 Either Party may terminate this Agreement with immediate effect by written notice if the other Party commits a material breach which is incapable of remedy or which is not remedied within fourteen (14) days of written notice.

## 7. LIMITATION OF LIABILITY

7.1 Neither Party shall be liable for any indirect, incidental, special, consequential, or punitive damages.

7.2 The total liability of either Party under this Agreement shall not exceed the total amount paid or payable by the Client to the Service Provider in the twelve (12) months preceding the event giving rise to the claim.

## 8. DISPUTE RESOLUTION

8.1 Any dispute arising out of or in connection with this Agreement shall first be resolved through good faith negotiations between the Parties.

8.2 If the dispute cannot be resolved through negotiations within thirty (30) days, it shall be referred to arbitration under the Arbitration and Conciliation Act, 1996. The arbitration shall be conducted in [City], India, in the English language.

## 9. GOVERNING LAW

9.1 This Agreement shall be governed by and construed in accordance with the laws of India.

## 10. FORCE MAJEURE

10.1 Neither Party shall be liable for any failure or delay in performance due to circumstances beyond its reasonable control, including but not limited to acts of God, natural disasters, pandemic, epidemic, government actions, war, terrorism, or labor disputes.

## 11. MISCELLANEOUS

11.1 This Agreement constitutes the entire understanding between the Parties and supersedes all prior agreements, understandings, or arrangements.

11.2 No amendment to this Agreement shall be effective unless it is in writing and signed by both Parties.

11.3 Any notice under this Agreement shall be in writing and delivered by hand, registered mail, or email to the address of the Party as set out in this Agreement.

IN WITNESS WHEREOF, the Parties have executed this Agreement as of the date first above written.

For and on behalf of [Client Name]:
_________________________
Name:
Designation:

For and on behalf of [Service Provider Name]:
_________________________
Name:
Designation:

**SCHEDULE A - SCOPE OF SERVICES**
[Detailed description of services to be provided]

**SCHEDULE B - PAYMENT TERMS**
[Detailed payment terms, rates, and schedule]`;
}

function generateMockClauseExplanation() {
  return `# Explanation: Limitation of Liability Clause

## What It Means in Simple Terms
This clause puts a cap on how much money each party would have to pay if something goes wrong. It says that:
1. Neither party will be responsible for "indirect damages" (losses that aren't directly caused by the breach)
2. The maximum amount either party would have to pay is limited to the total amount of money that changed hands in the last 12 months

## Practical Implications
- **For the client**: If the service provider makes a mistake that causes the client to lose business opportunities or reputation, the client can only recover a limited amount, regardless of how big the actual loss is
- **For the service provider**: This provides financial certainty - they know the maximum amount they would have to pay if something goes wrong

## Important Considerations
- Courts in India may not always enforce these limitations, especially if:
  - There's gross negligence or willful misconduct
  - The limitation is considered unreasonably low compared to the potential harm
  - Consumer protection laws apply (if the client is an individual consumer)

## Why This Clause Exists
This clause exists to:
- Provide financial predictability for both parties
- Prevent potentially ruinous liability claims
- Allocate risk in a way that's usually considered fair in business relationships

## Context in Indian Law
Under the Indian Contract Act, 1872, limitations of liability are generally enforceable between businesses, but courts can invalidate them if they find them to be unfair, unreasonable, or against public policy. The specific interpretation can vary depending on the nature of the services and the relative bargaining power of the parties.`;
}

export const aiControllers = {
  // Analyze a contract for risks and opportunities
  analyzeContract: async (contractId: number, userId: number) => {
    try {
      // Get the contract from storage
      const contract = await storage.getContract(contractId);
      
      if (!contract) {
        throw ApiError.notFound('Contract not found');
      }
      
      // Check if user has access to this contract
      if (contract.userId !== userId) {
        throw ApiError.forbidden('You do not have permission to access this contract');
      }
      
      // Prepare the prompt for OpenAI
      const messages = [
        {
          role: 'system',
          content: config.systemPrompts.contractAnalysis
        },
        {
          role: 'user',
          content: `Please analyze the following contract:\n\n${contract.content}`
        }
      ];
      
      // Call OpenAI
      const response = await openaiClient.createChatCompletion(messages, {
        model: config.openai.model,
        max_tokens: config.openai.maxTokens,
        temperature: 0.2 // Lower temperature for more factual analysis
      });
      
      const analysisContent = response.choices[0].message.content;
      
      // Store the analysis result (optional)
      // This could be added to a new table in the database
      
      return {
        success: true,
        data: {
          contractId,
          analysis: analysisContent,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error(`Error analyzing contract ${contractId}`, { error });
      throw error;
    }
  },
  
  // Generate a contract based on user parameters
  generateContract: async (userId: number, contractType: string, parameters: any) => {
    try {
      // Prepare the prompt for OpenAI
      const messages = [
        {
          role: 'system',
          content: config.systemPrompts.contractGeneration
        },
        {
          role: 'user',
          content: `Please generate a ${contractType} contract with the following details:\n${JSON.stringify(parameters, null, 2)}`
        }
      ];
      
      // Call OpenAI
      const response = await openaiClient.createChatCompletion(messages, {
        model: config.openai.model,
        max_tokens: config.openai.maxTokens,
        temperature: 0.4 // Moderate temperature for creative but structured output
      });
      
      const contractContent = response.choices[0].message.content;
      
      // Create a new contract in the database
      const newContract = await storage.createContract({
        userId,
        title: `${contractType} - ${new Date().toLocaleDateString()}`,
        content: contractContent,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        type: contractType,
        parties: parameters.parties || [],
        metadata: {}
      });
      
      return {
        success: true,
        data: newContract
      };
    } catch (error) {
      logger.error(`Error generating ${contractType} contract`, { error });
      throw error;
    }
  },
  
  // Explain a specific clause
  explainClause: async (clause: string) => {
    try {
      // Prepare the prompt for OpenAI
      const messages = [
        {
          role: 'system',
          content: config.systemPrompts.clauseExplanation
        },
        {
          role: 'user',
          content: `Please explain the following contract clause in simple terms:\n\n${clause}`
        }
      ];
      
      // Call OpenAI
      const response = await openaiClient.createChatCompletion(messages, {
        model: config.openai.model,
        max_tokens: config.openai.maxTokens,
        temperature: 0.3 // Lower temperature for more factual explanations
      });
      
      const explanation = response.choices[0].message.content;
      
      return {
        success: true,
        data: {
          clause,
          explanation,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Error explaining clause', { error });
      throw error;
    }
  },
  
  // Chat with the AI about legal topics
  chat: async (userId: number, message: string, conversationId?: number) => {
    try {
      let conversation;
      let messages: AIMessage[] = [];
      
      // If conversationId is provided, get the existing conversation
      if (conversationId) {
        conversation = await storage.getConversation(conversationId);
        
        if (!conversation) {
          throw ApiError.notFound('Conversation not found');
        }
        
        // Check if user has access to this conversation
        if (conversation.userId !== userId) {
          throw ApiError.forbidden('You do not have permission to access this conversation');
        }
        
        messages = conversation.messages || [];
      }
      
      // Prepare messages for OpenAI
      const promptMessages = [
        {
          role: 'system',
          content: 'You are LexiAI, a legal assistant specializing in Indian contract law and legal documentation. You provide helpful, accurate information while being clear that you are not providing legal advice.'
        },
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: 'user',
          content: message
        }
      ];
      
      // Call OpenAI
      const response = await openaiClient.createChatCompletion(promptMessages, {
        model: config.openai.model,
        max_tokens: config.openai.maxTokens,
        temperature: 0.7 // Higher temperature for more conversational responses
      });
      
      const aiResponse = response.choices[0].message.content;
      
      // Add messages to the conversation history
      messages.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      });
      
      messages.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      });
      
      // If it's a new conversation, create it in the database
      if (!conversationId) {
        conversation = await storage.createConversation({
          userId,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
          messages,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        // Otherwise, update the existing conversation
        conversation = await storage.updateConversation(conversationId, {
          messages,
          updatedAt: new Date().toISOString()
        });
      }
      
      return {
        success: true,
        data: {
          conversationId: conversation!.id,
          message: aiResponse,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Error in AI chat', { error });
      throw error;
    }
  },
  
  // Get service status
  getStatus: () => {
    return {
      success: true,
      service: 'ai-service',
      version: config.version,
      status: 'operational',
      features: config.features,
      timestamp: new Date().toISOString()
    };
  }
};