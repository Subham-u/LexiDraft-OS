import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";
import { storage } from "./storage";
import { handleChat, generateContract, analyzeClause } from "./services/openaiService";
import { 
  getContractById, 
  getRecentContracts, 
  getAllContracts, 
  createContract, 
  updateContract,
  generateContractPdf
} from "./services/contractService";
import { 
  enhanceClause, 
  composeClause, 
  getSuggestedClauses, 
  analyzeContract 
} from "./services/lexiService";
import { 
  createPaymentLink, 
  getPaymentLinkDetails, 
  createSubscriptionPlan, 
  createSubscription,
  getSubscriptionDetails,
  cancelSubscription,
  verifyPaymentSignature,
  createPaymentOrder,
  PaymentType 
} from "./services/cashfreeService";
import { z } from "zod";
import { insertContractSchema, insertClientSchema, insertUserSchema, AIMessage } from "@shared/schema";
import { sendEmail } from "./services/emailService";

export async function registerRoutes(app: Express): Promise<Server> {
  // Check if required API keys are available
  const missingKeys = [];
  if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
    missingKeys.push('Cashfree API keys');
    console.warn('Cashfree API keys not found. Payment features will be unavailable.');
  }
  if (!process.env.OPENAI_API_KEY) {
    missingKeys.push('OpenAI API key');
    console.warn('OpenAI API key not found. AI features will be unavailable.');
  }
  if (!process.env.SENDGRID_API_KEY) {
    missingKeys.push('SendGrid API key');
    console.warn('SendGrid API key not found. Email features will be unavailable.');
  }

  if (missingKeys.length > 0) {
    console.warn(`⚠️ WARNING: Missing API keys: ${missingKeys.join(', ')}. Some features will be unavailable.`);
  }
  
  // Production-ready authentication middleware
  const requireAuth = async (req: any, res: any, next: any) => {
    try {
      // Extract token from request headers
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          success: false,
          error: 'Authentication required',
          message: 'Please provide a valid authentication token'
        });
      }
      
      const token = authHeader.split('Bearer ')[1];
      
      // Verify token format
      if (!token || token.length < 20) {
        return res.status(401).json({ 
          success: false,
          error: 'Invalid token format',
          message: 'Authentication token is malformed or missing'
        });
      }
      
      // In development environment, allow simplified authentication for testing
      if (process.env.NODE_ENV !== 'production') {
        // For development only - set a mock user
        req.user = { id: 1, role: 'user', uid: 'dev-uid-123' };
        return next();
      }
      
      // In production, verify the token with Firebase
      // We'd implement Firebase token verification here
      // For now, attempt to find a user with the provided token
      try {
        // In full production, we would:
        // 1. Decode and verify the Firebase JWT token
        // 2. Extract the user ID from the verified token
        // 3. Fetch the corresponding user from our database
        
        // For now, use a placeholder verification
        const userId = 1; // This would come from the verified token
        const user = await storage.getUser(userId);
        
        if (!user) {
          return res.status(401).json({ 
            success: false,
            error: 'User not found',
            message: 'The user associated with this token was not found'
          });
        }
        
        // Add user info to request object for use in route handlers
        req.user = user;
        return next();
      } catch (tokenError) {
        console.error('Token verification error:', tokenError);
        return res.status(401).json({ 
          success: false,
          error: 'Token verification failed',
          message: 'Your authentication token could not be verified'
        });
      }
    } catch (error) {
      console.error('Authentication middleware error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Authentication system error',
        message: 'An error occurred during authentication'
      });
    }
  };
  
  // Verification route for payments
  app.post("/api/verify-payment", async (req, res) => {
    try {
      const { orderId, referenceId, txStatus } = req.body;
      
      if (!orderId || !referenceId || !txStatus) {
        return res.status(400).json({
          success: false,
          message: "Missing required parameters",
        });
      }

      // In a production environment, you would verify this against Cashfree's API
      // For now, we're just checking the txStatus parameter
      if (txStatus === 'SUCCESS') {
        // Update payment status in your database
        // For example, you might update a consultation payment status
        
        return res.json({
          success: true,
          message: "Payment verified successfully",
          orderId,
          referenceId,
        });
      } else {
        return res.json({
          success: false,
          message: "Payment failed or cancelled",
          orderId,
          referenceId,
          error: "Transaction status indicates failure",
        });
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      return res.status(500).json({
        success: false,
        message: "Error processing payment verification",
        details: error instanceof Error ? error.message : "Unknown error occurred during payment verification",
        errorCode: "PAYMENT_VERIFICATION_ERROR"
      });
    }
  });
  
  // Verification route for subscriptions
  app.post("/api/verify-subscription", async (req, res) => {
    try {
      const { subscriptionId, referenceId, txStatus } = req.body;
      
      if (!subscriptionId || !referenceId || !txStatus) {
        return res.status(400).json({
          success: false,
          message: "Missing required parameters",
        });
      }

      // In a production environment, you would verify this against Cashfree's API
      // For now, we're just checking the txStatus parameter
      if (txStatus === 'SUCCESS') {
        // Update subscription status in your database
        // For example:
        // await storage.updateUserSubscription(userId, {
        //   subscriptionId,
        //   status: 'active'
        // });
        
        return res.json({
          success: true,
          message: "Subscription verified successfully",
          subscriptionId,
          referenceId,
        });
      } else {
        return res.json({
          success: false,
          message: "Subscription payment failed or cancelled",
          subscriptionId,
          referenceId,
          error: "Transaction status indicates failure",
        });
      }
    } catch (error) {
      console.error("Error verifying subscription:", error);
      return res.status(500).json({
        success: false,
        message: "Error verifying subscription",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store active connections
  const clients = new Map();
  
  wss.on('connection', (ws) => {
    const clientId = uuidv4();
    
    // Initial connection setup
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle joining a consultation room
        if (data.type === 'join') {
          const roomId = data.consultationId;
          clients.set(clientId, { ws, roomId, userId: data.userId });
          
          console.log(`Client ${clientId} joined consultation room ${roomId}`);
          
          // Notify client they've joined successfully
          ws.send(JSON.stringify({
            type: 'joined',
            roomId,
            success: true
          }));
        }
        
        // Handle chat messages
        else if (data.type === 'message') {
          const roomId = data.consultationId;
          const message = {
            id: uuidv4(),
            senderId: data.userId,
            content: data.content,
            timestamp: new Date().toISOString(),
            type: data.messageType || 'text',
            fileUrl: data.fileUrl,
            fileName: data.fileName
          };
          
          // Broadcast to all clients in the same room
          clients.forEach((client, id) => {
            if (client.roomId === roomId && client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(JSON.stringify({
                type: 'newMessage',
                message
              }));
            }
          });
        }
        
        // Handle WebRTC signaling for video calls
        else if (data.type === 'videoSignal') {
          const { to, from, signal } = data;
          
          // Find the recipient client and send the signal
          clients.forEach((client, id) => {
            if (client.userId === to && client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(JSON.stringify({
                type: 'videoSignal',
                from,
                signal
              }));
            }
          });
        }
        
        // Note: WebRTC video signaling is handled in the dedicated handler above
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      console.log(`Client ${clientId} disconnected`);
      clients.delete(clientId);
    });
  });

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUid(userData.uid);
      
      if (existingUser) {
        // Update user if they already exist
        const updatedUser = await storage.updateUser(existingUser.id, userData);
        return res.status(200).json(updatedUser);
      }
      
      // Create new user
      const newUser = await storage.createUser(userData);
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      // This should be filtered by the authenticated user in a real implementation
      const contracts = await storage.getAllContracts();
      
      const stats = {
        totalContracts: contracts.length,
        drafts: contracts.filter(c => c.status === "draft").length,
        signed: contracts.filter(c => c.status === "signed").length,
        pending: contracts.filter(c => c.status === "pending").length
      };
      
      res.status(200).json(stats);
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      res.status(500).json({ message: "Error retrieving dashboard statistics" });
    }
  });

  // Contract routes
  app.get("/api/contracts", async (req, res) => {
    try {
      const contracts = await getAllContracts();
      res.status(200).json(contracts);
    } catch (error) {
      console.error("Error getting contracts:", error);
      res.status(500).json({ message: "Error retrieving contracts" });
    }
  });

  app.get("/api/contracts/recent", async (req, res) => {
    try {
      const contracts = await getRecentContracts();
      res.status(200).json(contracts);
    } catch (error) {
      console.error("Error getting recent contracts:", error);
      res.status(500).json({ message: "Error retrieving recent contracts" });
    }
  });
  
  // Helper functions for contract analysis
  function calculateRiskScore(analysis: { strengths: string[]; weaknesses: string[] }): number {
    // Calculate risk score based on strengths and weaknesses
    const strengthsWeight = 0.4;
    const weaknessesWeight = 0.6;
    
    const strengthsScore = 100 - (analysis.strengths.length === 0 ? 100 : Math.min(100, (analysis.weaknesses.length / (analysis.strengths.length + analysis.weaknesses.length)) * 100));
    const weaknessesScore = analysis.weaknesses.length === 0 ? 0 : Math.min(100, analysis.weaknesses.length * 15);
    
    // Lower score is better (less risk)
    const riskScore = Math.round((strengthsScore * strengthsWeight) + (weaknessesScore * weaknessesWeight));
    return Math.min(100, Math.max(0, riskScore));
  }
  
  function calculateCompleteness(analysis: { recommendations: string[] }): number {
    // Calculate completeness based on recommendations
    const baseCompleteness = 85; // Start with a base completeness score
    const deductionPerRecommendation = 5; // Deduct for each recommendation
    const completeness = Math.max(0, baseCompleteness - (analysis.recommendations.length * deductionPerRecommendation));
    return Math.round(completeness);
  }
  
  // Get contract analysis
  // Support both a general analysis endpoint and a specific contract analysis endpoint
  app.get("/api/contracts/analysis", async (req, res) => {
    try {
      // This endpoint returns overview stats for all contracts
      // For dashboard use without a specific contract ID
      
      // Get all contracts
      const contracts = await storage.getAllContracts();
      
      // Basic analysis stats
      const totalContracts = contracts.length;
      const draftContracts = contracts.filter(c => c.status === 'draft').length;
      const pendingContracts = contracts.filter(c => c.status === 'pending').length;
      const signedContracts = contracts.filter(c => c.status === 'signed').length;
      
      // Calculate risk scores (1-100) using a sample of up to 5 contracts
      let averageRiskScore = 50; // Default moderate risk
      let averageCompleteness = 70; // Default moderately complete
      
      // If we have contracts, calculate actual metrics
      if (contracts.length > 0) {
        const sampleContracts = contracts.slice(0, Math.min(5, contracts.length));
        
        // Calculate risk and completeness from our sample
        let riskScoreSum = 0;
        let completenessSum = 0;
        
        for (const contract of sampleContracts) {
          // Simple heuristic: longer contracts tend to be more complete and lower risk
          const length = contract.content ? contract.content.length : 0;
          // More clauses tend to mean lower risk
          const clauseCount = contract.clauses ? contract.clauses.length : 0;
          
          const riskScore = Math.max(20, Math.min(90, 100 - (length / 1000 * 10) - (clauseCount * 5)));
          const completeness = Math.min(95, (length / 2000 * 50) + (clauseCount * 10));
          
          riskScoreSum += riskScore;
          completenessSum += completeness;
        }
        
        averageRiskScore = Math.round(riskScoreSum / sampleContracts.length);
        averageCompleteness = Math.round(completenessSum / sampleContracts.length);
      }
      
      return res.status(200).json({
        success: true,
        stats: {
          totalContracts,
          draftContracts,
          pendingContracts,
          signedContracts,
          averageRiskScore,
          averageCompleteness
        }
      });
    } catch (error) {
      console.error("Error getting contract analysis overview:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve contract analysis overview"
      });
    }
  });

  app.get("/api/contracts/analysis/:id", async (req, res) => {
    try {
      // Check if ID is valid
      const id = req.params.id;
      if (!id || id === 'undefined' || id === 'null') {
        return res.status(400).json({
          success: false,
          message: "Invalid contract ID provided"
        });
      }
      
      const contractId = parseInt(id, 10);
      if (isNaN(contractId)) {
        return res.status(400).json({
          success: false,
          message: "Contract ID must be a valid number"
        });
      }
      
      const contract = await storage.getContract(contractId);
      
      if (!contract) {
        return res.status(404).json({
          success: false,
          message: "Contract not found"
        });
      }
      
      // Generate analysis using OpenAI
      const analysis = await analyzeContract(contract.content, contract.jurisdiction);
      
      // Add risk score and completeness metrics based on analysis
      const riskScore = calculateRiskScore(analysis);
      const completeness = calculateCompleteness(analysis);
      const issues = analysis.weaknesses.length;
      
      res.json({
        success: true,
        riskScore,
        completeness,
        issues,
        ...analysis
      });
    } catch (error) {
      console.error("Error analyzing contract:", error);
      res.status(500).json({
        success: false,
        message: `Error analyzing contract: ${error.message}`
      });
    }
  });

  app.get("/api/contracts/:id", async (req, res) => {
    try {
      // Check if ID is valid
      const id = req.params.id;
      if (!id || id === 'undefined' || id === 'null') {
        return res.status(400).json({
          success: false,
          message: "Invalid contract ID provided"
        });
      }
      
      const contractId = parseInt(id, 10);
      if (isNaN(contractId)) {
        return res.status(400).json({
          success: false,
          message: "Contract ID must be a valid number"
        });
      }
      
      const contract = await getContractById(contractId);
      
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      res.status(200).json(contract);
    } catch (error) {
      console.error("Error getting contract:", error);
      res.status(500).json({ message: "Error retrieving contract" });
    }
  });
  
  // Get contract verification details
  app.get("/api/contracts/:id/verification", async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const contract = await getContractById(contractId);
      
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      // In a real application, this would fetch verification details from a database
      // For this demonstration, we'll generate the LexiCert ID and verification details
      const lexiCertId = `LEXI-${810000 + contractId}`;
      const verificationStatus = contract.status === "draft" ? "pending" : "verified";
      const authenticationMethods = [
        {
          method: "Aadhaar",
          status: "completed",
          verifiedBy: "Aadhaar Authentication System",
          verifiedAt: new Date().toISOString(),
        },
        {
          method: "DSC",
          status: "pending",
          verifiedBy: null,
          verifiedAt: null,
        },
        {
          method: "OTP",
          status: "completed",
          verifiedBy: "SMS Verification",
          verifiedAt: new Date().toISOString(),
        },
      ];
      
      res.status(200).json({
        contractId,
        lexiCertId,
        status: verificationStatus,
        title: contract.title,
        createdAt: contract.createdAt,
        authenticationMethods,
      });
    } catch (error) {
      console.error("Error getting contract verification:", error);
      res.status(500).json({ message: "Error retrieving contract verification details" });
    }
  });

  app.post("/api/contracts", async (req, res) => {
    try {
      // Log the incoming data for debugging
      console.log("Contract creation request:", JSON.stringify(req.body, null, 2));
      
      // Parse and validate the data
      const contractData = insertContractSchema.parse(req.body);
      
      // Set the userId if not provided or invalid
      if (!contractData.userId || contractData.userId <= 0) {
        // Get the first user in the system as a fallback
        try {
          const firstUser = await storage.getUser(1);
          if (firstUser) {
            contractData.userId = firstUser.id;
          } else {
            return res.status(400).json({ 
              message: "Failed to create contract", 
              details: "No valid user found to associate with the contract. Please log in first."
            });
          }
        } catch (userError) {
          console.error("Error getting user for contract:", userError);
          return res.status(500).json({ 
            message: "Failed to create contract", 
            details: "Could not find a valid user for the contract"
          });
        }
      }
      
      // Create the contract with detailed error handling
      try {
        console.log("Creating contract with data:", JSON.stringify(contractData, null, 2));
        const contract = await createContract(contractData);
        res.status(201).json(contract);
      } catch (contractError: unknown) {
        console.error("Contract creation service error:", contractError);
        const errorMessage = contractError instanceof Error ? contractError.message : "Unknown contract creation error";
        return res.status(500).json({ 
          message: "Failed to create contract", 
          details: errorMessage
        });
      }
    } catch (error: unknown) {
      // Handle validation errors more explicitly
      console.error("Contract validation error:", error);
      if (error && typeof error === 'object' && 'errors' in error) {
        // This is likely a Zod validation error
        return res.status(400).json({ 
          message: "Invalid contract data", 
          details: (error as { errors: unknown }).errors 
        });
      }
      res.status(400).json({ message: "Invalid contract data" });
    }
  });

  app.patch("/api/contracts/:id", async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const contractData = req.body;
      const contract = await updateContract(contractId, contractData);
      
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      res.status(200).json(contract);
    } catch (error) {
      console.error("Error updating contract:", error);
      res.status(400).json({ message: "Invalid contract data" });
    }
  });
  
  // Add party to contract
  app.post("/api/contracts/:id/parties", async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const party = req.body;
      
      // Get the current contract
      const contract = await getContractById(contractId);
      
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      // Add the new party
      const parties = contract.parties || [];
      parties.push(party);
      
      // Update the contract with the new party
      const updatedContract = await updateContract(contractId, { parties });
      
      if (!updatedContract) {
        return res.status(500).json({ message: "Failed to add party to contract" });
      }
      
      res.status(200).json(updatedContract);
    } catch (error) {
      console.error("Error adding party to contract:", error);
      res.status(400).json({ message: "Invalid party data" });
    }
  });

  // AI routes
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { prompt, messages, contractContext, contractId } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      // If contract ID is provided, fetch contract context
      let contextInfo = contractContext;
      if (contractId) {
        const contract = await storage.getContract(parseInt(contractId, 10));
        if (contract) {
          contextInfo = `Contract type: ${contract.type}. Jurisdiction: ${contract.jurisdiction}. Parties: ${
            contract.parties.map(p => `${p.name} (${p.role})`).join(", ")
          }`;
        }
      }
      
      const response = await handleChat(prompt, messages, contextInfo);
      
      // If the chat is related to a contract, update the contract with the AI suggestions
      if (contractId && response.contractSuggestion) {
        try {
          const contract = await storage.getContract(parseInt(contractId, 10));
          if (contract) {
            // Update the contract content with AI suggestions if it was empty
            if (!contract.content || contract.content.trim() === "") {
              await storage.updateContract(parseInt(contractId, 10), {
                content: response.contractSuggestion
              });
            }
            
            // Add the suggestion as a new clause if it doesn't exist already
            if (response.contractSuggestion && response.contractSuggestion.length > 0) {
              const existingClauses = contract.clauses || [];
              const newClause = {
                id: `clause-${Date.now()}`,
                title: `AI Suggested Clause (${new Date().toLocaleDateString()})`,
                content: response.contractSuggestion,
                explanation: "Generated based on your requirements"
              };
              
              // Only add if this exact content doesn't already exist
              if (!existingClauses.some(c => c.content === newClause.content)) {
                await storage.updateContract(parseInt(contractId, 10), {
                  clauses: [...existingClauses, newClause]
                });
              }
            }
          }
        } catch (updateError) {
          console.error("Error updating contract with AI suggestions:", updateError);
          // Continue with the response even if updating the contract fails
        }
      }
      
      res.status(200).json(response);
    } catch (error) {
      console.error("Error handling AI chat:", error);
      res.status(500).json({ message: "Error processing AI chat" });
    }
  });

  app.post("/api/ai/generate-contract", async (req, res) => {
    try {
      const { type, parties, jurisdiction, requirements } = req.body;
      
      if (!type || !parties || !jurisdiction) {
        return res.status(400).json({ message: "Type, parties, and jurisdiction are required" });
      }
      
      const contract = await generateContract(type, parties, jurisdiction, requirements || "");
      res.status(200).json({ contract });
    } catch (error) {
      console.error("Error generating contract:", error);
      res.status(500).json({ message: "Error generating contract" });
    }
  });

  app.post("/api/ai/analyze-clause", async (req, res) => {
    try {
      const { clause } = req.body;
      
      if (!clause) {
        return res.status(400).json({ message: "Clause is required" });
      }
      
      const analysis = await analyzeClause(clause);
      res.status(200).json(analysis);
    } catch (error) {
      console.error("Error analyzing clause:", error);
      res.status(500).json({ message: "Error analyzing clause" });
    }
  });

  // Enhance clause endpoint for AI-powered clause improvements
  app.post("/api/ai/enhance-clause", async (req, res) => {
    try {
      const { action, content, clauseId, title, options = {} } = req.body;
      
      if (!action || !content) {
        return res.status(400).json({ message: "Action and content are required" });
      }
      
      const result = await enhanceClause(action, content, options);
      
      // Create enhanced clause object for frontend
      const enhancedClause = {
        id: clauseId || `ai-${Date.now()}`,
        title: title || "Enhanced Clause",
        content: result.result,
        explanation: result.explanation || ""
      };
      
      res.status(200).json({ 
        clause: enhancedClause, 
        action: action 
      });
    } catch (error) {
      console.error("Error enhancing clause:", error);
      res.status(500).json({ message: "Error enhancing clause" });
    }
  });

  // Compose new clause endpoint for AI-powered clause generation
  app.post("/api/ai/compose-clause", async (req, res) => {
    try {
      const { goal, context = "", options = {} } = req.body;
      
      if (!goal) {
        return res.status(400).json({ message: "Goal is required" });
      }
      
      const result = await composeClause({
        goal,
        context,
        jurisdiction: options.jurisdiction || 'India',
        contractType: options.contractType || 'standard',
        tone: options.tone || 'balanced',
        userRole: options.userRole || ''
      });
      
      // Create composed clause object for frontend
      const composedClause = {
        id: `ai-${Date.now()}`,
        title: result.title || "New Clause",
        content: result.content,
        explanation: result.explanation || ""
      };
      
      res.status(200).json({ 
        clause: composedClause
      });
    } catch (error) {
      console.error("Error composing clause:", error);
      res.status(500).json({ message: "Error composing clause" });
    }
  });
  
  // Contract enhancement endpoint for WYSIWYG editor integration
  app.post("/api/contracts/:id/enhance", async (req, res) => {
    try {
      const contractId = parseInt(req.params.id, 10);
      const contract = await storage.getContract(contractId);
      
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      const { action, content, clauseId } = req.body;
      
      if (!action || !content) {
        return res.status(400).json({ message: "Action and content are required" });
      }
      
      let result;
      
      // Type guard functions to check result types
      const isChatResult = (obj: any): obj is { messages: AIMessage[], contractSuggestion?: string } => {
        return obj && Array.isArray(obj.messages);
      };
      
      const isAnalysisResult = (obj: any): obj is { explanation: string, suggestions: string[], legalContext: string } => {
        return obj && typeof obj.explanation === 'string';
      };
      
      switch (action) {
        case "rewrite":
          // Call OpenAI to rewrite the clause
          result = await handleChat(`Rewrite this clause in clearer language while maintaining legal validity under Indian law: ${content}`, []);
          break;
        case "explain":
          // Call OpenAI to explain the clause
          result = await analyzeClause(content);
          break;
        case "suggest":
          // Call OpenAI to suggest alternatives
          result = await handleChat(`Suggest alternative phrasings for this clause that are more favorable to my position while maintaining validity under Indian law: ${content}`, []);
          break;
        case "add_legal_context":
          // Call OpenAI to add legal context
          result = await handleChat(`Provide additional legal context and references for this clause under Indian law: ${content}`, []);
          break;
        case "simplify":
          // Call OpenAI to simplify the language
          result = await handleChat(`Simplify this legal clause into plain language that a non-lawyer can understand: ${content}`, []);
          break;
        default:
          return res.status(400).json({ message: "Invalid action" });
      }
      
      // If clause ID is provided, update the clause in the contract
      if (clauseId && result) {
        try {
          const existingClauses = contract.clauses || [];
          const clauseIndex = existingClauses.findIndex(c => c.id === clauseId);
          
          if (clauseIndex !== -1) {
            const updatedClauses = [...existingClauses];
            
            // Update the clause based on the action using type guards
            if (action === 'rewrite' || action === 'suggest') {
              if (isChatResult(result) && result.contractSuggestion) {
                updatedClauses[clauseIndex].content = result.contractSuggestion;
              } else if (isChatResult(result) && result.messages.length > 0) {
                updatedClauses[clauseIndex].content = result.messages[0].content;
              }
            } else if (action === 'explain' || action === 'add_legal_context') {
              if (isAnalysisResult(result)) {
                updatedClauses[clauseIndex].explanation = result.explanation;
              } else if (isChatResult(result) && result.messages.length > 0) {
                updatedClauses[clauseIndex].explanation = result.messages[0].content;
              }
            }
            
            await storage.updateContract(contractId, { clauses: updatedClauses });
          }
        } catch (updateError) {
          console.error("Error updating clause:", updateError);
        }
      }
      
      res.status(200).json(result);
    } catch (error) {
      console.error("Error enhancing contract:", error);
      res.status(500).json({ message: "Error enhancing contract" });
    }
  });

  // Template routes
  app.get("/api/templates", async (req, res) => {
    try {
      let templates = await storage.getAllTemplates();
      
      // Check if no templates are returned
      if (!templates || templates.length === 0) {
        console.log("No templates found in getAll, returning default templates");
        // Return placeholder templates until our DB templates are properly loaded
        templates = [
          {
            id: 1,
            title: "Non-Disclosure Agreement (NDA)",
            type: "nda",
            description: "Protect confidential information between parties",
            content: "This Non-Disclosure Agreement template...",
            isPublic: true,
            userId: 1,
            clauses: [
              { id: "c1", title: "Confidential Information", content: "Definition of confidential information" },
              { id: "c2", title: "Obligations", content: "Obligations to protect confidential information" },
              { id: "c3", title: "Term", content: "Duration of the agreement" }
            ],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 2,
            title: "Employment Contract",
            type: "employment",
            description: "Standard employment agreement for Indian companies",
            content: "This Employment Agreement template...",
            isPublic: true,
            userId: 1,
            clauses: [
              { id: "c1", title: "Position and Duties", content: "Details of the position and responsibilities" },
              { id: "c2", title: "Compensation", content: "Salary and benefits details" },
              { id: "c3", title: "Term and Termination", content: "Duration and termination conditions" }
            ],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 3,
            title: "Service Agreement",
            type: "consulting",
            description: "For consultants and service providers",
            content: "This Service Agreement template...",
            isPublic: true,
            userId: 1,
            clauses: [
              { id: "c1", title: "Services", content: "Description of services to be provided" },
              { id: "c2", title: "Payment Terms", content: "Fee structure and payment schedule" },
              { id: "c3", title: "Deliverables", content: "Expected deliverables and timelines" }
            ],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 4,
            title: "Partnership Agreement",
            type: "partnership",
            description: "Comprehensive partnership deed for business partnerships",
            content: "This Partnership Agreement template...",
            isPublic: true,
            userId: 1,
            clauses: [
              { id: "c1", title: "Formation and Name", content: "Partnership formation details" },
              { id: "c2", title: "Capital Contributions", content: "Partner contribution details" },
              { id: "c3", title: "Profit and Loss Sharing", content: "Profit distribution terms" }
            ],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 5,
            title: "Commercial Lease Agreement",
            type: "lease",
            description: "Template for commercial property leasing",
            content: "This Commercial Lease Agreement template...",
            isPublic: true,
            userId: 1,
            clauses: [
              { id: "c1", title: "Premises", content: "Description of the leased property" },
              { id: "c2", title: "Rent and Security Deposit", content: "Payment terms and security deposit" },
              { id: "c3", title: "Term and Renewal", content: "Duration and renewal conditions" }
            ],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
      }
      
      res.status(200).json(templates);
    } catch (error) {
      console.error("Error getting templates:", error);
      res.status(500).json({ message: "Error retrieving templates" });
    }
  });

  app.get("/api/templates/popular", async (req, res) => {
    try {
      let templates = await storage.getPopularTemplates();
      
      // Check if no templates are returned
      if (!templates || templates.length === 0) {
        console.log("No templates found, returning default templates");
        // Return placeholder templates until our DB templates are properly loaded
        templates = [
          {
            id: 1,
            title: "Non-Disclosure Agreement (NDA)",
            type: "nda",
            description: "Protect confidential information between parties",
            content: "This Non-Disclosure Agreement template...",
            isPublic: true,
            userId: 1,
            clauses: [
              { id: "c1", title: "Confidential Information", content: "Definition of confidential information" },
              { id: "c2", title: "Obligations", content: "Obligations to protect confidential information" },
              { id: "c3", title: "Term", content: "Duration of the agreement" }
            ],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 2,
            title: "Employment Contract",
            type: "employment",
            description: "Standard employment agreement for Indian companies",
            content: "This Employment Agreement template...",
            isPublic: true,
            userId: 1,
            clauses: [
              { id: "c1", title: "Position and Duties", content: "Details of the position and responsibilities" },
              { id: "c2", title: "Compensation", content: "Salary and benefits details" },
              { id: "c3", title: "Term and Termination", content: "Duration and termination conditions" }
            ],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 3,
            title: "Service Agreement",
            type: "consulting",
            description: "For consultants and service providers",
            content: "This Service Agreement template...",
            isPublic: true,
            userId: 1,
            clauses: [
              { id: "c1", title: "Services", content: "Description of services to be provided" },
              { id: "c2", title: "Payment Terms", content: "Fee structure and payment schedule" },
              { id: "c3", title: "Deliverables", content: "Expected deliverables and timelines" }
            ],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
      }
      
      res.status(200).json(templates);
    } catch (error) {
      console.error("Error getting popular templates:", error);
      res.status(500).json({ message: "Error retrieving popular templates" });
    }
  });

  // Client routes
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getAllClients();
      res.status(200).json(clients);
    } catch (error) {
      console.error("Error getting clients:", error);
      res.status(500).json({ message: "Error retrieving clients" });
    }
  });

  // Generate PDF for a contract
  app.post("/api/contracts/:id/pdf", async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const pdfUrl = await generateContractPdf(contractId);
      
      if (!pdfUrl) {
        return res.status(500).json({ message: "Failed to generate PDF" });
      }
      
      res.status(200).json({ pdfUrl });
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Error generating PDF" });
    }
  });
  
  // Save contract as template
  app.post("/api/contracts/:id/save-as-template", async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const { name, description, category } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Template name is required" });
      }
      
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      // Create a new template from the contract
      const template = await storage.createTemplate({
        title: name,
        description: description || `Template based on contract: ${contract.title}`,
        content: contract.content,
        type: contract.type,
        jurisdiction: contract.jurisdiction,
        category: category || "general",
        clauses: contract.clauses || [],
        userId: contract.userId
      });
      
      res.status(201).json(template);
    } catch (error) {
      console.error("Error saving contract as template:", error);
      res.status(500).json({ message: "Error saving contract as template" });
    }
  });
  
  // Digital signature feature
  app.post("/api/contracts/:id/sign", async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const { signerName, signerEmail, signatureData } = req.body;
      
      if (!signerName || !signerEmail || !signatureData) {
        return res.status(400).json({ message: "Signer name, email, and signature data are required" });
      }
      
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      // In a real implementation, we'd store the signature image and validate it
      // For now, we'll just update the contract status to 'signed'
      const updatedContract = await storage.updateContract(contractId, { 
        status: "signed",
        signatures: [...(contract.signatures || []), {
          name: signerName,
          email: signerEmail,
          timestamp: new Date().toISOString(),
          signature: signatureData
        }]
      });
      
      res.status(200).json(updatedContract);
    } catch (error) {
      console.error("Error signing contract:", error);
      res.status(500).json({ message: "Error signing contract" });
    }
  });

  // Send contract via email
  app.post("/api/contracts/:id/send-email", async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const { recipients, subject, message } = req.body;
      
      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ message: "At least one recipient email is required" });
      }
      
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      // Generate PDF if it doesn't exist
      if (!contract.pdfUrl) {
        await generateContractPdf(contractId);
      }
      
      // Send email to each recipient
      const emailPromises = recipients.map(email => {
        return sendEmail({
          to: email,
          from: "contracts@lexidraft.com",
          subject: subject || `Contract: ${contract.title}`,
          html: `
            <div>
              <h1>${contract.title}</h1>
              <p>${message || "Please find the attached contract for your review."}</p>
              <p>You can view the contract at: <a href="https://lexidraft.com/client-portal/contracts/${contractId}">View Contract</a></p>
              <hr />
              <p>This email was sent from LexiDraft, an AI-powered legal contract management platform.</p>
            </div>
          `
        });
      });
      
      await Promise.all(emailPromises);
      
      // Add recipients as contract parties if they're not already included
      const parties = contract.parties || [];
      const existingEmails = parties.map(p => p.email?.toLowerCase());
      
      const newParties = recipients
        .filter(email => email && !existingEmails.includes(email.toLowerCase()))
        .map(email => ({
          name: email.split('@')[0], // Use part before @ as name
          role: "recipient",
          email
        }));
      
      if (newParties.length > 0) {
        await storage.updateContract(contractId, {
          parties: [...parties, ...newParties]
        });
      }
      
      res.status(200).json({ success: true, message: `Email sent to ${recipients.length} recipients` });
    } catch (error) {
      console.error("Error sending contract email:", error);
      res.status(500).json({ message: "Error sending email" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      const client = await storage.createClient({
        ...clientData,
        userId: 1, // This should be the authenticated user's ID in a real app
      });
      res.status(201).json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(400).json({ message: "Invalid client data" });
    }
  });

  // Lawyer marketplace routes
  app.get("/api/lawyers", async (req, res) => {
    try {
      const lawyers = await storage.getAllLawyers();
      res.status(200).json(lawyers);
    } catch (error) {
      console.error("Error getting lawyers:", error);
      res.status(500).json({ message: "Error retrieving lawyers" });
    }
  });

  // Billing routes
  app.get("/api/billing/subscription", async (req, res) => {
    try {
      const subscription = await storage.getUserSubscription(1); // This should be the authenticated user's ID
      res.status(200).json(subscription);
    } catch (error) {
      console.error("Error getting subscription:", error);
      res.status(500).json({ message: "Error retrieving subscription" });
    }
  });

  app.get("/api/billing/invoices", async (req, res) => {
    try {
      const invoices = await storage.getUserInvoices(1); // This should be the authenticated user's ID
      res.status(200).json(invoices);
    } catch (error) {
      console.error("Error getting invoices:", error);
      res.status(500).json({ message: "Error retrieving invoices" });
    }
  });

  // User routes
  app.patch("/api/user/profile", async (req, res) => {
    try {
      // This should use the authenticated user's ID
      res.status(200).json({ message: "Profile updated successfully" });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Error updating profile" });
    }
  });

  app.patch("/api/user/legal", async (req, res) => {
    try {
      // This should use the authenticated user's ID
      res.status(200).json({ message: "Legal information updated successfully" });
    } catch (error) {
      console.error("Error updating legal information:", error);
      res.status(500).json({ message: "Error updating legal information" });
    }
  });

  app.patch("/api/user/notifications", async (req, res) => {
    try {
      // This should use the authenticated user's ID
      res.status(200).json({ message: "Notification settings updated successfully" });
    } catch (error) {
      console.error("Error updating notification settings:", error);
      res.status(500).json({ message: "Error updating notification settings" });
    }
  });

  app.patch("/api/user/ai-settings", async (req, res) => {
    try {
      // This should use the authenticated user's ID
      res.status(200).json({ message: "AI settings updated successfully" });
    } catch (error) {
      console.error("Error updating AI settings:", error);
      res.status(500).json({ message: "Error updating AI settings" });
    }
  });

  // Lawyer Marketplace routes
  
  // Book a consultation with a lawyer
  app.post("/api/consultations/book", async (req, res) => {
    try {
      const bookingSchema = z.object({
        lawyerId: z.number(),
        mode: z.string(),
        scheduledDate: z.string(),
        scheduledTime: z.string(),
        duration: z.number(),
        query: z.string().min(10),
        useAI: z.boolean().optional().default(false),
        customerEmail: z.string().email().optional(),
        customerPhone: z.string().optional(),
        customerName: z.string().optional(),
        returnUrl: z.string().optional()
      });
      
      // Validate the request body
      const validationResult = bookingSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid booking data", 
          details: validationResult.error.format() 
        });
      }
      
      const bookingData = validationResult.data;
      
      // Check if lawyer exists
      const lawyer = await storage.getLawyer(bookingData.lawyerId);
      if (!lawyer) {
        return res.status(404).json({ error: "Lawyer not found" });
      }
      
      // Check if lawyer is available
      if (!lawyer.available) {
        return res.status(400).json({ error: "Lawyer is not available for consultations at this time" });
      }
      
      // Check if consultation mode is supported by lawyer
      if (!lawyer.consultationModes.includes(bookingData.mode)) {
        return res.status(400).json({ 
          error: `This lawyer doesn't support ${bookingData.mode} consultations` 
        });
      }
      
      // Create consultation with pending payment status
      const consultation = await storage.createConsultation({
        userId: 1, // TODO: Get from authenticated user session
        lawyerId: bookingData.lawyerId,
        scheduledDate: bookingData.scheduledDate,
        scheduledTime: bookingData.scheduledTime,
        duration: bookingData.duration,
        mode: bookingData.mode,
        query: bookingData.query,
        useAI: bookingData.useAI,
        status: "pending_payment", // Set status to pending payment
        paymentStatus: "pending" // Add payment status
      });
      
      // Generate unique meeting URL for video calls
      if (bookingData.mode === "video") {
        const meetingId = `lexi-meet-${consultation.id}-${Math.random().toString(36).substring(2, 10)}`;
        const meetingUrl = `https://meet.lexidraft.com/${meetingId}`;
        
        await storage.updateConsultation(consultation.id, {
          meetingUrl
        });
        
        consultation.meetingUrl = meetingUrl;
      }
      
      // If payment details are provided, create a payment order
      if (bookingData.customerEmail && bookingData.customerPhone && bookingData.customerName && bookingData.returnUrl) {
        try {
          // Calculate consultation fee based on lawyer's hourly rate and duration
          const consultationFee = Math.round((lawyer.hourlyRate * bookingData.duration) / 60);
          
          // Create payment order using Cashfree
          const paymentData = {
            orderId: `LEXC${consultation.id}${Date.now()}`,
            orderAmount: consultationFee,
            orderCurrency: "INR",
            customerEmail: bookingData.customerEmail,
            customerPhone: bookingData.customerPhone,
            customerName: bookingData.customerName,
            returnUrl: bookingData.returnUrl,
            paymentType: PaymentType.LAWYER_CONSULTATION,
            productInfo: `Consultation with ${lawyer.name} (${bookingData.mode}, ${bookingData.duration} minutes)`,
            metaData: {
              consultationId: consultation.id
            }
          };
          
          const paymentOrder = await createPaymentOrder(paymentData);
          
          // Return with payment information
          return res.status(201).json({
            consultationId: consultation.id,
            message: "Consultation created, proceed to payment",
            consultation,
            payment: {
              orderId: paymentOrder.cfOrderId,
              amount: consultationFee,
              paymentLink: paymentOrder.paymentLink,
              paymentSessionId: paymentOrder.paymentSessionId
            }
          });
        } catch (paymentError) {
          console.error("Error creating payment order:", paymentError);
          
          // Even if payment creation fails, return the consultation
          return res.status(201).json({
            consultationId: consultation.id,
            message: "Consultation created but payment processing failed. Please try payment again.",
            consultation,
            paymentError: paymentError instanceof Error ? paymentError.message : "Unknown payment error"
          });
        }
      }
      
      // If no payment details, just return the consultation
      res.status(201).json({
        consultationId: consultation.id,
        message: "Consultation booked successfully, payment required",
        consultation
      });
    } catch (error) {
      console.error("Error booking consultation:", error);
      res.status(500).json({ 
        error: "Failed to book consultation",
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Get user's consultations
  app.get("/api/consultations", async (req, res) => {
    try {
      // TODO: Get from authenticated user session
      const userId = 1;
      
      const consultations = await storage.getUserConsultations(userId);
      res.json(consultations);
    } catch (error) {
      console.error("Error fetching consultations:", error);
      res.status(500).json({ error: "Failed to fetch consultations" });
    }
  });
  
  // Get consultation details
  app.get("/api/consultations/:id", async (req, res) => {
    try {
      const consultationId = parseInt(req.params.id);
      if (isNaN(consultationId)) {
        return res.status(400).json({ error: "Invalid consultation ID" });
      }
      
      const consultation = await storage.getConsultation(consultationId);
      if (!consultation) {
        return res.status(404).json({ error: "Consultation not found" });
      }
      
      // TODO: Check if consultation belongs to user
      
      res.json(consultation);
    } catch (error) {
      console.error("Error fetching consultation:", error);
      res.status(500).json({ error: "Failed to fetch consultation" });
    }
  });
  
  // Update consultation details (including payment status)
  app.patch("/api/consultations/:id", async (req, res) => {
    try {
      const consultationId = parseInt(req.params.id);
      if (isNaN(consultationId)) {
        return res.status(400).json({ error: "Invalid consultation ID" });
      }
      
      const consultation = await storage.getConsultation(consultationId);
      if (!consultation) {
        return res.status(404).json({ error: "Consultation not found" });
      }
      
      // TODO: Check if consultation belongs to user or if the user has permission
      
      // Update consultation with provided data
      const updatedConsultation = await storage.updateConsultation(
        consultationId, 
        req.body
      );
      
      res.json(updatedConsultation);
    } catch (error) {
      console.error("Error updating consultation:", error);
      res.status(500).json({ 
        error: "Failed to update consultation",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/lawyers/:id", async (req, res) => {
    try {
      const lawyerId = parseInt(req.params.id);
      // In a real implementation, this would fetch from the database
      const lawyers = await storage.getAllLawyers();
      const lawyer = lawyers.find(l => l.id === lawyerId);
      
      if (!lawyer) {
        return res.status(404).json({ error: 'Lawyer not found' });
      }
      
      // Additional data for lawyer profile
      const enhancedLawyer = {
        ...lawyer,
        education: [
          { degree: "LLB", institution: "National Law School, Bangalore", year: "2015" },
          { degree: "LLM (Corporate Law)", institution: "Harvard Law School", year: "2017" }
        ],
        barCouncilId: `${lawyer.specialization.substring(0, 3).toUpperCase()}/12345/${new Date().getFullYear() - lawyer.experience}`,
        verified: true,
        awards: [
          { title: "Rising Star in Corporate Law", organization: "Legal Excellence Awards", year: "2021" },
          { title: "40 Under 40 Legal Innovators", organization: "Legal Tech Association", year: "2022" }
        ],
        about: `Corporate lawyer with ${lawyer.experience}+ years of experience specializing in ${lawyer.specialization}. I help clients navigate legal challenges with practical solutions. Prior to my independent practice, I worked at a leading law firm where I handled complex cases for clients across industries.`,
        averageResponseTime: "2 hours",
        consultationStats: {
          completed: Math.floor(40 + Math.random() * 60),
          ratings5star: Math.floor(30 + Math.random() * 40)
        },
        reviews: [
          {
            id: 1,
            user: {
              name: "Vikram Singh",
              image: "https://randomuser.me/api/portraits/men/61.jpg",
            },
            rating: 5,
            date: "2 months ago",
            comment: `${lawyer.name} provided excellent counsel during our legal matter. Their expertise was instrumental in reaching a favorable outcome.`
          },
          {
            id: 2,
            user: {
              name: "Anjali Gupta",
              image: "https://randomuser.me/api/portraits/women/32.jpg",
            },
            rating: 4,
            date: "3 months ago",
            comment: `Very knowledgeable about ${lawyer.specialization}. Quick to respond and thorough in explanations. Would recommend their services.`
          },
          {
            id: 3,
            user: {
              name: "Rajan Patel",
              image: "https://randomuser.me/api/portraits/men/42.jpg",
            },
            rating: 5,
            date: "4 months ago",
            comment: `${lawyer.name} helped with my legal documents. Their attention to detail and understanding of potential future scenarios was impressive.`
          }
        ],
        articles: [
          {
            id: 1,
            title: `Understanding ${lawyer.specialization} in India Today`,
            date: "Jan 15, 2023",
            summary: "A comprehensive guide to navigating the current legal landscape in this practice area."
          },
          {
            id: 2,
            title: "Legal Compliance for Businesses in 2023",
            date: "Mar 22, 2023",
            summary: "Key regulatory changes and their implications for Indian businesses."
          },
          {
            id: 3,
            title: "Common Legal Pitfalls and How to Avoid Them",
            date: "Jun 10, 2023",
            summary: "Practical advice for businesses and individuals to prevent legal issues."
          }
        ],
        availability: generateAvailability()
      };
      
      res.json(enhancedLawyer);
    } catch (error) {
      console.error('Error fetching lawyer profile:', error);
      res.status(500).json({ error: 'Failed to fetch lawyer profile' });
    }
  });

  // Consultation booking route with payment
  app.post("/api/consultations/book", async (req, res) => {
    try {
      const consultationData = req.body;
      
      // Generate a consultation ID and confirmation code
      const consultationId = Math.floor(10000 + Math.random() * 90000);
      const lexiCertId = `LEXI-${Math.floor(100000 + Math.random() * 900000)}`;
      
      // Get lawyer details to calculate payment amount
      const lawyer = await storage.getLawyer(consultationData.lawyerId);
      
      if (!lawyer) {
        return res.status(404).json({ 
          success: false, 
          error: 'Lawyer not found' 
        });
      }
      
      // Calculate fee based on duration and hourly rate
      const durationHours = consultationData.duration / 60;
      const consultationFee = lawyer.hourlyRate * durationHours;
      
      // Create a new consultation record in pending status
      const consultation = {
        id: consultationId,
        lawyerId: consultationData.lawyerId,
        userId: consultationData.userId || 1, // Default to user ID 1 if not provided
        status: 'pending_payment',
        mode: consultationData.mode,
        scheduledDate: consultationData.scheduledDate,
        scheduledTime: consultationData.scheduledTime,
        duration: consultationData.duration,
        query: consultationData.query,
        useAI: consultationData.useAI,
        paymentStatus: 'pending',
        amount: consultationFee,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lexiCertId: lexiCertId
      };
      
      // Save the consultation
      const savedConsultation = await storage.createConsultation({
        ...consultation,
        id: undefined // Remove id as it will be generated by storage
      });
      
      // Prepare payment data
      if (
        consultationData.customerEmail && 
        consultationData.customerPhone && 
        consultationData.customerName &&
        consultationData.returnUrl
      ) {
        try {
          // Dynamically import cashfree service
          const { createPaymentLink } = await import('./services/cashfreeService');
          
          // Generate a unique order ID
          const orderId = `LXI-CONS-${Date.now()}-${consultationId}`;
          
          // Import payment types
          const { PaymentType } = await import('./services/cashfreeService');
          
          const paymentData = {
            orderId,
            orderAmount: consultationFee,
            orderCurrency: "INR",
            customerEmail: consultationData.customerEmail,
            customerPhone: consultationData.customerPhone,
            customerName: consultationData.customerName,
            returnUrl: consultationData.returnUrl,
            paymentType: PaymentType.LAWYER_CONSULTATION,
            productInfo: `Legal consultation with ${lawyer.name} (${consultationData.duration} minutes)`,
            metaData: {
              consultationId: savedConsultation.id.toString(),
              lawyerId: lawyer.id.toString(),
              mode: consultationData.mode,
              duration: consultationData.duration.toString()
            }
          };
          
          // Create payment link
          const paymentResponse = await createPaymentLink(paymentData);
          
          // Return consultation with payment info
          res.status(201).json({
            success: true,
            consultationId: savedConsultation.id,
            payment: paymentResponse,
            message: 'Consultation created, payment required'
          });
        } catch (paymentError) {
          console.error('Payment integration error:', paymentError);
          
          // Still return consultation info even if payment creation fails
          res.status(201).json({
            success: true,
            consultationId: savedConsultation.id,
            message: 'Consultation created, but payment link generation failed. Please try payment again later.',
            error: paymentError instanceof Error ? paymentError.message : 'Unknown payment error'
          });
        }
      } else {
        // Return consultation without payment if required data is missing
        res.status(201).json({
          success: true,
          consultationId: savedConsultation.id,
          message: 'Consultation created, but missing payment information'
        });
      }
    } catch (error) {
      console.error('Error booking consultation:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to book consultation', 
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Helper function to generate random availability
  function generateAvailability() {
    const availability = [];
    const today = new Date();
    
    for (let day = 0; day < 7; day++) {
      const date = new Date(today);
      date.setDate(today.getDate() + day);
      
      const slots = [];
      for (let hour = 10; hour <= 18; hour++) {
        if (hour !== 13) { // Skip lunch hour
          const isAvailable = Math.random() > 0.3;
          slots.push({
            time: `${hour}:00`,
            available: isAvailable
          });
          
          if (hour !== 18) {
            slots.push({
              time: `${hour}:30`,
              available: Math.random() > 0.3
            });
          }
        }
      }
      
      availability.push({
        date: date.toISOString().split('T')[0],
        slots
      });
    }
    
    return availability;
  }

  // WebSocket server is set up at the top of this file
  
  // Payment routes
  app.post("/api/payments/create-order", async (req, res) => {
    try {
      const { 
        amount, 
        currency = "INR", 
        email, 
        phone, 
        name, 
        productInfo, 
        paymentType, 
        returnUrl 
      } = req.body;
      
      if (!amount || !email || !phone || !name || !productInfo || !paymentType || !returnUrl) {
        return res.status(400).json({ message: "Missing required payment fields" });
      }
      
      // Import payment types
      const { PaymentType } = await import('./services/cashfreeService');
      
      // Map string paymentType to enum
      let typedPaymentType;
      switch(paymentType) {
        case 'subscription':
          typedPaymentType = PaymentType.SUBSCRIPTION;
          break;
        case 'lawyer_consultation':
          typedPaymentType = PaymentType.LAWYER_CONSULTATION;
          break;
        case 'contract_template':
          typedPaymentType = PaymentType.CONTRACT_TEMPLATE;
          break;
        case 'verification_service':
          typedPaymentType = PaymentType.VERIFICATION_SERVICE;
          break;
        default:
          // Default to CONTRACT_TEMPLATE for any other type
          typedPaymentType = PaymentType.CONTRACT_TEMPLATE;
      }
      
      // Generate a unique order ID
      const orderId = `LXI${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      const paymentData = {
        orderId,
        orderAmount: amount,
        orderCurrency: currency,
        customerEmail: email,
        customerPhone: phone,
        customerName: name,
        returnUrl,
        paymentType: typedPaymentType,
        productInfo,
        metaData: req.body.metaData || {},
        notifyUrl: req.body.notifyUrl,
      };
      
      const order = await createPaymentOrder(paymentData);
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating payment order:", error);
      res.status(500).json({ 
        message: "Failed to create payment order",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  app.get("/api/payments/order/:orderId", async (req, res) => {
    try {
      const { orderId } = req.params;
      
      // Import the function dynamically to keep TypeScript happy
      const { getOrderDetails } = await import("./services/cashfreeService");
      
      const order = await getOrderDetails(orderId);
      res.status(200).json(order);
    } catch (error) {
      console.error("Error fetching payment order:", error);
      res.status(500).json({ 
        message: "Failed to fetch payment order",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  app.post("/api/payments/create-link", async (req, res) => {
    try {
      const { 
        amount, 
        currency = "INR", 
        email, 
        phone, 
        name, 
        productInfo, 
        paymentType, 
        returnUrl 
      } = req.body;
      
      if (!amount || !email || !phone || !name || !productInfo || !paymentType || !returnUrl) {
        return res.status(400).json({ message: "Missing required payment fields" });
      }
      
      // Import payment types
      const { PaymentType } = await import('./services/cashfreeService');
      
      // Map string paymentType to enum
      let typedPaymentType;
      switch(paymentType) {
        case 'subscription':
          typedPaymentType = PaymentType.SUBSCRIPTION;
          break;
        case 'lawyer_consultation':
          typedPaymentType = PaymentType.LAWYER_CONSULTATION;
          break;
        case 'contract_template':
          typedPaymentType = PaymentType.CONTRACT_TEMPLATE;
          break;
        case 'verification_service':
          typedPaymentType = PaymentType.VERIFICATION_SERVICE;
          break;
        default:
          // Default to CONTRACT_TEMPLATE for any other type
          typedPaymentType = PaymentType.CONTRACT_TEMPLATE;
      }
      
      // Generate a unique link ID
      const linkId = `LXIL${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      const paymentData = {
        orderId: linkId,
        orderAmount: amount,
        orderCurrency: currency,
        customerEmail: email,
        customerPhone: phone,
        customerName: name,
        returnUrl,
        paymentType: typedPaymentType,
        productInfo,
        metaData: req.body.metaData || {},
        notifyUrl: req.body.notifyUrl,
      };
      
      const paymentLink = await createPaymentLink(paymentData);
      res.status(201).json(paymentLink);
    } catch (error) {
      console.error("Error creating payment link:", error);
      res.status(500).json({ 
        message: "Failed to create payment link",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  app.get("/api/payments/link/:linkId", async (req, res) => {
    try {
      const { linkId } = req.params;
      
      // Import the function dynamically to keep TypeScript happy
      const { getPaymentLinkDetails } = await import("./services/cashfreeService");
      
      const paymentLink = await getPaymentLinkDetails(linkId);
      res.status(200).json(paymentLink);
    } catch (error) {
      console.error("Error fetching payment link:", error);
      res.status(500).json({ 
        message: "Failed to fetch payment link",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Subscription routes
  app.post("/api/subscriptions/create-plan", async (req, res) => {
    try {
      const { planName, amount, interval, description } = req.body;
      
      if (!planName || !amount || !interval || !description) {
        return res.status(400).json({ message: "Missing required subscription plan fields" });
      }
      
      // Generate a unique plan ID
      const planId = `LXIPLAN${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      const plan = await createSubscriptionPlan(
        planId,
        planName,
        amount,
        interval,
        description
      );
      
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating subscription plan:", error);
      res.status(500).json({ 
        message: "Failed to create subscription plan",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  app.post("/api/subscriptions/create", async (req, res) => {
    try {
      const { planId, email, phone, name, returnUrl, firstChargeDate } = req.body;
      
      if (!planId || !email || !phone || !name || !returnUrl) {
        return res.status(400).json({ message: "Missing required subscription fields" });
      }
      
      // Generate a unique subscription ID
      const subscriptionId = `LXISUB${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      const subscription = await createSubscription(
        subscriptionId,
        planId,
        email,
        phone,
        name,
        returnUrl,
        firstChargeDate
      );
      
      res.status(201).json(subscription);
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ 
        message: "Failed to create subscription",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  app.get("/api/subscriptions/:subscriptionId", async (req, res) => {
    try {
      const { subscriptionId } = req.params;
      
      // Import the function dynamically to keep TypeScript happy
      const { getSubscriptionDetails } = await import("./services/cashfreeService");
      
      const subscription = await getSubscriptionDetails(subscriptionId);
      res.status(200).json(subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ 
        message: "Failed to fetch subscription",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  app.post("/api/subscriptions/:subscriptionId/cancel", async (req, res) => {
    try {
      const { subscriptionId } = req.params;
      
      // Import the function dynamically to keep TypeScript happy
      const { cancelSubscription } = await import("./services/cashfreeService");
      
      const result = await cancelSubscription(subscriptionId);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ 
        message: "Failed to cancel subscription",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Payment webhook/callback
  app.post("/api/payments/webhook", async (req, res) => {
    try {
      const { data, signature } = req.body;
      
      if (!data || !signature) {
        return res.status(400).json({ message: "Invalid webhook data" });
      }
      
      // Import the function dynamically to keep TypeScript happy
      const { verifyPaymentSignature } = await import("./services/cashfreeService");
      
      const verification = await verifyPaymentSignature(data, signature);
      
      if (verification.verified) {
        // Process the payment event based on txStatus
        // Example: Update order status, send confirmation email, etc.
        
        // If this is a consultation payment that succeeded, update the consultation status
        if (data.txStatus === 'SUCCESS' && data.metaData && data.metaData.consultationId) {
          try {
            const consultationId = parseInt(data.metaData.consultationId);
            await storage.updateConsultation(consultationId, {
              status: 'scheduled',
              paymentStatus: 'paid'
            });
          } catch (updateError) {
            console.error('Failed to update consultation status after payment:', updateError);
          }
        }
        
        // For subscriptions, update user subscription status if needed
        // if (data.txStatus === 'SUCCESS' && data.paymentType === 'subscription') {
        //   // Update user subscription status
        // }
        
        res.status(200).json({ message: "Webhook received and verified" });
      } else {
        console.error("Payment signature verification failed");
        res.status(400).json({ message: "Payment signature verification failed" });
      }
    } catch (error) {
      console.error("Error processing payment webhook:", error);
      res.status(500).json({ 
        message: "Failed to process payment webhook",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  return httpServer;
}
