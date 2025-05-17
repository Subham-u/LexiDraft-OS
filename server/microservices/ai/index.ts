import express, { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth';
import { storage } from '../../storage';
import { analyzeClause, generateCompletions } from '../../services/openaiService';
import { OPENAI_CONFIG } from '../../shared/config';

// Create router for AI service microservice
const aiRouter: Router = express.Router();

// Apply authentication to all AI routes
aiRouter.use(authenticate);

// Analyze a contract clause
aiRouter.post('/analyze-clause', async (req, res) => {
  try {
    const { clause } = req.body;
    
    if (!clause || typeof clause !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Clause text is required'
      });
    }
    
    // Call the OpenAI service to analyze the clause
    const analysis = await analyzeClause(clause);
    
    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Error analyzing clause:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to analyze clause'
    });
  }
});

// Analyze multiple contracts for dashboard insights
aiRouter.post('/analyze-contracts', async (req, res) => {
  try {
    const { contractIds } = req.body;
    
    if (!contractIds || !Array.isArray(contractIds)) {
      return res.status(400).json({
        success: false,
        message: 'Contract IDs are required'
      });
    }
    
    // Get the contracts from storage
    const contracts = await Promise.all(
      contractIds.map(async (id) => await storage.getContract(id))
    );
    
    // Filter out any null values (contracts not found)
    const validContracts = contracts.filter(Boolean);
    
    if (validContracts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid contracts found'
      });
    }
    
    // If OpenAI is not available, return a placeholder response
    if (!OPENAI_CONFIG.available) {
      return res.json({
        success: true,
        risks: [
          { level: 'info', message: 'AI analysis service is currently unavailable' }
        ],
        insights: [
          { 
            title: 'Basic Analysis', 
            description: `You have ${validContracts.length} contracts in your account` 
          }
        ]
      });
    }
    
    // Generate insights based on contracts
    // This would normally call a more sophisticated analysis function
    // For now, we'll generate a simple analysis
    const risks = [];
    const insights = [];
    
    // Check for draft contracts
    const drafts = validContracts.filter(c => c.status === 'draft');
    if (drafts.length > 0) {
      risks.push({
        level: 'warning',
        message: `You have ${drafts.length} contracts in draft status that need attention`
      });
    }
    
    // Check for expired contracts
    const expired = validContracts.filter(c => c.status === 'expired');
    if (expired.length > 0) {
      risks.push({
        level: 'high',
        message: `You have ${expired.length} expired contracts that may need renewal`
      });
    }
    
    // Group contracts by type
    const typeCount: Record<string, number> = {};
    validContracts.forEach(contract => {
      if (contract.type) {
        typeCount[contract.type] = (typeCount[contract.type] || 0) + 1;
      }
    });
    
    // Add insights based on contract types
    Object.entries(typeCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach(([type, count]) => {
        insights.push({
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} Contracts`,
          description: `You have ${count} ${type} contracts in your portfolio`
        });
      });
    
    // Add general insight
    insights.push({
      title: 'Contract Portfolio',
      description: `Your contract portfolio consists of ${validContracts.length} contracts across ${Object.keys(typeCount).length} different types`
    });
    
    res.json({
      success: true,
      risks,
      insights
    });
  } catch (error) {
    console.error('Error analyzing contracts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze contracts'
    });
  }
});

// Chat with the legal AI assistant
aiRouter.post('/chat', async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }
    
    // If there's a conversation ID, update the existing conversation
    let conversation;
    if (conversationId) {
      conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }
      
      if (conversation.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this conversation'
        });
      }
    }
    
    // If OpenAI is not available, return a placeholder response
    if (!OPENAI_CONFIG.available) {
      return res.json({
        success: true,
        response: "I'm sorry, the AI assistant is currently unavailable. Please try again later."
      });
    }
    
    const messages = conversation ? conversation.messages : [];
    
    // Add user message to conversation
    messages.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });
    
    // Generate AI response
    const prompt = `User's message: ${message}`;
    let response = "";
    
    try {
      // Call OpenAI to generate a completion
      const aiResponse = await generateCompletions(prompt, messages);
      response = aiResponse || "I apologize, but I couldn't generate a response at this time.";
    } catch (aiError) {
      console.error('AI generation error:', aiError);
      response = "I'm sorry, I'm having trouble processing your request right now.";
    }
    
    // Add assistant message to conversation
    messages.push({
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString()
    });
    
    // Save or update the conversation
    if (conversation) {
      conversation = await storage.updateConversation(conversationId, {
        messages
      });
    } else {
      conversation = await storage.createConversation({
        userId: req.user.id,
        title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
        messages
      });
    }
    
    res.json({
      success: true,
      response,
      conversationId: conversation.id
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process chat message'
    });
  }
});

// Get AI service status
aiRouter.get('/status', (req, res) => {
  res.json({
    success: true,
    service: 'ai',
    available: OPENAI_CONFIG.available,
    model: OPENAI_CONFIG.defaultModel,
    message: OPENAI_CONFIG.available 
      ? 'AI service is operational' 
      : 'AI service is unavailable'
  });
});

export default aiRouter;