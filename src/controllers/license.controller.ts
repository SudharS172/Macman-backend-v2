import { Response } from 'express';
import { AuthRequest } from '../types';
import { licenseService } from '../services/license.service';
import { asyncHandler } from '../middleware/errorHandler';

export class LicenseController {
  /**
   * POST /api/licenses/validate
   * Validate a license key
   */
  validateLicense = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { license_key, machine_id, device_name, os_version, app_version } = req.body;

    const result = await licenseService.validateLicense({
      licenseKey: license_key,
      machineId: machine_id,
      deviceName: device_name,
      osVersion: os_version,
      appVersion: app_version,
    });

    return res.status(result.valid ? 200 : 400).json(result);
  });

  /**
   * POST /api/admin/licenses
   * Create a new license (admin only)
   */
  createLicense = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, plan, max_devices } = req.body;

    const license = await licenseService.createLicense({
      email,
      plan,
      maxDevices: max_devices,
    });

    return res.status(201).json({
      success: true,
      data: license,
    });
  });

  /**
   * GET /api/admin/licenses/:licenseKey
   * Get license information (admin only)
   */
  getLicenseInfo = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { licenseKey } = req.params;

    const license = await licenseService.getLicenseInfo(licenseKey);

    return res.json({
      success: true,
      data: license,
    });
  });

  /**
   * GET /api/admin/licenses
   * Get all licenses with pagination (admin only)
   */
  getAllLicenses = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await licenseService.getAllLicenses(page, limit);

    return res.json({
      success: true,
      ...result,
    });
  });

  /**
   * POST /api/admin/licenses/:licenseKey/deactivate
   * Deactivate a license (admin only)
   */
  deactivateLicense = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { licenseKey } = req.params;

    const license = await licenseService.deactivateLicense(licenseKey);

    return res.json({
      success: true,
      data: license,
      message: 'License deactivated successfully',
    });
  });

  /**
   * DELETE /api/admin/licenses/:licenseKey/devices/:machineId
   * Deactivate a specific device (admin only)
   */
  deactivateDevice = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { licenseKey, machineId } = req.params;

    await licenseService.deactivateDevice(licenseKey, machineId);

    return res.json({
      success: true,
      message: 'Device deactivated successfully',
    });
  });

  /**
   * GET /api/admin/licenses/stats
   * Get license statistics (admin only)
   */
  getStatistics = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const stats = await licenseService.getStatistics();

    return res.json({
      success: true,
      data: stats,
    });
  });
}

export const licenseController = new LicenseController();

