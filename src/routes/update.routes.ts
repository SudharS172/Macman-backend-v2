import { Router } from 'express';
import { updateController } from '../controllers/update.controller';
import { requireAdminSecret } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

// Validation schemas
const checkUpdateSchema = z.object({
  version: z.string().min(1, 'Version is required'),
  platform: z.string().default('darwin'),
  userId: z.string().min(1, 'User ID is required'),
  appVersion: z.string().optional(),
});

const recordHistorySchema = z.object({
  userId: z.string().min(1),
  fromVersion: z.string().min(1),
  toVersion: z.string().min(1),
  status: z.enum(['started', 'completed', 'failed']),
  errorMessage: z.string().optional(),
});

const createUpdateSchema = z.object({
  version: z.string().min(1),
  buildNumber: z.number().int().positive(),
  releaseType: z.enum(['normal', 'forced', 'beta']).default('normal'),
  filename: z.string().min(1),
  fileSize: z.number().int().positive(),
  checksum: z.string().min(1),
  releaseNotes: z.string().default(''),
  forceUpdate: z.boolean().default(false),
});

// Public routes
router.get(
  '/check',
  validateQuery(checkUpdateSchema),
  updateController.checkForUpdate
);

router.get(
  '/download/:version',
  updateController.downloadUpdate
);

router.post(
  '/history',
  validateBody(recordHistorySchema),
  updateController.recordHistory
);

// Admin routes
router.post(
  '/admin/updates',
  requireAdminSecret,
  validateBody(createUpdateSchema),
  updateController.createUpdate
);

router.get(
  '/admin/updates',
  requireAdminSecret,
  updateController.getAllUpdates
);

router.get(
  '/admin/updates/stats',
  requireAdminSecret,
  updateController.getStatistics
);

router.post(
  '/admin/updates/:version/deactivate',
  requireAdminSecret,
  updateController.deactivateUpdate
);

export default router;

