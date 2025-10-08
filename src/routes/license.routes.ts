import { Router } from 'express';
import { licenseController } from '../controllers/license.controller';
import { requireAdminSecret } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

// Validation schemas
const validateLicenseSchema = z.object({
  license_key: z.string().min(1, 'License key is required'),
  machine_id: z.string().min(1, 'Machine ID is required'),
  device_name: z.string().optional(),
  os_version: z.string().optional(),
  app_version: z.string().optional(),
});

const createLicenseSchema = z.object({
  email: z.string().email().optional(),
  plan: z.enum(['Individual', '2 Devices', '5 Devices', 'Enterprise']),
  max_devices: z.number().int().positive().optional(),
});

// Public routes
router.post(
  '/validate',
  validateBody(validateLicenseSchema),
  licenseController.validateLicense
);

// Admin routes
router.post(
  '/admin/licenses',
  requireAdminSecret,
  validateBody(createLicenseSchema),
  licenseController.createLicense
);

router.get(
  '/admin/licenses',
  requireAdminSecret,
  licenseController.getAllLicenses
);

router.get(
  '/admin/licenses/stats',
  requireAdminSecret,
  licenseController.getStatistics
);

router.get(
  '/admin/licenses/:licenseKey',
  requireAdminSecret,
  licenseController.getLicenseInfo
);

router.post(
  '/admin/licenses/:licenseKey/deactivate',
  requireAdminSecret,
  licenseController.deactivateLicense
);

router.delete(
  '/admin/licenses/:licenseKey/devices/:machineId',
  requireAdminSecret,
  licenseController.deactivateDevice
);

export default router;

