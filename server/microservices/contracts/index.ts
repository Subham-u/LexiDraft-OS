import express, { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth';
import { storage } from '../../storage';
import { generateContract, analyzeContract } from '../../services/openaiService';
import { insertContractSchema } from '@shared/schema';

// Create router for contracts microservice
const contractsRouter: Router = express.Router();

// Apply authentication middleware to all contract routes
contractsRouter.use(authenticate);

// Get all contracts
contractsRouter.get('/', async (req, res) => {
  try {
    const contracts = await storage.getAllContracts();
    res.json(contracts);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch contracts' 
    });
  }
});

// Get recent contracts
contractsRouter.get('/recent', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const contracts = await storage.getRecentContracts(limit);
    res.json(contracts);
  } catch (error) {
    console.error('Error fetching recent contracts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch recent contracts' 
    });
  }
});

// Get contract by ID
contractsRouter.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const contract = await storage.getContract(id);
    
    if (!contract) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contract not found' 
      });
    }
    
    res.json(contract);
  } catch (error) {
    console.error('Error fetching contract:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch contract' 
    });
  }
});

// Create a new contract
contractsRouter.post('/', async (req, res) => {
  try {
    // Validate request body
    const result = insertContractSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid contract data', 
        errors: result.error.errors 
      });
    }
    
    // Create the contract
    const contract = await storage.createContract({
      ...result.data,
      userId: req.user.id
    });
    
    res.status(201).json(contract);
  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create contract' 
    });
  }
});

// Update a contract
contractsRouter.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const contract = await storage.getContract(id);
    
    if (!contract) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contract not found' 
      });
    }
    
    // Check ownership
    if (contract.userId !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to update this contract' 
      });
    }
    
    // Update the contract
    const updatedContract = await storage.updateContract(id, req.body);
    
    res.json(updatedContract);
  } catch (error) {
    console.error('Error updating contract:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update contract' 
    });
  }
});

// Generate contract content using AI
contractsRouter.post('/generate', async (req, res) => {
  try {
    const { type, parties, jurisdiction, requirements } = req.body;
    
    if (!type || !parties || !Array.isArray(parties)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }
    
    const content = await generateContract(
      type,
      parties,
      jurisdiction || 'India',
      requirements || ''
    );
    
    res.json({ 
      success: true, 
      content 
    });
  } catch (error) {
    console.error('Error generating contract:', error);
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to generate contract' 
    });
  }
});

// Analyze contracts for dashboard
contractsRouter.get('/analysis', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    const userId = req.user.id;
    const contracts = await storage.getAllContracts();
    const userContracts = contracts.filter(c => c.userId === userId);
    
    // Basic stats
    const stats = {
      totalContracts: userContracts.length,
      drafts: userContracts.filter(c => c.status === 'draft').length,
      signed: userContracts.filter(c => c.status === 'signed').length,
      expired: userContracts.filter(c => c.status === 'expired').length,
      topTypes: {} as Record<string, number>
    };
    
    // Calculate top contract types
    userContracts.forEach(contract => {
      if (contract.type) {
        stats.topTypes[contract.type] = (stats.topTypes[contract.type] || 0) + 1;
      }
    });
    
    // Get contract risks and insights
    let risks = [];
    let insights = [];
    
    // Skip AI analysis if there are no contracts
    if (userContracts.length > 0) {
      try {
        const analysisResult = await analyzeContract(userContracts);
        
        if (analysisResult && analysisResult.risks && analysisResult.insights) {
          risks = analysisResult.risks;
          insights = analysisResult.insights;
        }
      } catch (analysisError) {
        console.warn('Contract analysis error:', analysisError);
        // Provide default values if AI analysis fails
        risks = [
          { level: 'info', message: 'Contract analysis currently unavailable' }
        ];
        insights = [
          { title: 'Basic Analysis', description: 'You have ' + stats.totalContracts + ' contracts in your account' }
        ];
      }
    }
    
    res.json({
      success: true,
      stats,
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

export default contractsRouter;