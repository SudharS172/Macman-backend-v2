import { Response } from 'express';
import { AuthRequest } from '../types';
import { updateService } from '../services/update.service';
import { asyncHandler } from '../middleware/errorHandler';
import path from 'path';
import fs from 'fs';
import { config } from '../config/env';

export class UpdateController {
  /**
   * GET /api/v2/updates/check
   * Check for available updates
   */
  checkForUpdate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { version, platform = 'darwin', userId } = req.query;

    if (!version || !userId) {
      return res.status(400).json({
        success: false,
        error: 'version and userId are required',
      });
    }

    const result = await updateService.checkForUpdate({
      version: version as string,
      platform: platform as string,
      userId: userId as string,
      appVersion: req.query.appVersion as string,
    });

    return res.json(result);
  });

  /**
   * GET /api/v2/updates/download/:version
   * Download a specific update version
   */
  downloadUpdate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { version } = req.params;

    const update = await updateService.getUpdateByVersion(version);

    // Increment download count
    await updateService.incrementDownloadCount(version);

    // Serve the DMG file
    const filePath = path.join(config.uploadDir, update.filename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        error: 'Update file not found',
      });
      return;
    }

    const stat = fs.statSync(filePath);

    res.setHeader('Content-Type', 'application/x-apple-diskimage');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', `attachment; filename="${update.filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  });

  /**
   * POST /api/v2/updates/history
   * Record update history
   */
  recordHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId, toVersion, status, errorMessage } = req.body;

    if (status === 'started') {
      // This is a new update attempt - handled in checkForUpdate
      return res.json({ success: true });
    }

    // Update existing history entry
    await updateService.updateHistoryStatus(
      userId,
      toVersion,
      status,
      errorMessage
    );

    return res.json({
      success: true,
      message: 'Update history recorded',
    });
  });

  /**
   * POST /api/admin/updates
   * Create a new update (admin only)
   */
  createUpdate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const update = await updateService.createUpdate(req.body);

    return res.status(201).json({
      success: true,
      data: update,
      message: 'Update created successfully',
    });
  });

  /**
   * GET /api/admin/updates
   * Get all updates (admin only)
   */
  getAllUpdates = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await updateService.getAllUpdates(page, limit);

    return res.json({
      success: true,
      ...result,
    });
  });

  /**
   * POST /api/admin/updates/:version/deactivate
   * Deactivate an update (admin only)
   */
  deactivateUpdate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { version } = req.params;

    const update = await updateService.deactivateUpdate(version);

    return res.json({
      success: true,
      data: update,
      message: 'Update deactivated successfully',
    });
  });

  /**
   * GET /api/admin/updates/stats
   * Get update statistics (admin only)
   */
  getStatistics = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const stats = await updateService.getStatistics();

    return res.json({
      success: true,
      data: stats,
    });
  });
}

export const updateController = new UpdateController();

