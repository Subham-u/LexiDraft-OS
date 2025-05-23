import { Router, Request, Response } from 'express';
import { lawyerMarketplaceService } from '../services/lawyer-marketplace.service';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

// Register as a lawyer
router.post('/register',
  authenticate,
  validateRequest(z.object({
    body: z.object({
      name: z.string(),
      profilePhoto: z.string().optional(),
      about: z.string().optional(),
      barCouncilId: z.string().optional(),
      practiceAreas: z.array(z.string()),
      specializations: z.array(z.string()).optional(),
      experience: z.number(),
      languages: z.array(z.string()),
      location: z.object({
        country: z.string(),
        state: z.string(),
        city: z.string()
      }),
      hourlyRate: z.number(),
      consultationModes: z.array(z.string()).optional()
    })
  })),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.uid;
      const userRole = (req as any).user?.role;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      // Check if user is already a lawyer
      const existingProfile = await lawyerMarketplaceService.getLawyerProfile(userId);
      if (existingProfile) {
        return res.status(400).json({ 
          success: false, 
          error: 'User is already registered as a lawyer' 
        });
      }

      // Only allow users with 'user' role to register as lawyers
      if (userRole !== 'user') {
        return res.status(403).json({ 
          success: false, 
          error: 'Only regular users can register as lawyers' 
        });
      }

      const lawyer = await lawyerMarketplaceService.registerLawyer({
        ...req.body,
        userId
      });
      res.json({ success: true, lawyer });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Get lawyer profile
router.get('/profile',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.uid;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      const profile = await lawyerMarketplaceService.getLawyerProfile(userId);
      res.json({ success: true, profile });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Update lawyer profile
router.put('/profile',
  authenticate,
  validateRequest({
    schema: z.object({
      name: z.string().optional(),
      profilePhoto: z.string().optional(),
      about: z.string().optional(),
      barCouncilId: z.string().optional(),
      practiceAreas: z.array(z.string()).optional(),
      specializations: z.array(z.string()).optional(),
      experience: z.number().optional(),
      languages: z.array(z.string()).optional(),
      location: z.object({
        country: z.string(),
        state: z.string(),
        city: z.string()
      }).optional(),
      hourlyRate: z.number().optional(),
      consultationModes: z.array(z.string()).optional()
    })
  }),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.uid;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      const profile = await lawyerMarketplaceService.updateLawyerProfile(
        userId,
        req.body
      );
      res.json({ success: true, profile });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Get all lawyers
router.get('/',
  validateRequest({
    schema: z.object({
      practiceArea: z.string().optional(),
      location: z.string().optional(),
      minExperience: z.number().optional(),
      maxHourlyRate: z.number().optional()
    })
  }),
  async (req: Request, res: Response) => {
    try {
      const lawyers = await lawyerMarketplaceService.getAllLawyers(req.query);
      res.json({ success: true, lawyers });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Get specific lawyer details
router.get('/:id',
  async (req: Request, res: Response) => {
    try {
      const lawyer = await lawyerMarketplaceService.getLawyerById(
        parseInt(req.params.id)
      );
      res.json({ success: true, lawyer });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Set availability slots
router.post('/availability',
  authenticate,
  validateRequest({
    schema: z.array(z.object({
      day: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      isAvailable: z.boolean()
    }))
  }),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.uid;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      const availability = await lawyerMarketplaceService.setAvailability(
        userId,
        req.body
      );
      res.json({ success: true, availability });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Get own availability
router.get('/availability',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.uid;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      const availability = await lawyerMarketplaceService.getAvailability(
        userId
      );
      res.json({ success: true, availability });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Get lawyer's availability
router.get('/:id/availability',
  async (req: Request, res: Response) => {
    try {
      const availability = await lawyerMarketplaceService.getLawyerAvailability(
        parseInt(req.params.id)
      );
      res.json({ success: true, availability });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Update availability slot
router.put('/availability/:id',
  authenticate,
  validateRequest({
    schema: z.object({
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      isAvailable: z.boolean().optional()
    })
  }),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.uid;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      const availability = await lawyerMarketplaceService.updateAvailabilitySlot(
        userId,
        req.params.id,
        req.body
      );
      res.json({ success: true, availability });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Delete availability slot
router.delete('/availability/:id',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.uid;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      const availability = await lawyerMarketplaceService.deleteAvailabilitySlot(
        userId,
        req.params.id
      );
      res.json({ success: true, availability });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

export default router; 