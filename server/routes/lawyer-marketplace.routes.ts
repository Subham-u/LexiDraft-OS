import { Router } from 'express';
import { lawyerMarketplaceService } from '../services/lawyer-marketplace.service';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

// Register as a lawyer
router.post('/register',
  authenticate,
  validateRequest({
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
  }),
  async (req, res) => {
    try {
      const lawyer = await lawyerMarketplaceService.registerLawyer({
        ...req.body,
        userId: req.user.uid
      });
      res.json({ success: true, lawyer });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Get lawyer profile
router.get('/profile',
  authenticate,
  async (req, res) => {
    try {
      const profile = await lawyerMarketplaceService.getLawyerProfile(req.user.uid);
      res.json({ success: true, profile });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Update lawyer profile
router.put('/profile',
  authenticate,
  validateRequest({
    body: z.object({
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
  async (req, res) => {
    try {
      const profile = await lawyerMarketplaceService.updateLawyerProfile(
        req.user.uid,
        req.body
      );
      res.json({ success: true, profile });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Get all lawyers
router.get('/',
  validateRequest({
    query: z.object({
      practiceArea: z.string().optional(),
      location: z.string().optional(),
      minExperience: z.number().optional(),
      maxHourlyRate: z.number().optional()
    })
  }),
  async (req, res) => {
    try {
      const lawyers = await lawyerMarketplaceService.getAllLawyers(req.query);
      res.json({ success: true, lawyers });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Get specific lawyer details
router.get('/:id',
  async (req, res) => {
    try {
      const lawyer = await lawyerMarketplaceService.getLawyerById(
        parseInt(req.params.id)
      );
      res.json({ success: true, lawyer });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Set availability slots
router.post('/availability',
  authenticate,
  validateRequest({
    body: z.array(z.object({
      day: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      isAvailable: z.boolean()
    }))
  }),
  async (req, res) => {
    try {
      const availability = await lawyerMarketplaceService.setAvailability(
        req.user.uid,
        req.body
      );
      res.json({ success: true, availability });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Get own availability
router.get('/availability',
  authenticate,
  async (req, res) => {
    try {
      const availability = await lawyerMarketplaceService.getAvailability(
        req.user.uid
      );
      res.json({ success: true, availability });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Get lawyer's availability
router.get('/:id/availability',
  async (req, res) => {
    try {
      const availability = await lawyerMarketplaceService.getLawyerAvailability(
        parseInt(req.params.id)
      );
      res.json({ success: true, availability });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Update availability slot
router.put('/availability/:id',
  authenticate,
  validateRequest({
    body: z.object({
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      isAvailable: z.boolean().optional()
    })
  }),
  async (req, res) => {
    try {
      const availability = await lawyerMarketplaceService.updateAvailabilitySlot(
        req.user.uid,
        req.params.id,
        req.body
      );
      res.json({ success: true, availability });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

// Delete availability slot
router.delete('/availability/:id',
  authenticate,
  async (req, res) => {
    try {
      const availability = await lawyerMarketplaceService.deleteAvailabilitySlot(
        req.user.uid,
        req.params.id
      );
      res.json({ success: true, availability });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

export default router; 