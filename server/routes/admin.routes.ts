/**
 * Admin routes for system administration
 */
import express, { Router, Request, Response } from 'express';
import { asyncHandler, ApiError } from '../middleware/error';
import { authenticate, requireRole } from '../middleware/auth';
import { createLogger } from '../utils/logger';
import { getMigrationStatus } from '../db/migrations';
import { getCurrentSchemaVersion, getSchemaVersionHistory, recordSchemaVersion } from '../db/schema-audit';
import { exec } from 'child_process';
import path from 'path';

const router: Router = express.Router();
const logger = createLogger('admin-routes');

/**
 * Get database migration status
 * @route GET /api/admin/migrations/status
 */
router.get("/migrations/status", authenticate(), requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  logger.info('Admin requesting migration status');
  
  const status = await getMigrationStatus();
  
  return res.json({
    success: true,
    data: status
  });
}));

/**
 * Generate migrations
 * @route POST /api/admin/migrations/generate
 */
router.post("/migrations/generate", authenticate(), requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  logger.info('Admin generating migrations');
  
  const migrationScript = path.join(process.cwd(), 'bin', 'migrations.js');
  
  exec(`node ${migrationScript} generate`, (error, stdout, stderr) => {
    if (error) {
      logger.error(`Error generating migrations: ${error.message}`);
      throw ApiError.internal('Failed to generate migrations');
    }
    
    if (stderr) {
      logger.error(`Migration generation errors: ${stderr}`);
    }
    
    return res.json({
      success: true,
      message: 'Migrations generated successfully',
      output: stdout
    });
  });
}));

/**
 * Apply migrations
 * @route POST /api/admin/migrations/apply
 */
router.post("/migrations/apply", authenticate(), requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  logger.info('Admin applying migrations');
  
  const migrationScript = path.join(process.cwd(), 'bin', 'migrations.js');
  
  exec(`node ${migrationScript} apply`, (error, stdout, stderr) => {
    if (error) {
      logger.error(`Error applying migrations: ${error.message}`);
      throw ApiError.internal('Failed to apply migrations');
    }
    
    if (stderr) {
      logger.error(`Migration application errors: ${stderr}`);
    }
    
    return res.json({
      success: true,
      message: 'Migrations applied successfully',
      output: stdout
    });
  });
}));

/**
 * Get system information
 * @route GET /api/admin/system
 */
router.get("/system", authenticate(), requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  logger.info('Admin requesting system information');
  
  // Get system information
  const systemInfo = {
    nodeVersion: process.version,
    platform: process.platform,
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV
  };
  
  return res.json({
    success: true,
    data: systemInfo
  });
}));

/**
 * Get current schema version
 * @route GET /api/admin/schema/version
 */
router.get("/schema/version", authenticate(), requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  logger.info('Admin requesting current schema version');
  
  const version = await getCurrentSchemaVersion();
  
  return res.json({
    success: true,
    data: version
  });
}));

/**
 * Get schema version history
 * @route GET /api/admin/schema/history
 */
router.get("/schema/history", authenticate(), requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  logger.info('Admin requesting schema version history');
  
  const history = await getSchemaVersionHistory();
  
  return res.json({
    success: true,
    data: history
  });
}));

/**
 * Record a new schema version
 * @route POST /api/admin/schema/version
 */
router.post("/schema/version", authenticate(), requireRole('admin'), asyncHandler(async (req: Request, res: Response) => {
  const { version, description } = req.body;
  
  if (!version || !description) {
    throw ApiError.badRequest('Version and description are required');
  }
  
  logger.info(`Admin recording new schema version: ${version}`);
  
  const updatedVersion = await recordSchemaVersion(
    version,
    description,
    req.user?.username || 'admin'
  );
  
  return res.json({
    success: true,
    data: updatedVersion
  });
}));

export default router;